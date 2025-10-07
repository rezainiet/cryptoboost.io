// services/paymentMonitor.js
const axios = require("axios")
const {
    getOrdersCollection,
    getWithdrawCollection,
    getWithdrawChargePaymentCollection,
    getFoundBalancesCollection,
    getKycOrderCollection,
} = require("../config/db")
const priceService = require("./priceService")
const { getLatestTxHash, getConfirmations } = require("./transactionService")
const { sweepByNetwork } = require("./sweeper")
const { ethers } = require("ethers")
const { v4: uuidv4 } = require("uuid")
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js")
const { getKYCOrder } = require("../Controllers/kycController")

// ==================== PROVIDERS ====================

// ETH provider via Alchemy (avoid etherscan limits)
const ETH_PROVIDER = new ethers.JsonRpcProvider(
    `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
)

// Solana provider via Alchemy (avoid public mainnet-beta rate limits)
const SOLANA_RPC =
    process.env.SOLANA_RPC ||
    `https://solana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
const solanaConnection = new Connection(SOLANA_RPC, "confirmed")

// ERC20 ABI + token addresses
const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"]
const TOKEN_ADDRESSES = {
    USDT: ethers.getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
    USDC: ethers.getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
}

// ==================== HELPERS ====================

// Retry wrapper with exponential backoff
async function withRetry(fn, retries = 5, delay = 30000) { // 60000ms = 1 minute
    for (let i = 0; i < retries; i++) {
        try {
            return await fn()
        } catch (err) {
            if (err.message.includes("429")) {
                console.warn(`⚠️ Rate limited. Retry in ${delay / 1000}s...`)
                await new Promise((res) => setTimeout(res, delay))
                delay += 30000 // increase by 1 minute each time
            } else {
                throw err
            }
        }
    }
    throw new Error("Failed after retries")
}



// ==================== CORE PAYMENT PROCESSING ====================

async function verifyBalanceWithEtherscan(network, address) {
    try {
        const n = network.toUpperCase()

        if (n === "USDT" || n === "USDC") {
            const contract = new ethers.Contract(TOKEN_ADDRESSES[n], ERC20_ABI, ETH_PROVIDER)
            const balance = await withRetry(() =>
                contract.balanceOf(ethers.getAddress(address))
            )
            return Number(ethers.formatUnits(balance, 6))
        }

        if (n === "ETH") {
            const balance = await withRetry(() =>
                ETH_PROVIDER.getBalance(ethers.getAddress(address))
            )
            return Number(ethers.formatUnits(balance, 18))
        }

        throw new Error("Unsupported network for verification")
    } catch (err) {
        console.error("Verification failed:", err.message)
        throw err
    }
}

async function checkPaymentReceived(network, address) {
    const n = network.toUpperCase()
    try {
        switch (n) {
            case "BTC":
                return await checkBTCBalance(address)
            case "ETH":
                return await checkETHBalance(address)
            case "USDT":
                return await checkERC20Balance(TOKEN_ADDRESSES.USDT, address, 6)
            case "USDC":
                return await checkERC20Balance(TOKEN_ADDRESSES.USDC, address, 6)
            case "SOL":
                return await checkSOLBalance(address)
            default:
                throw new Error(`Unsupported network: ${network}`)
        }
    } catch (err) {
        console.error(`Balance check failed for ${network}:`, err.message)
        return 0
    }
}

async function checkBTCBalance(address) {
    try {
        const { data } = await withRetry(() =>
            axios.get(`https://blockstream.info/api/address/${address}/txs`)
        )
        return (
            data.reduce((sum, tx) => {
                return (
                    sum +
                    tx.vout.reduce((txSum, output) => {
                        if (output.scriptpubkey_address === address) {
                            return txSum + output.value
                        }
                        return txSum
                    }, 0)
                )
            }, 0) / 1e8
        )
    } catch (err) {
        console.error("BTC balance check error:", err.message)
        return 0
    }
}

async function checkETHBalance(address) {
    try {
        const balance = await withRetry(() =>
            ETH_PROVIDER.getBalance(ethers.getAddress(address))
        )
        return Number(ethers.formatUnits(balance, 18))
    } catch (err) {
        console.error("ETH balance check error:", err.message)
        return 0
    }
}

async function checkERC20Balance(tokenAddress, userAddress, decimals = 18) {
    try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, ETH_PROVIDER)
        const balance = await withRetry(() =>
            contract.balanceOf(ethers.getAddress(userAddress))
        )
        return Number(ethers.formatUnits(balance, decimals))
    } catch (err) {
        console.error("ERC20 balance check error:", err.message)
        return 0
    }
}

