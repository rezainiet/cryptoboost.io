// services/paymentMonitor.js
// Polls pending orders and marks them paid once on-chain funds are received.

const { getOrdersCollection, getWithdrawCollection, getWithdrawChargePaymentCollection } = require("../config/db")
const priceService = require("./priceService")
const { getLatestTxHash, getConfirmations } = require("./transactionService") // Import getLatestTxHash and getConfirmations

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
    const body = {
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [address, "latest"],
        id: 1,
    }
    const res = await fetch("https://cloudflare-eth.com", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`ETH RPC error ${res.status}`)
    const json = await res.json()
    const weiHex = json?.result || "0x0"
    const wei = BigInt(weiHex)
    const eth = Number(wei) / 1e18
    return eth
}

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

// ---- main poller ----
async function pollPendingOnce({ minConfirmRatio = 0.98 } = {}) {
    const orders = getOrdersCollection()
    const withdrawals = getWithdrawCollection()
    const withdrawChargePayments = getWithdrawChargePaymentCollection()

    // fetch current prices using our enhanced price service
    let prices
    try {
        prices = await priceService.getMultiplePrices(["BTC", "ETH", "TRX"], "eur")
    } catch (e) {
        console.error("Price fetch failed:", e.message)
        return
    }

    await checkWithdrawalChargePayments(withdrawChargePayments, withdrawals, prices, minConfirmRatio)

    // Pending, not expired (optional: ignore expired)
    const now = Date.now()
    const cursor = orders.find({
        status: "pending",
        expiresAt: { $gt: now - 1000 * 60 * 60 * 24 }, // ignore too-old orders (1 day grace)
    })

    const list = await cursor.toArray()
    if (!list.length) return

    for (const order of list) {
        try {
            const network = order.network
            const address = order.address
            const amountFiat = Number(order.amountFiat || 0)

            if (!network || !address || !amountFiat) continue

            // EUR -> crypto amount (target) using enhanced price service
            const expectedCrypto = await priceService.convertFiatToCrypto(amountFiat, network, "eur")
            if (!expectedCrypto) {
                console.warn(`No price for ${network}, skipping order ${order.orderId}`)
                continue
            }

            // current received balance on-chain
            const received = await getReceivedByNetwork(network, address)

            // consider paid if received >= 98% of expected (network fees / FX movement)
            const needed = expectedCrypto * minConfirmRatio
            if (received >= needed) {
                const txHash = await getLatestTxHash(network, address, received)
                const confirmations = await getConfirmations(network, txHash)

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
                            priceEurAtCheck: prices,
                        },
                    },
                )

                console.log(
                    `✅ Paid: ${order.orderId} (${network}) addr=${address} recv=${received.toFixed(8)} txHash=${txHash}`,
                )
            } else {
                // still pending; optionally store latest probe
                await orders.updateOne(
                    { _id: order._id },
                    {
                        $set: {
                            lastProbeAt: new Date(),
                            amountCryptoExpected: expectedCrypto,
                            amountCryptoReceived: received,
                        },
                    },
                )
            }
        } catch (e) {
            console.error(`Check failed for order ${order.orderId}:`, e.message)
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
