// services/sweeper.js
const { ethers } = require("ethers");
const { TronWeb } = require("tronweb");
const { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, PublicKey } = require('@solana/web3.js');
const bitcoin = require('bitcoinjs-lib');
const { deriveAddressByNetwork, deriveBTCAddress } = require("./hdWallet");
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Initialize providers
const ETH_PROVIDER = new ethers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
    undefined,
    { staticNetwork: true }
);

const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const BTC_NETWORK = bitcoin.networks.bitcoin;

// Token addresses and ABIs
const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function approve(address, uint256) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

const TOKEN_ADDRESSES = {
    USDT: ethers.getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
    USDC: ethers.getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
};

// Gas configuration
const GAS_CONFIG = {
    ETH: {
        BASE_LIMIT: 21000,
        MIN_BALANCE: ethers.parseEther("0.001")
    },
    ERC20: {
        APPROVE_LIMIT: 100000,
        TRANSFER_LIMIT: 200000,
        BUFFER_MULTIPLIER: 2n
    },
    SOL: {
        FEE_RESERVE: 0.001 * 1e9 // 0.001 SOL
    },
    BTC: {
        FEE_RATE: 15, // satoshis per byte (more conservative)
        DUST_LIMIT: 546 // minimum output in satoshis
    }
};


async function verifyBTCTx(txid, timeout = 60000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            const { data } = await axios.get(`https://blockstream.info/api/tx/${txid}`);
            if (data.status.confirmed) return true;
        } catch (err) {
            // Ignore temporary errors
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    return false;
}


// Main wallet management
let mainWallet;
function getMainWallet() {
    if (!mainWallet) {
        if (!process.env.MNEMONIC) throw new Error("MNEMONIC not found");
        mainWallet = ethers.HDNodeWallet.fromPhrase(
            process.env.MNEMONIC,
            undefined,
            "m/44'/60'/0'/0/0"
        ).connect(ETH_PROVIDER);
    }
    return mainWallet;
}

// Background sweeping state
let isSweeping = false;
const sweepQueue = new Map();

// Core sweeping functions
async function sweepBTC(index) {
    try {
        if (index === 0) return null; // Skip main wallet

        const fromWallet = deriveAddressByNetwork("BTC", index);
        const toWallet = deriveAddressByNetwork("BTC", 0);

        // 1. Get UTXOs including unconfirmed transactions
        const utxos = await getBTCUtxosWithData(fromWallet.address, true);
        if (utxos.length === 0) {
            console.log(`No BTC balance at index ${index}`);
            return null;
        }

        // 2. Filter and sort UTXOs (newest first)
        const validUtxos = utxos
            .filter(utxo => utxo.value > 0)
            .sort((a, b) => b.status.block_time - a.status.block_time);

        if (validUtxos.length === 0) {
            console.log(`No spendable BTC at index ${index}`);
            return null;
        }

        // 3. Calculate total balance (using only confirmed UTXOs for safety)
        const confirmedUtxos = validUtxos.filter(utxo => utxo.status.confirmed);
        const totalSats = confirmedUtxos.reduce((sum, utxo) => sum + utxo.value, 0);

        // 4. Build transaction
        const psbt = new bitcoin.Psbt({
            network: BTC_NETWORK,
            maximumFeeRate: GAS_CONFIG.BTC.MAX_FEE_RATE // Prevent fee overpayment
        });

        // Add inputs with enhanced data
        for (const utxo of confirmedUtxos) {
            try {
                const txData = await getBTCTransaction(utxo.txid);
                const tx = bitcoin.Transaction.fromHex(txData);

                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: tx.outs[utxo.vout].script,
                        value: utxo.value
                    },
                    // Add for better fee estimation
                    bip32Derivation: [{
                        masterFingerprint: getRootNode().fingerprint,
                        path: `m/84'/0'/0'/0/${index}`,
                        pubkey: fromWallet.publicKey
                    }]
                });
            } catch (err) {
                console.warn(`Skipping UTXO ${utxo.txid}:${utxo.vout} due to error:`, err.message);
                continue;
            }
        }

        // Skip if no valid inputs
        if (psbt.txInputs.length === 0) {
            throw new Error("No valid UTXOs could be processed");
        }

        // 5. Dynamic fee calculation
        const feeRate = await getRecommendedFeeRate();
        const estimatedSize = psbt.txVirtualSize();
        const estimatedFee = Math.ceil(estimatedSize * feeRate);

        // Verify sufficient balance
        if (totalSats <= estimatedFee + GAS_CONFIG.BTC.DUST_LIMIT) {
            throw new Error(`Insufficient BTC (${totalSats / 1e8}) for fee (${estimatedFee / 1e8}) + dust limit`);
        }

        // 6. Add output (total - fee)
        psbt.addOutput({
            address: toWallet.address,
            value: totalSats - estimatedFee
        });

        // 7. Sign all inputs
        const childNode = getRootNode().derivePath(`m/84'/0'/0'/0/${index}`);

        for (let i = 0; i < psbt.txInputs.length; i++) {
            psbt.signInput(i, childNode);
            if (!psbt.validateSignaturesOfInput(i)) {
                throw new Error(`Invalid signature for input ${i}`);
            }
        }

        // 8. Finalize and broadcast
        psbt.finalizeAllInputs();
        const tx = psbt.extractTransaction();
        const txHex = tx.toHex();

        // Verify before broadcasting
        if (!tx.ins.length || !tx.outs.length) {
            throw new Error("Invalid transaction structure");
        }

        // Broadcast with enhanced verification
        const txid = await broadcastBTCTransactionWithVerification(txHex, fromWallet.address);

        console.log(`✅ BTC swept ${(totalSats - estimatedFee) / 1e8} BTC. TX: ${txid}`);
        await verifyBTCTx(txid); // Wait for initial confirmation

        return txid;

    } catch (err) {
        console.error(`❌ BTC sweep failed for index ${index}:`, err.message);

        // Additional debug info
        if (err.details) {
            console.error('Error details:', err.details);
        }

        return null;
    }
}

