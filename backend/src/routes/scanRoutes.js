const express = require("express");
const axios = require("axios");
const { ethers } = require("ethers");

const router = express.Router();

const bip39 = require("bip39");
const { derivePath } = require("ed25519-hd-key");
const { Keypair, Connection, PublicKey } = require("@solana/web3.js");
const { deriveBTCAddress, deriveETHAddress } = require("../services/hdWallet");

const SOL_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const connection = new Connection(SOL_RPC, { commitment: "finalized" });

const ecc = require("tiny-secp256k1");
const BIP32Factory = require("bip32").default;
const bip32 = BIP32Factory(ecc);

const Bottleneck = require("bottleneck");

// -------- CONFIG --------
const ETHERSCAN_API = "https://api.etherscan.io/api";
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;
const DERIVATION_PATH = "m/44'/60'/0'/0"; // ETH

// -------- ERC20 CONFIG --------
const ERC20_TOKENS = [
    { symbol: "USDT", contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    { symbol: "USDC", contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 }
];

// -------- ETH Scan API --------
const limiter = new Bottleneck({ maxConcurrent: 2, minTime: 200 });

async function fetchBalance(address, retries = 3) {
    while (retries > 0) {
        try {
            const { data } = await axios.get(ETHERSCAN_API, {
                params: {
                    module: "account",
                    action: "balance",
                    address: ethers.getAddress(address),
                    tag: "latest",
                    apikey: ETHERSCAN_KEY,
                },
                timeout: 15000,
            });

            if (data.status === "1") {
                return Number(data.result) / 1e18;
            } else {
                throw new Error(data.message || "NOTOK");
            }
        } catch (err) {
            retries--;
            console.warn(`Retrying ${address}, attempts left: ${retries}`);
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    return 0; // return 0 if all retries fail
}

async function fetchTokenBalance(address, token, retries = 3) {
    while (retries > 0) {
        try {
            const { data } = await axios.get(ETHERSCAN_API, {
                params: {
                    module: "account",
                    action: "tokenbalance",
                    contractaddress: token.contract,
                    address: ethers.getAddress(address),
                    tag: "latest",
                    apikey: ETHERSCAN_KEY,
                },
                timeout: 15000,
            });

            if (data.status === "1") {
                return Number(data.result) / Math.pow(10, token.decimals);
            } else {
                throw new Error(data.message || "NOTOK");
            }
        } catch (err) {
            retries--;
            console.warn(`Retrying ${token.symbol} balance for ${address}, attempts left: ${retries}`);
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    return 0;
}

// ---------------- ETH + ERC20 SCAN ----------------
router.get("/eth/:from/:to", async (req, res) => {
    try {
        const from = parseInt(req.params.from, 10);
        const to = parseInt(req.params.to, 10);

        if (isNaN(from) || isNaN(to) || from < 0 || to < from) {
            return res.status(400).json({ error: "Invalid range" });
        }

        const tasks = [];

        for (let i = from; i <= to; i++) {
            const { address, path, privateKey } = deriveETHAddress(i);

            tasks.push(
                limiter.schedule(async () => {
                    const ethBalance = await fetchBalance(address, 3);

                    const tokenBalances = {};
                    for (const token of ERC20_TOKENS) {
                        tokenBalances[token.symbol] = await fetchTokenBalance(address, token, 3);
                    }

                    return { index: i, path, address, privateKey, ethBalance, tokenBalances };
                })
            );
        }

        const results = await Promise.all(tasks);

        // filter out addresses with zero balances
        const positive = results.filter(r =>
            r.ethBalance > 0 || ERC20_TOKENS.some(t => r.tokenBalances[t.symbol] > 0)
        );

        res.json({ success: true, results: positive });
    } catch (err) {
        console.error("ETH/ERC20 Scan range error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// -------- Solana scan range --------
router.get("/sol/:from/:to", async (req, res) => {
    try {
        const from = parseInt(req.params.from, 10);
        const to = parseInt(req.params.to, 10);
        if (isNaN(from) || isNaN(to) || from < 0 || to < from) {
            return res.status(400).json({ error: "Invalid range" });
        }

        const MNEMONIC = (process.env.MNEMONIC || "").trim();
        if (!MNEMONIC) {
            return res.status(500).json({ error: "MNEMONIC not set in env" });
        }

        const variants = [
            (i) => `m/44'/501'/${i}'`,
            (i) => `m/44'/501'/${i}'/0'`,
            (i) => `m/44'/501'/0'/${i}'`,
            (i) => `m/44'/501'/0'/0'`
        ];

        const results = [];
        const debugTries = [];

        for (let i = from; i <= to; i++) {
            for (const getPath of variants) {
                const path = getPath(i);

                const seed = bip39.mnemonicToSeedSync(MNEMONIC);
                const derived = derivePath(path, seed.toString("hex")).key;
                const kp = Keypair.fromSeed(derived);
                const address = kp.publicKey.toBase58();

                if (debugTries.length < 30) debugTries.push({ index: i, path, address });

                try {
                    const lamports = await connection.getBalance(new PublicKey(address), "finalized");
                    const balance = lamports / 1e9;

                    if (balance > 0.11) {
                        const fullSecret = Buffer.from(kp.secretKey); // 64 bytes
                        const privateKey = fullSecret.slice(0, 32).toString("hex"); // 64 hex chars
                        const secretKey = fullSecret.toString("hex"); // 128 hex chars

                        results.push({
                            index: i,
                            path,
                            address,
                            privateKey, // ✅ Trust Wallet–ready
                            secretKey,  // ✅ full Solana secret (for devs/programs)
                            balance,
                            matchedWith: path
                        });
                        break;
                    }
                } catch (err) {
                    console.warn(`Solana getBalance error for index ${i}, path ${path}:`, err.message);
                }
            }
        }

        if (results.length === 0) {
            return res.json({
                success: true,
                results,
                debugSample: debugTries.slice(0, 10),
                note: "No positive balances in range."
            });
        }

        return res.json({ success: true, results });
    } catch (err) {
        console.error("SOL Scan range error:", err.message);
        return res.status(500).json({ error: err.message });
    }
});


// -------- BTC scan range --------
router.get("/btc/:from/:to", async (req, res) => {
    try {
        const from = parseInt(req.params.from, 10);
        const to = parseInt(req.params.to, 10);

        if (isNaN(from) || isNaN(to) || from < 0 || to < from) {
            return res.status(400).json({ error: "Invalid range" });
        }

        const results = [];

        for (let i = from; i <= to; i++) {
            const { address, path, wif } = deriveBTCAddress(i);

            const response = await axios.get(`https://blockstream.info/api/address/${address}`);
            const balance = response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum;

            if (balance > 0) {
                results.push({
                    index: i,
                    path,
                    address,
                    wif,
                    balance: balance / 1e8,
                });
            }
        }

        res.json({ success: true, results });
    } catch (err) {
        console.error("BTC Scan range error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
