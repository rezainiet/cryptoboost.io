// services/paymentMonitor.js
// Polls pending orders and marks them paid once on-chain funds are received.
const axios = require("axios")
const { getOrdersCollection, getWithdrawCollection, getWithdrawChargePaymentCollection } = require("../config/db")
const priceService = require("./priceService")
const { getLatestTxHash, getConfirmations } = require("./transactionService") // Import getLatestTxHash and getConfirmations
const { sweepETHFunds } = require("./sweeper")

// ---- helpers: HTTP fetch (Node >= 18 has global fetch) ----
async function httpGetJson(url, options = {}) {
    const res = await fetch(url, options)
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
    return await res.json()
}

// ---- prices via CoinGecko (free) ----
// Enhanced price service usage
// ---- chain balance checkers (free endpoints) ----

// BTC: Blockstream — sum UTXOs (values are in sats)
async function getBTCReceived(address) {
    const utxos = await httpGetJson(`https://blockstream.info/api/address/${address}/utxo`)
    const sats = (Array.isArray(utxos) ? utxos : []).reduce((sum, u) => sum + (u.value || 0), 0)
    return sats / 1e8 // BTC
}

// ETH: Cloudflare free public RPC — read current balance (wei)
async function getETHReceived(address) {
    const url = `https://api.etherscan.io/api`;
    const apiKey = process.env.ETHERSCAN_KEY; // .env এ সংরক্ষিত
    const params = {
        module: "account",
        action: "balance",
        address: address,
        tag: "latest",
        apikey: apiKey,
    };

    const { data } = await axios.get(url, { params });

    if (data.status === "1" && data.result) {
        const wei = BigInt(data.result);
        const eth = Number(wei) / 1e18;
        return eth;
    } else {
        throw new Error(`Etherscan API error: ${data.message}`);
    }
}

(async () => {
    console.log("[balance]", await getETHReceived("0xA54de674382E4196d7b86A2775a6cb1C9c377fb9"));
})();

// TRX: TronGrid — account balance in "sun"
async function getTRXReceived(address) {
    // v1/accounts returns array; we read balance (sun)
    const data = await httpGetJson(`https://api.trongrid.io/v1/accounts/${address}`)
    const acc = Array.isArray(data?.data) && data.data.length ? data.data[0] : null
    const sun = acc?.balance || 0
    return sun / 1e6 // TRX
}

async function getReceivedByNetwork(network, address) {
    const n = network.toUpperCase()
    if (n === "BTC") return await getBTCReceived(address)
    if (n === "ETH") return await getETHReceived(address)
    if (n === "TRX" || n === "TRC") return await getTRXReceived(address)
    throw new Error(`Unsupported network for balance check: ${network}`)
}


async function sweepByNetwork(network, index) {
    try {
        const upper = network.toUpperCase();
        if (upper === "ETH") {
            return await sweepETHFunds(index);
        } else if (upper === "TRX" || upper === "TRC") {
            return await sweepTRXFunds(index);
        } else {
            console.warn(`Sweep not supported for ${network}`);
            return null;
        }
    } catch (err) {
        console.error(`❌ Sweep failed for ${network} index ${index}:`, err.message);
        return null;
    }
};

// ---- main poller ----
async function pollPendingOnce({ minConfirmRatio = 0.98 } = {}) {
    const orders = getOrdersCollection();

    const now = Date.now();
    console.log(now)
    const cursor = orders.find({
        status: "pending",
        expiresAt: { $gt: now - 1000 * 60 * 60 * 24 },
    });

    const list = await cursor.toArray();

    console.log(`🟡 pollPendingOnce found ${list.length} pending orders at ${new Date().toISOString()}`);

    if (!list.length) {
        console.log("ℹ️ No pending orders matched query (status=pending + not expired)");
        return;
    }

    for (const order of list) {
        try {
            const network = order.network;
            const address = order.address;
            const amountFiat = Number(order.amountFiat || 0);
            const orderId = order.orderId;

            if (!network || !address || !amountFiat) {
                console.warn(`⚠️ Skipping incomplete order: ${orderId}`);
                continue;
            }

            console.log(`🔎 Checking order ${orderId} (${network}) | Address: ${address}`);

            // EUR -> expected crypto amount
            const expectedCrypto = await priceService.convertFiatToCrypto(amountFiat, network, "eur");

            if (!expectedCrypto) {
                console.warn(`⚠️ No price available for ${network}, skipping order ${orderId}`);
                continue;
            }

            // Check current balance of generated address
            const received = await getReceivedByNetwork(network, address);
            console.log(`💰 Order ${orderId} | Expected: ${expectedCrypto.toFixed(8)} ${network}, Received: ${received.toFixed(8)} ${network}`);

            const needed = expectedCrypto * minConfirmRatio;

            if (received >= needed) {
                console.log(`✅ Payment received for ${orderId} on ${network}. Initiating verification...`);

                const txHash = await getLatestTxHash(network, address, received);
                const confirmations = await getConfirmations(network, txHash);

                console.log(`🔄 Transaction details: txHash=${txHash}, confirmations=${confirmations}`);

                const sweepTx = await sweepByNetwork(network, order.addressIndex);

                if (sweepTx) {
                    console.log(`🧹 Sweep complete for ${orderId}. SweepTxHash: ${sweepTx}`);
                } else {
                    console.warn(`⚠️ Sweep failed or not applicable for ${orderId}`);
                }

                await orders.updateOne(
                    { _id: order._id },
                    {
                        $set: {
                            status: "processing",
                            paidAt: new Date(),
                            amountCryptoExpected: expectedCrypto,
                            amountCryptoReceived: received,
                            txHash: txHash,
                            confirmations: confirmations,
                            sweepTxHash: sweepTx || null,
                            priceEurAtCheck: expectedCrypto / amountFiat
                        },
                    },
                );

                console.log(`📦 Order ${orderId} marked as 'processing' and updated in database.`);
            } else {
                console.log(`⌛ Payment still pending for ${orderId}. Received only ${received.toFixed(8)} ${network}`);

                await orders.updateOne(
                    { _id: order._id },
                    {
                        $set: {
                            lastProbeAt: new Date(),
                            amountCryptoExpected: expectedCrypto,
                            amountCryptoReceived: received,
                        },
                    },
                );
            }
        } catch (e) {
            console.error(`❌ Error checking order ${order.orderId}:`, e.message);
        }
    }

}