// New helper functions
async function getBTCUtxosWithData(address, includeUnconfirmed = false) {
    try {
        const url = `https://blockstream.info/api/address/${address}/utxo` +
            (includeUnconfirmed ? '?include_unconfirmed=true' : '');
        const { data } = await axios.get(url, { timeout: 10000 });
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error("BTC UTXO fetch error:", err.message);
        throw new Error("Failed to fetch UTXOs", { details: { address, err } });
    }
}

async function getRecommendedFeeRate() {
    try {
        const { data } = await axios.get('https://blockstream.info/api/fee-estimates');
        return Math.ceil(data['2']); // Target 2-block confirmation
    } catch (err) {
        console.warn("Using fallback fee rate", err.message);
        return GAS_CONFIG.BTC.FEE_RATE; // Default fallback
    }
}

async function broadcastBTCTransactionWithVerification(txHex, sourceAddress) {
    try {
        // First broadcast
        const { data: txid } = await axios.post(
            'https://blockstream.info/api/tx',
            txHex,
            {
                headers: { 'Content-Type': 'text/plain' },
                timeout: 15000
            }
        );

        // Immediate verification
        const verified = await verifyTransactionInMempool(txid, sourceAddress);
        if (!verified) {
            throw new Error("Transaction not found in mempool after broadcast");
        }

        return txid;
    } catch (err) {
        console.error("Broadcast failed:", err.message);
        throw new Error("Transaction broadcast failed", { details: { err } });
    }
}

async function verifyTransactionInMempool(txid, address) {
    try {
        // Check both transaction and address mempool
        const [txResponse, addrResponse] = await Promise.all([
            axios.get(`https://blockstream.info/api/tx/${txid}/status`),
            axios.get(`https://blockstream.info/api/address/${address}/txs/mempool`)
        ]);

        return txResponse.data.confirmed === false ||
            addrResponse.data.some(tx => tx.txid === txid);
    } catch (err) {
        console.warn("Mempool verification failed:", err.message);
        return false;
    }
}


async function getBTCUtxosWithData(address) {
    try {
        const { data } = await axios.get(`https://blockstream.info/api/address/${address}/utxo`);
        if (!Array.isArray(data)) throw new Error("Invalid UTXO data");

        // Filter out unconfirmed UTXOs
        return data.filter(utxo => utxo.status && utxo.status.confirmed);
    } catch (err) {
        console.error("BTC UTXO fetch error:", err.message);
        return [];
    }
}