async function checkSOLBalance(address) {
    try {
        if (!address) return 0
        const publicKey = new PublicKey(address)
        const balance = await withRetry(() =>
            solanaConnection.getBalance(publicKey)
        )
        return balance / LAMPORTS_PER_SOL
    } catch (err) {
        console.error("SOL balance check error:", err.message)
        return 0
    }
}

// ==================== ORDER + WITHDRAWAL PROCESSING ====================

async function processOrderPayment(order) {
    const { network, address, amountFiat, orderId, addressIndex } = order
    const n = network.toUpperCase()

    try {
        const expectedCrypto = await priceService.convertFiatToCrypto(amountFiat, n, "eur")
        if (!expectedCrypto) {
            console.warn(`⚠️ No price for ${n}, skipping ${orderId}`)
            return
        }

        const [received, txNetwork] = await (async () => {
            if (["USDT", "USDC"].includes(n)) {
                return [await checkERC20Balance(TOKEN_ADDRESSES[n], address, 6), "ETH"]
            }
            if (n === "BTC") {
                const balance = await checkBTCPaymentReceived(address)
                return [balance, "BTC"]
            }
            return [await checkPaymentReceived(n, address), n]
        })()

        console.log(`💰 ${orderId} | Expected: ${expectedCrypto.toFixed(8)} ${n}, Received: ${received.toFixed(8)}`)

        if (received >= expectedCrypto) {
            await completeOrderPayment(order, expectedCrypto, received, txNetwork)
        } else {
            await updatePendingOrder(order, expectedCrypto, received)
        }
    } catch (err) {
        console.error(`❌ Order ${orderId} processing failed:`, err.message)
    }
}

async function checkBTCPaymentReceived(address) {
    try {
        const { data } = await withRetry(() =>
            axios.get(`https://blockstream.info/api/address/${address}/txs`)
        )
        const receivedSats = data.reduce((total, tx) => {
            return (
                total +
                tx.vout.reduce((txTotal, output) => {
                    if (output.scriptpubkey_address === address) {
                        return txTotal + output.value
                    }
                    return txTotal
                }, 0)
            )
        }, 0)
        return receivedSats / 1e8
    } catch (err) {
        console.error("BTC payment check error:", err.message)
        return 0
    }
}