async function checkWithdrawalChargePayments(withdrawChargePayments, withdrawals, prices, minConfirmRatio) {
    const now = Date.now()
    const cursor = withdrawChargePayments.find({
        status: "pending",
        expiresAt: { $gt: now - 1000 * 60 * 60 * 24 }, // ignore too-old payments
    })

    const list = await cursor.toArray()
    if (!list.length) return

    console.log(`[v0] Checking ${list.length} withdrawal charge payments`)

    for (const payment of list) {
        try {
            const network = payment.network
            const address = payment.address
            const expectedCrypto = Number(payment.cryptoAmount || 0)

            if (!network || !address || !expectedCrypto) continue

            console.log(
                `[v0] Checking payment: ${payment.verificationPaymentId}, address: ${address}, expected: ${expectedCrypto}`,
            )

            // current received balance on-chain
            const received = await getReceivedByNetwork(network, address)

            // consider paid if received >= 98% of expected
            const needed = expectedCrypto * minConfirmRatio
            if (received >= needed) {
                const txHash = await getLatestTxHash(network, address, received)
                const confirmations = await getConfirmations(network, txHash)

                // Update withdrawal charge payment status
                await withdrawChargePayments.updateOne(
                    { _id: payment._id },
                    {
                        $set: {
                            status: "confirmed",
                            paidAt: new Date(),
                            amountCryptoReceived: received,
                            txHash: txHash,
                            confirmations: confirmations,
                            priceEurAtCheck: prices,
                        },
                    },
                )

                console.log(
                    `✅ Verification Payment Confirmed: ${payment.verificationPaymentId} (${network}) recv=${received.toFixed(8)} txHash=${txHash}`,
                )

                // Automatically create withdrawal request after verification payment is confirmed
                if (payment.type === "verification_payment") {
                    await createWithdrawalAfterVerification(payment, withdrawals)
                }
            } else {
                // still pending; update probe info
                await withdrawChargePayments.updateOne(
                    { _id: payment._id },
                    {
                        $set: {
                            lastProbeAt: new Date(),
                            amountCryptoReceived: received,
                        },
                    },
                )
            }
        } catch (e) {
            console.error(`Check failed for withdrawal charge payment ${payment.verificationPaymentId}:`, e.message)
        }
    }
}

async function createWithdrawalAfterVerification(verificationPayment, withdrawals) {
    try {
        const { v4: uuidv4 } = require("uuid")
        const withdrawalId = uuidv4()

        const withdrawalDoc = {
            withdrawalId,
            verificationPaymentId: verificationPayment.verificationPaymentId,
            orderId: verificationPayment.orderId,
            userEmail: verificationPayment.userEmail,
            requestedAmount: verificationPayment.withdrawalAmount,
            verificationAmount: verificationPayment.verificationAmount,
            network: verificationPayment.network,
            walletAddress: verificationPayment.walletAddress,
            status: "pending_approval", // Needs admin approval
            createdAt: new Date().toISOString(),
            createdAtMs: Date.now(),
            verificationPaidAt: new Date().toISOString(),
            verificationTxHash: verificationPayment.txHash,
        }

        await withdrawals.insertOne(withdrawalDoc)

        console.log(
            `✅ Withdrawal request created automatically: ${withdrawalId} for user ${verificationPayment.userEmail}`,
        )
    } catch (error) {
        console.error("Error creating withdrawal after verification:", error)
    }
}

// ---- start interval loop ----
function startPaymentMonitor({ intervalMs = 60_000, minConfirmRatio = 0.98 } = {}) {
    console.log(`🛰️  Payment monitor started (every ${intervalMs / 1000}s)`)
    // run soon after start
    pollPendingOnce({ minConfirmRatio }).catch(() => { })
    // then repeat
    setInterval(() => {
        pollPendingOnce({ minConfirmRatio }).catch((e) => console.error("pollPendingOnce error:", e.message))
    }, intervalMs)
}

module.exports = { startPaymentMonitor, pollPendingOnce }
