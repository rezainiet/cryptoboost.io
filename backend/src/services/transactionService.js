// services/transactionService.js
const axios = require("axios");
const { Connection, PublicKey } = require('@solana/web3.js');
const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";

async function getBTCLatestTx(address) {
    try {
        const { data } = await axios.get(`https://blockstream.info/api/address/${address}/txs`);
        if (!Array.isArray(data) || data.length === 0) return null;
        return data[0].txid;
    } catch (err) {
        console.error("BTC tx hash error:", err.message);
        return null;
    }
}

async function getBTCConfirmations(txHash) {
    try {
        const { data } = await axios.get(`https://blockstream.info/api/tx/${txHash}`);
        return data.status?.confirmations || 0;
    } catch (err) {
        console.error("BTC confirmations error:", err.message);
        return 0;
    }
}

async function getETHLatestTx(address) {
    try {
        const { data } = await axios.get(
            `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${process.env.ETHERSCAN_KEY}`
        );
        if (!data.result || data.result.length === 0) return null;
        return data.result[0].hash;
    } catch (err) {
        console.error("ETH tx hash error:", err.message);
        return null;
    }
}

async function getETHConfirmations(txHash) {
    try {
        const { data } = await axios.get(
            `https://api.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${process.env.ETHERSCAN_KEY}`
        );
        return data.result?.status === "1" ? 1 : 0;
    } catch (err) {
        console.error("ETH confirmations error:", err.message);
        return 0;
    }
}

async function getTRXLatestTx(address) {
    try {
        const { data } = await axios.get(
            `https://api.trongrid.io/v1/accounts/${address}/transactions?limit=1&sort=-timestamp`,
            { headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_KEY } }
        );
        if (!data.data || data.data.length === 0) return null;
        return data.data[0].txID;
    } catch (err) {
        console.error("TRX tx hash error:", err.message);
        return null;
    }
}

async function getTRXConfirmations(txHash) {
    try {
        const { data } = await axios.get(
            `https://api.trongrid.io/v1/transactions/${txHash}`,
            { headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_KEY } }
        );
        return data.confirmed ? 1 : 0;
    } catch (err) {
        console.error("TRX confirmations error:", err.message);
        return 0;
    }
}

async function getSOLLatestTx(address) {
    try {
        const connection = new Connection(SOLANA_RPC);
        const publicKey = new PublicKey(address);
        // Use getSignaturesForAddress instead of deprecated getConfirmedSignaturesForAddress2
        const txs = await connection.getSignaturesForAddress(publicKey, { limit: 1 });
        return txs[0]?.signature || null;
    } catch (err) {
        console.error("SOL tx hash error:", err.message);
        return null;
    }
}

async function getSOLConfirmations(txHash) {
    try {
        // Validate txHash format first
        if (!txHash || txHash.length !== 88) {
            console.error("Invalid SOL tx hash format");
            return 0;
        }

        const connection = new Connection(SOLANA_RPC);
        const status = await connection.getSignatureStatus(txHash, {
            searchTransactionHistory: true
        });

        // Modern confirmation check
        if (status.value?.confirmationStatus === "finalized") {
            return 1;
        }
        return 0;
    } catch (err) {
        console.error("SOL confirmations error:", err.message);
        return 0;
    }
}

async function getLatestTxHash(network, address) {
    const networkUpper = network.toUpperCase();
    try {
        switch (networkUpper) {
            case "BTC":
                return await getBTCLatestTx(address);
            case "ETH":
            case "USDT":
            case "USDC":
                return await getETHLatestTx(address);
            case "TRX":
            case "TRC":
                return await getTRXLatestTx(address);
            case "SOL":
                return await getSOLLatestTx(address);
            default:
                throw new Error(`Unsupported network: ${network}`);
        }
    } catch (err) {
        console.error(`Failed to get tx hash for ${network}:`, err.message);
        return null;
    }
}

async function getConfirmations(network, txHash) {
    const networkUpper = network.toUpperCase();
    try {
        switch (networkUpper) {
            case "BTC":
                return await getBTCConfirmations(txHash);
            case "ETH":
            case "USDT":
            case "USDC":
                return await getETHConfirmations(txHash);
            case "TRX":
            case "TRC":
                return await getTRXConfirmations(txHash);
            case "SOL":
                return await getSOLConfirmations(txHash);
            default:
                throw new Error(`Unsupported network: ${network}`);
        }
    } catch (err) {
        console.error(`Failed to get confirmations for ${network}:`, err.message);
        return 0;
    }
}

module.exports = {
    getLatestTxHash,
    getConfirmations,
};