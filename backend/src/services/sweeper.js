// services/sweeper.js
const { ethers } = require("ethers");
const { TronWeb } = require("tronweb");
const { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, PublicKey } = require('@solana/web3.js');
const bitcoin = require('bitcoinjs-lib');
const { deriveAddressByNetwork } = require("./hdWallet");
const dotenv = require('dotenv');
const axios = require('axios');
const { sweepBTC } = require("./btcSweeper");

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
        FEE_RATE: 10 // satoshis per byte
    }
};

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

async function sweepSOL(index) {
    try {
        // Skip index 0 (main wallet)
        if (index === 0) return null;

        const fromWallet = deriveAddressByNetwork("SOL", index);
        const toWallet = deriveAddressByNetwork("SOL", 0);
        const connection = new Connection(SOLANA_RPC, 'confirmed');
        const fromKeypair = Keypair.fromSecretKey(Buffer.from(fromWallet.privateKey, 'hex'));

        // Check balance first
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

        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: new PublicKey(toWallet.address),
                lamports: amountToSend,
            })
        );

        const txHash = await sendAndConfirmTransaction(
            connection,
            tx,
            [fromKeypair],
            { commitment: 'confirmed' }
        );

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