async function getBTCTransaction(txid) {
    try {
        const { data } = await axios.get(`https://blockstream.info/api/tx/${txid}/hex`);
        return data;
    } catch (err) {
        console.error("BTC transaction fetch error:", err.message);
        throw err;
    }
}

async function broadcastBTCTransactionWithRetry(txHex, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const { data } = await axios.post(
                'https://blockstream.info/api/tx',
                txHex,
                {
                    headers: { 'Content-Type': 'text/plain' },
                    timeout: 10000
                }
            );
            return data;
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        }
    }
}

async function getBTCUtxos(address) {
    try {
        // Add ?include_unconfirmed=true to see pending transactions
        const { data } = await axios.get(
            `https://blockstream.info/api/address/${address}/utxo?include_unconfirmed=true`
        );
        return data || [];
    } catch (err) {
        console.error("BTC UTXO fetch error:", err.message);
        return [];
    }
}


async function sweepETH(index) {
    try {
        // Skip index 0 (main wallet)
        if (index === 0) return null;

        const fromWallet = deriveAddressByNetwork("ETH", index);
        const toWallet = deriveAddressByNetwork("ETH", 0);

        // Check balance first
        const balance = await ETH_PROVIDER.getBalance(fromWallet.address);
        if (balance <= 0n) {
            console.log(`No ETH balance at index ${index}`);
            return null;
        }

        const feeData = await ETH_PROVIDER.getFeeData();
        const estimatedFee = feeData.gasPrice * BigInt(GAS_CONFIG.ETH.BASE_LIMIT);
        const amountToSend = balance - estimatedFee;

        if (amountToSend <= 0n) {
            console.log(`Insufficient ETH (${ethers.formatEther(balance)}) for gas at index ${index}`);
            return null;
        }

        const wallet = new ethers.Wallet(fromWallet.privateKey, ETH_PROVIDER);
        const tx = await wallet.sendTransaction({
            to: toWallet.address,
            value: amountToSend,
            gasPrice: feeData.gasPrice,
            gasLimit: GAS_CONFIG.ETH.BASE_LIMIT
        });

        console.log(`✅ ETH swept ${ethers.formatEther(amountToSend)}. TX: ${tx.hash}`);
        return tx.hash;
    } catch (err) {
        console.error(`❌ ETH sweep failed for index ${index}:`, err.message);
        return null;
    }
}

async function sweepERC20(tokenAddress, fromIndex, decimals = 6) {
    try {
        // Skip index 0 (main wallet)
        if (fromIndex === 0) return null;

        const fromWallet = deriveAddressByNetwork("ETH", fromIndex);
        const toWallet = deriveAddressByNetwork("ETH", 0);
        const wallet = new ethers.Wallet(fromWallet.privateKey, ETH_PROVIDER);
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

        // Check token balance
        const balance = await tokenContract.balanceOf(fromWallet.address);
        if (balance <= 0n) {
            console.log(`No token balance at index ${fromIndex}`);
            return null;
        }

        // Check and fund gas
        const feeData = await ETH_PROVIDER.getFeeData();
        const requiredGas = feeData.gasPrice * BigInt(
            GAS_CONFIG.ERC20.APPROVE_LIMIT + GAS_CONFIG.ERC20.TRANSFER_LIMIT
        );

        const ethBalance = await ETH_PROVIDER.getBalance(fromWallet.address);
        if (ethBalance < requiredGas) {
            console.log(`Funding gas for ERC20 sweep at index ${fromIndex}`);
            const fundTx = await getMainWallet().sendTransaction({
                to: fromWallet.address,
                value: requiredGas * GAS_CONFIG.ERC20.BUFFER_MULTIPLIER,
                gasLimit: GAS_CONFIG.ETH.BASE_LIMIT
            });
            await fundTx.wait();
        }

        // Get token decimals dynamically
        const tokenDecimals = await tokenContract.decimals();
        const tokenSymbol = await tokenContract.symbol();

        // Execute transfer
        const approveTx = await tokenContract.approve(
            toWallet.address,
            balance,
            { gasLimit: GAS_CONFIG.ERC20.APPROVE_LIMIT }
        );
        await approveTx.wait();

        const transferTx = await tokenContract.transfer(
            toWallet.address,
            balance,
            { gasLimit: GAS_CONFIG.ERC20.TRANSFER_LIMIT }
        );
        await transferTx.wait();

        console.log(`✅ ${tokenSymbol} swept ${ethers.formatUnits(balance, tokenDecimals)}. TX: ${transferTx.hash}`);
        return transferTx.hash;
    } catch (err) {
        console.error(`❌ ERC20 sweep failed for index ${fromIndex}:`, err.message);
        return null;
    }
}

