// services/networkBalanceChecker.js
const axios = require("axios");
const { ethers } = require("ethers");
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

const ETH_PROVIDER = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`);
const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";

const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];

async function getBTCBalance(address) {
    try {
        const { data } = await axios.get(`https://blockstream.info/api/address/${address}/utxo`);
        const sats = data.reduce((sum, utxo) => sum + utxo.value, 0);
        return sats / 1e8;
    } catch (err) {
        console.error("BTC balance check error:", err.message);
        return 0;
    }
}

async function getETHBalance(address) {
    try {
        const balance = await ETH_PROVIDER.getBalance(address);
        return Number(ethers.formatEther(balance));
    } catch (err) {
        console.error("ETH balance check error:", err.message);
        return 0;
    }
}

async function getERC20Balance(tokenContract, address) {
    try {
        const contract = new ethers.Contract(tokenContract, ERC20_ABI, ETH_PROVIDER);
        const balance = await contract.balanceOf(address);
        return Number(ethers.formatUnits(balance, 6));
    } catch (err) {
        console.error("ERC20 balance check error:", err.message);
        return 0;
    }
}

async function getTRXBalance(address) {
    try {
        const { data } = await axios.get(`https://api.trongrid.io/v1/accounts/${address}`);
        return (data.data[0]?.balance || 0) / 1e6;
    } catch (err) {
        console.error("TRX balance check error:", err.message);
        return 0;
    }
}

async function getSOLBalance(address) {
    try {
        const connection = new Connection(SOLANA_RPC);
        const publicKey = new PublicKey(address);
        const balance = await connection.getBalance(publicKey);
        return balance / LAMPORTS_PER_SOL;
    } catch (err) {
        console.error("SOL balance check error:", err.message);
        return 0;
    }
}

async function getReceivedByNetwork(network, address) {
    const networkUpper = network.toUpperCase();
    try {
        switch (networkUpper) {
            case "BTC":
                return await getBTCBalance(address);
            case "ETH":
                return await getETHBalance(address);
            case "USDT":
                return await getERC20Balance("0xdAC17F958D2ee523a2206206994597C13D831ec7", address);
            case "USDC":
                return await getERC20Balance("0xA0b86991C6218b36C1d19D4a2e9Eb0cE3606EB48", address);
            case "TRX":
            case "TRC":
                return await getTRXBalance(address);
            case "SOL":
                return await getSOLBalance(address);
            default:
                throw new Error(`Unsupported network: ${network}`);
        }
    } catch (err) {
        console.error(`Balance check failed for ${network}:`, err.message);
        return 0;
    }
}

module.exports = {
    getReceivedByNetwork
};