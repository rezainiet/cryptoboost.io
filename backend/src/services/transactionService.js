// services/transactionService.js
// Responsible for fetching latest transaction hash and confirmations for an address

const axios = require("axios");

// ---------------- BTC ----------------
async function getLatestTxHashBTC(address) {
    const url = `https://blockstream.info/api/address/${address}/txs`;
    const { data } = await axios.get(url);
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0].txid; // latest tx
}

async function getConfirmationsBTC(txHash) {
    const url = `https://blockstream.info/api/tx/${txHash}`;
    const { data } = await axios.get(url);
    return data.status?.confirmations || 0;
}

// ---------------- ETH ----------------
async function getLatestTxHashETH(address) {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${process.env.ETHERSCAN_KEY}`;
    const { data } = await axios.get(url);
    if (!data.result || data.result.length === 0) return null;
    return data.result[0].hash;
}

async function getConfirmationsETH(txHash) {
    const url = `https://api.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${process.env.ETHERSCAN_KEY}`;
    const { data } = await axios.get(url);
    // etherscan doesn't directly give confirmations, so return 1 if successful, else 0
    return data.result?.status === "1" ? 1 : 0;
}

// ---------------- TRX ----------------
async function getLatestTxHashTRX(address) {
    const url = `https://api.trongrid.io/v1/accounts/${address}/transactions?limit=1&sort=-timestamp`;
    const { data } = await axios.get(url, {
        headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_KEY }
    });
    if (!data.data || data.data.length === 0) return null;
    return data.data[0].txID;
}

async function getConfirmationsTRX(txHash) {
    const url = `https://api.trongrid.io/v1/transactions/${txHash}`;
    const { data } = await axios.get(url, {
        headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_KEY }
    });
    return data.confirmed ? 1 : 0;
}

// ---------------- Main dispatcher ----------------
async function getLatestTxHash(network, address) {
    switch (network.toUpperCase()) {
        case "BTC": return await getLatestTxHashBTC(address);
        case "ETH": return await getLatestTxHashETH(address);
        case "TRX":
        case "TRC": return await getLatestTxHashTRX(address);
        default: throw new Error(`Unsupported network for txHash: ${network}`);
    }
}

async function getConfirmations(network, txHash) {
    switch (network.toUpperCase()) {
        case "BTC": return await getConfirmationsBTC(txHash);
        case "ETH": return await getConfirmationsETH(txHash);
        case "TRX":
        case "TRC": return await getConfirmationsTRX(txHash);
        default: throw new Error(`Unsupported network for confirmations: ${network}`);
    }
}

module.exports = {
    getLatestTxHash,
    getConfirmations,
};
