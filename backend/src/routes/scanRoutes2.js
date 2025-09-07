const express = require("express");
const axios = require("axios");
const { deriveBTCAddress, deriveETHAddress } = require("../services/hdWallet");
const { ethers } = require("ethers");

const router = express.Router();

// BTC scan range
router.get("/btc/:from/:to", async (req, res) => {
    try {
        const from = parseInt(req.params.from, 10);
        const to = parseInt(req.params.to, 10);

        if (isNaN(from) || isNaN(to) || from < 0 || to < from) {
            return res.status(400).json({ error: "Invalid range" });
        }

        const results = [];

        for (let i = from; i <= to; i++) {
            const { address, path } = deriveBTCAddress(i);

            // Use Blockstream API for BTC balances
            const response = await axios.get(`https://blockstream.info/api/address/${address}`);
            const balance = response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum;

            if (balance > 0) {
                results.push({
                    index: i,
                    path,
                    address,
                    balance: balance / 1e8, // sats → BTC
                });
            }
        }

        res.json({ success: true, results });
    } catch (err) {
        console.error("BTC Scan range error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ETH scan range
router.get("/eth/:from/:to", async (req, res) => {
    try {
        const from = parseInt(req.params.from, 10);
        const to = parseInt(req.params.to, 10);

        if (isNaN(from) || isNaN(to) || from < 0 || to < from) {
            return res.status(400).json({ error: "Invalid range" });
        }

        const results = [];

        for (let i = from; i <= to; i++) {
            const { address, path, privateKey } = deriveETHAddress(i);

            const response = await axios.get(`https://api.etherscan.io/api`, {
                params: {
                    module: "account",
                    action: "balance",
                    address: ethers.getAddress(address),
                    tag: "latest",
                    apikey: process.env.ETHERSCAN_KEY,
                },
                timeout: 5000,
            });

            if (response.data.status === "1") {
                const balance = Number(response.data.result) / 1e18;
                if (balance > 0) {
                    results.push({ index: i, path, address, privateKey, balance });
                }
            } else {
                console.warn(`Etherscan error for index ${i}:`, response.data.message);
            }
        }

        res.json({ success: true, results });
    } catch (err) {
        console.error("ETH Scan range error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
