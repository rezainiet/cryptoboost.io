// workers/paymentChecker.js
const axios = require("axios");
const dotenv = require("dotenv");
const { connectDB, getOrdersCollection } = require("../config/db");

dotenv.config();

// ---- API checkers ----
async function checkBTC(address) {
    // Try Blockstream API first (free, no key)
    try {
        const url = `https://blockstream.info/api/address/${address}`;
        const { data } = await axios.get(url);
        const confirmed = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
        return confirmed / 1e8; // BTC in decimals
    } catch (err) {
        console.warn(`⚠ Blockstream API failed for BTC (${address}):`, err.message);
        // Fallback to BlockCypher
        const url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance?token=${process.env.BLOCKCYPHER_TOKEN}`;
        const { data } = await axios.get(url);
        return data.final_balance / 1e8; // BTC in decimals
    }
}

async function checkETH(address) {
    const url = `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`;
    const payload = {
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [address, "latest"],
        id: 1
    };
    const { data } = await axios.post(url, payload);
    return parseInt(data.result, 16) / 1e18; // ETH in decimals
}

async function checkTRX(address) {
    const url = `https://api.trongrid.io/v1/accounts/${address}`;
    const { data } = await axios.get(url, {
        headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_KEY }
    });
    const balance = data.data[0]?.balance || 0;
    return balance / 1e6; // TRX in decimals
}

// ---- Main loop ----
// ---- Main loop ----
async function runPaymentChecks() {
    const ordersCol = getOrdersCollection();

    // 1️⃣ Delete orders older than 35 minutes
    const cutoffTimeMs = Date.now() - 35 * 60 * 1000; // 35 minutes in ms
    const deleteResult = await ordersCol.deleteMany({
        status: "pending",
        createdAtMs: { $lt: cutoffTimeMs }
    });
    if (deleteResult.deletedCount > 0) {
        console.log(`🗑 Deleted ${deleteResult.deletedCount} old pending orders`);
    }

    // 2️⃣ Process fresh pending orders
    const pendingOrders = await ordersCol.find({ status: "pending" }).toArray();

    for (const order of pendingOrders) {
        // Skip if checked in last 60s
        if (order.lastCheckedAt && (Date.now() - new Date(order.lastCheckedAt).getTime()) < 60000) {
            continue;
        }

        try {
            let balance = 0;
            if (order.network === "BTC") balance = await checkBTC(order.address);
            if (order.network === "ETH") balance = await checkETH(order.address);
            if (order.network === "TRX") {
                await new Promise(r => setTimeout(r, 500)); // Prevent TRX rate limit
                balance = await checkTRX(order.address);
            }

            if (balance >= order.amountCryptoExpected) {
                await ordersCol.updateOne(
                    { _id: order._id },
                    { $set: { status: "confirmed", amountCryptoReceived: balance, lastCheckedAt: new Date() } }
                );
                console.log(`✅ Payment confirmed for ${order.orderId} (${order.network})`);
            } else {
                await ordersCol.updateOne(
                    { _id: order._id },
                    { $set: { amountCryptoReceived: balance, lastCheckedAt: new Date() } }
                );
            }

        } catch (err) {
            console.error(`❌ Check failed for order ${order.orderId}:`, err.message);
        }
    }
}


// ---- Start Worker ----
(async () => {
    await connectDB();
    console.log("🚀 Payment checker started");
    setInterval(runPaymentChecks, 60000);
})();