async function completeOrderPayment(order, expectedCrypto, received, txNetwork) {
    const { orderId, network, address, addressIndex, _id } = order
    const n = network.toUpperCase()

    console.log(`✅ Payment received for ${orderId} on ${n}. Processing...`)
    function isValidSolanaTxHash(txHash) {
        return txHash && /^[1-9A-HJ-NP-Za-km-z]{43,88}$/.test(txHash)
    }

    let sweepTx = null
    let txHash = await getLatestTxHash(txNetwork, address)
    let confirmations = 0

    if (txHash && isValidSolanaTxHash(txHash)) {
        confirmations = await getConfirmations(txNetwork, txHash)
    } else {
        console.warn(`Invalid tx hash for ${orderId}: ${txHash}`)
        txHash = null
    }

    if (received > 0) {
        try {
            const sweepNetwork = n
            sweepTx = await sweepByNetwork(sweepNetwork, addressIndex)

            if (sweepTx) {
                console.log(`🧹 Swept funds for ${orderId}: ${sweepTx}`)
                await recordSweptBalance(order, received, sweepTx, n)

                const updateResult = await getOrdersCollection().updateOne(
                    { _id },
                    {
                        $set: {
                            status: "processing",
                            paidAt: new Date(),
                            amountCryptoExpected: expectedCrypto,
                            amountCryptoReceived: received,
                            txHash,
                            confirmations,
                            sweepTxHash: sweepTx,
                            priceEurAtCheck: expectedCrypto / order.amountFiat,
                            lastProbeAt: new Date(),
                        },
                    },
                )

                console.log(
                    updateResult.modifiedCount === 1
                        ? `📦 ${orderId} updated to processing`
                        : `❌ Failed to update ${orderId}`,
                )
            } else {
                console.error(`❌ Sweep did not return a tx for ${orderId}, skipping status update.`)
            }
        } catch (sweepErr) {
            console.error(`❌ Sweep failed for ${orderId}:`, sweepErr.message)
        }
    } else {
        console.warn(`⚠️ No funds received for ${orderId}, not sweeping or updating status.`)
    }
}

async function recordSweptBalance(order, amount, txHash, network) {
    const foundBalances = getFoundBalancesCollection()

    await foundBalances.insertOne({
        orderId: order.orderId,
        network: network,
        address: order.address,
        addressIndex: order.addressIndex,
        amount,
        txHash,
        sweptAt: new Date(),
        status: "swept",
        metadata: {
            originalOrder: order._id,
            userEmail: order.userEmail,
            package: order.package,
        },
    })
}

async function updatePendingOrder(order, expectedCrypto, received) {
    if (received > (order.amountCryptoReceived || 0)) {
        await getOrdersCollection().updateOne(
            { _id: order._id },
            {
                $set: {
                    lastProbeAt: new Date(),
                    amountCryptoExpected: expectedCrypto,
                    amountCryptoReceived: received,
                },
            },
        )
        console.log(`[PM: ⌛ Payment updated for] ${order.orderId} | Received: ${received}`)
    } else {
        console.log(`[PM: ⌛ No new payment for] ${order.orderId}, skipping DB update`)
    }
}

// ==================== KYC PROCESSING ====================


async function processKycPayment(kycOrder) {
    const { network, address, amountFiat, orderId, addressIndex } = kycOrder
    const n = network.toUpperCase()

    try {
        // Convert expected fiat to crypto amount
        const expectedCrypto = await priceService.convertFiatToCrypto(amountFiat, n, "eur")
        if (!expectedCrypto) {
            console.warn(`⚠️ No price for ${n}, skipping ${orderId}`)
            return
        }

        // Check on-chain balance
        const received = await checkPaymentReceived(n, address)
        console.log(`💰 [KYC] ${orderId} | Expected: ${expectedCrypto.toFixed(8)} ${n}, Received: ${received.toFixed(8)}`)

        // If payment found
        if (received >= expectedCrypto) {
            console.log(`✅ [KYC] Payment received for ${orderId}. Sweeping funds...`)
            const sweepTx = await sweepByNetwork(n, addressIndex)

            if (sweepTx) {
                // Record swept balance
                await recordSweptBalance(kycOrder, received, sweepTx, n)

                // Update KYC order status
                await getKycOrderCollection().updateOne(
                    { _id: kycOrder._id },
                    {
                        $set: {
                            status: "processing",
                            paidAt: new Date(),
                            amountCryptoExpected: expectedCrypto,
                            amountCryptoReceived: received,
                            sweepTxHash: sweepTx,
                            priceEurAtCheck: expectedCrypto / kycOrder.amountFiat,
                            lastProbeAt: new Date(),
                        },
                    },
                )

                console.log(`🧾 [KYC] ${orderId} updated to processing and swept successfully.`)
            } else {
                console.warn(`⚠️ [KYC] Sweep failed for ${orderId}.`)
            }
        } else {
            // Payment not complete yet
            if (received > (kycOrder.amountCryptoReceived || 0)) {
                await getKycOrderCollection().updateOne(
                    { _id: kycOrder._id },
                    {
                        $set: {
                            lastProbeAt: new Date(),
                            amountCryptoExpected: expectedCrypto,
                            amountCryptoReceived: received,
                        },
                    },
                )
                console.log(`[KYC] Updated partial payment for ${orderId}.`)
            } else {
                console.log(`[KYC] No new payment for ${orderId}.`)
            }
        }
    } catch (err) {
        console.error(`❌ [KYC] Error processing ${orderId}:`, err.message)
    }
}



