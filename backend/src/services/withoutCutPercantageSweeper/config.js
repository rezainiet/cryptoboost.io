// services/sweeper/config.js
const { ethers } = require("ethers")
const dotenv = require("dotenv")

dotenv.config()

// Initialize providers
const ETH_PROVIDER = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`, undefined, {
    staticNetwork: true,
})

const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com"

// Token addresses and ABIs
const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function approve(address, uint256) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
]

const TOKEN_ADDRESSES = {
    USDT: ethers.getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
    USDC: ethers.getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
}

// Gas configuration
const GAS_CONFIG = {
    ETH: {
        BASE_LIMIT: 21000,
        MIN_BALANCE: ethers.parseEther("0.001"),
    },
    ERC20: {
        APPROVE_LIMIT: 100000,
        TRANSFER_LIMIT: 200000,
        BUFFER_MULTIPLIER: 2n,
    },
    SOL: {
        FEE_RESERVE: 0.001 * 1e9, // 0.001 SOL
    },
    BTC: {
        FEE_RATE: 15, // satoshis per byte (more conservative)
        DUST_LIMIT: 546, // minimum output in satoshis
        MAX_FEE_RATE: 100, // Maximum fee rate to prevent overpayment
    },
}

module.exports = {
    ETH_PROVIDER,
    SOLANA_RPC,
    ERC20_ABI,
    TOKEN_ADDRESSES,
    GAS_CONFIG,
}