async function verifySolanaTransaction(txHash) {
    const connection = new Connection(SOLANA_RPC);
    try {
        const status = await connection.getSignatureStatus(txHash);
        return status.value?.confirmationStatus === 'confirmed';
    } catch (err) {
        console.error('Transaction verification failed:', err);
        return false;
    }
}

async function sweepSOL(index) {
    try {
        if (index === 0) return null;

        const fromWallet = deriveAddressByNetwork("SOL", index);
        const toWallet = deriveAddressByNetwork("SOL", 0);
        const connection = new Connection(SOLANA_RPC, 'confirmed');
        const fromKeypair = Keypair.fromSecretKey(Buffer.from(fromWallet.privateKey, 'hex'));

        // Check balance
        const balance = await connection.getBalance(fromKeypair.publicKey);
        if (balance <= 0) {
            console.log(`No SOL balance at index ${index}`);
            return null;
        }

        const amountToSend = balance - GAS_CONFIG.SOL.FEE_RESERVE;
        if (amountToSend <= 0) {
            console.log(`Insufficient SOL (${balance / 1e9}) for gas at index ${index}`);
            return null;
        }

        // Create transaction
        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: new PublicKey(toWallet.address),
                lamports: amountToSend,
            })
        );

        // Send and confirm with timeout
        const txHash = await sendAndConfirmTransaction(
            connection,
            tx,
            [fromKeypair],
            {
                commitment: 'confirmed',
                preflightCommitment: 'confirmed',
                skipPreflight: false
            }
        );

        // Verify transaction
        const status = await connection.getSignatureStatus(txHash);
        if (!status.value || status.value.confirmationStatus !== 'confirmed') {
            throw new Error('Transaction not confirmed');
        }

        console.log(`✅ SOL swept ${amountToSend / 1e9}. TX: ${txHash}`);
        return txHash;
    } catch (err) {
        console.error(`❌ SOL sweep failed for index ${index}:`, err.message);
        return null;
    }
}

// Background sweeping logic
async function backgroundSweep(network, index) {
    // Skip index 0 (main wallet) for all networks
    if (index === 0) return null;

    if (isSweeping) {
        sweepQueue.set(`${network}-${index}`, { network, index });
        return null;
    }

    isSweeping = true;
    try {
        let result;
        switch (network.toUpperCase()) {
            case "BTC":
                result = await sweepBTC(index);
                break;
            case "ETH":
                result = await sweepETH(index);
                break;
            case "USDT":
                result = await sweepERC20(TOKEN_ADDRESSES.USDT, index);
                break;
            case "USDC":
                result = await sweepERC20(TOKEN_ADDRESSES.USDC, index);
                break;
            case "SOL":
                result = await sweepSOL(index);
                break;
            default:
                console.error(`Unsupported network: ${network}`);
                return null;
        }
        return result;
    } catch (err) {
        console.error(`Background sweep error for ${network}-${index}:`, err);
        return null;
    } finally {
        isSweeping = false;
        processSweepQueue();
    }
}

async function processSweepQueue() {
    if (sweepQueue.size > 0 && !isSweeping) {
        const [key, { network, index }] = sweepQueue.entries().next().value;
        sweepQueue.delete(key);
        await backgroundSweep(network, index);
    }
}

function startBackgroundSweeper(intervalMinutes = 15) {
    // Only process the queue periodically
    setInterval(processSweepQueue, intervalMinutes * 60 * 1000);
}

// Network-specific sweep function
async function sweepByNetwork(network, index) {
    return backgroundSweep(network, index);
}

module.exports = {
    sweepByNetwork,
    startBackgroundSweeper,
    sweepBTC,
    sweepETH,
    sweepERC20,
    sweepSOL
};