// ==================== WITHDRAWAL PROCESSING ====================

async function processWithdrawalPayment(payment) {
    const { network, address, cryptoAmount, verificationPaymentId } = payment

    try {
        const received = await checkPaymentReceived(network, address)
        const expected = cryptoAmount

        if (received >= expected) {
            await completeWithdrawalPayment(payment, received, expected)
        } else {
            console.log(
                `⚠️ Withdrawal ${verificationPaymentId}: received amount (${received}) less than expected (${expected}). Skipping.`
            )
            await updatePendingWithdrawal(payment, received)
        }
    } catch (err) {
        console.error(`Withdrawal check failed for ${verificationPaymentId}:`, err.message)
    }
}

async function completeWithdrawalPayment(payment, received, expected) {
    const { network, _id, verificationPaymentId, addressIndex } = payment

    if (received < expected) {
        console.warn(
            `⚠️ Withdrawal ${verificationPaymentId}: received amount (${received}) less than expected (${expected}). Aborting.`
        )
        return
    }

    if (addressIndex == null) {
        console.warn(
            `⚠️ Withdrawal ${verificationPaymentId}: addressIndex is null. Cannot sweep. Aborting.`
        )
        return
    }

    const [txHash, confirmations] = await Promise.all([
        getLatestTxHash(network, payment.address),
        getConfirmations(network, payment.address),
    ])

    let sweepTx = null
    try {
        sweepTx = await sweepByNetwork(network.toUpperCase(), addressIndex)
    } catch (err) {
        console.error(`❌ Sweep error for withdrawal ${verificationPaymentId}:`, err.message)
        return
    }

    if (!sweepTx) {
        console.warn(`⚠️ Sweep failed for withdrawal ${verificationPaymentId}. DB not updated.`)
        return
    }

    await getWithdrawChargePaymentCollection().updateOne(
        { _id },
        {
            $set: {
                status: "processed",
                paidAt: new Date(),
                amountCryptoReceived: received,
                txHash,
                confirmations,
                sweepTxHash: sweepTx,
            },
        }
    )

    console.log(`🧹 Withdrawal ${verificationPaymentId} processed and swept successfully.`)

    if (payment.type === "verification_payment") {
        await createWithdrawalRequest(payment)
    }
}

async function createWithdrawalRequest(payment) {
    const withdrawCollection = getWithdrawCollection()

    const existingRequest = await withdrawCollection.findOne({
        orderId: payment.orderId,
    })

    if (existingRequest) {
        console.warn(
            `⚠️ Withdrawal request already exists for orderId ${payment.orderId}, skipping creation.`
        )
        return
    }

    const withdrawalDoc = {
        withdrawalId: uuidv4(),
        verificationPaymentId: payment.verificationPaymentId,
        orderId: payment.orderId,
        userEmail: payment.userEmail,
        requestedAmount: payment.withdrawalAmount,
        verificationAmount: payment.verificationAmount,
        network: payment.network,
        walletAddress: payment.walletAddress,
        status: "pending_approval",
        createdAt: new Date(),
        verificationTxHash: payment.txHash,
    }

    await withdrawCollection.insertOne(withdrawalDoc)
    console.log(`📝 Created withdrawal request for ${payment.userEmail}`)
}

async function updatePendingWithdrawal(payment, received) {
    await getWithdrawChargePaymentCollection().updateOne(
        { _id: payment._id },
        {
            $set: {
                lastProbeAt: new Date(),
                amountCryptoReceived: received,
            },
        }
    )
}

// ==================== CLEANUP FUNCTIONS ====================

async function cleanupExpiredOrders() {
    try {
        const thirtyMinutesAgo = Date.now() - 7200000
        const result = await getOrdersCollection().deleteMany({
            status: "pending",
            expiresAt: { $lt: thirtyMinutesAgo },
        })

        if (result.deletedCount > 0) {
            console.log(`🗑️ Cleaned up ${result.deletedCount} expired pending orders`)
        }
    } catch (err) {
        console.error("❌ Cleanup expired orders failed:", err.message)
    }
}

async function cleanupExpiredWithdrawals() {
    try {
        const thirtyMinutesAgo = Date.now() - 7200000
        const result = await getWithdrawChargePaymentCollection().deleteMany({
            status: "pending",
            expiresAt: { $lt: thirtyMinutesAgo },
        })

        if (result.deletedCount > 0) {
            console.log(`🗑️ Cleaned up ${result.deletedCount} expired pending withdrawals`)
        }
    } catch (err) {
        console.error("❌ Cleanup expired withdrawals failed:", err.message)
    }
}

async function cleanupExpiredKYC() {
    try {
        const thirtyMinutesAgo = Date.now() - 7200000
        const result = await getKycOrderCollection().deleteMany({
            status: "pending",
            expiresAt: { $lt: thirtyMinutesAgo },
        })

        if (result.deletedCount > 0) {
            console.log(`🗑️ Cleaned up ${result.deletedCount} expired pending KYC`)
        }
    } catch (err) {
        console.error("❌ Cleanup expired KYC failed:", err.message)
    }
}

// ==================== MAIN POLLER ====================

async function pollPendingOrders() {
    try {
        await cleanupExpiredOrders()
        await cleanupExpiredWithdrawals()
        await cleanupExpiredKYC()
        let limit
        (async () => {
            const pLimit = (await import("p-limit")).default
            limit = pLimit(5) // concurrency limit = 5
        })()


        const orders = await getOrdersCollection()
            .find({
                status: "pending",
                expiresAt: { $gt: Date.now() - 1800000 * 4 },
            })
            .toArray()

        console.log(`🟡 Found ${orders.length} pending orders`)
        await Promise.all(orders.map(order => limit(() => processOrderPayment(order))))

        const withdrawals = await getWithdrawChargePaymentCollection()
            .find({
                status: "pending",
                expiresAt: { $gt: Date.now() - 1800000 * 4 },
            })
            .toArray()

        console.log(`🟡 Found ${withdrawals.length} pending withdrawal payments`)

        const kycs = await getKycOrderCollection()
            .find({
                status: "pending",
                expiresAt: { $gt: Date.now() - 1800000 * 4 },
            })
            .toArray()

        console.log(`🟡 Found ${withdrawals.length} pending withdrawal payments`)
        await Promise.all(withdrawals.map(w => limit(() => processWithdrawalPayment(w))))

        console.log(`🟡 Found ${kycs.length} pending KYC payments`)
        await Promise.all(kycs.map(k => limit(() => processKycPayment(k))))

    } catch (err) {
        console.error("Polling error:", err.message)
    }
}

function startPaymentMonitor({ intervalMs = 60000 } = {}) {
    console.log(`🛰️ Payment monitor started (every ${intervalMs / 1000}s)`)

    pollPendingOrders().catch((err) => console.error("Initial polling error:", err))
    setInterval(() => pollPendingOrders().catch(console.error), intervalMs)
}

module.exports = {
    startPaymentMonitor,
    pollPendingOrders,
    checkPaymentReceived,
    verifyBalanceWithEtherscan,
    cleanupExpiredOrders,
    cleanupExpiredWithdrawals,
}
