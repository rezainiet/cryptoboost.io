// services/paymentMonitor.js
const axios = require("axios")
const {
    getOrdersCollection,
    getWithdrawCollection,
    getWithdrawChargePaymentCollection,
    getFoundBalancesCollection,
} = require("../config/db")
const priceService = require("./priceService")
const { getLatestTxHash, getConfirmations } = require("./transactionService")
const { sweepByNetwork } = require("./sweeper")
const { ethers } = require("ethers")
const { v4: uuidv4 } = require("uuid")
const { deriveAddressByNetwork } = require("./hdWallet")
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js")
const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com"

// Constants
const ETH_PROVIDER = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`)
const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"]
const TOKEN_ADDRESSES = {
    USDT: ethers.getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
    USDC: ethers.getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
}

// ==================== CORE PAYMENT PROCESSING ====================

async function verifyBalanceWithEtherscan(network, address) {
    try {
        const n = network.toUpperCase()

        if (n === "USDT" || n === "USDC") {
            const { data } = await axios.get(`https://api.etherscan.io/api`, {
                params: {
                    module: "account",
                    action: "tokenbalance",
                    contractaddress: TOKEN_ADDRESSES[n],
                    address: address,
                    tag: "latest",
                    apikey: process.env.ETHERSCAN_KEY,
                },
            })

            if (data.status !== "1") throw new Error(data.message)
            return Number(data.result) / 1e6
        }

        if (n === "ETH") {
            const { data } = await axios.get(`https://api.etherscan.io/api`, {
                params: {
                    module: "account",
                    action: "balance",
                    address: address,
                    tag: "latest",
                    apikey: process.env.ETHERSCAN_KEY,
                },
            })

            if (data.status !== "1") throw new Error(data.message)
            return Number(data.result) / 1e18
        }

        throw new Error("Unsupported network for Etherscan verification")
    } catch (err) {
        console.error("Etherscan verification failed:", err.message)
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
        const { data } = await axios.get(`https://blockstream.info/api/address/${address}/txs`)

        // Sum both confirmed and unconfirmed
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
        ) // Convert to BTC
    } catch (err) {
        console.error("BTC balance check error:", err.message)
        return 0
    }
}

async function checkETHBalance(address) {
    try {
        const { data } = await axios.get(`https://api.etherscan.io/api`, {
            params: {
                module: "account",
                action: "balance",
                address: ethers.getAddress(address),
                tag: "latest",
                apikey: process.env.ETHERSCAN_KEY,
            },
        })
        if (data.status !== "1") throw new Error(data.message)
        return Number.parseFloat(ethers.formatUnits(BigInt(data.result), 18))
    } catch (err) {
        console.error("ETH balance check error:", err.message)
        return 0
    }
}

async function checkERC20Balance(tokenAddress, userAddress, decimals = 18) {
    try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, ETH_PROVIDER)
        const balance = await contract.balanceOf(ethers.getAddress(userAddress))
        return Number(ethers.formatUnits(balance, decimals))
    } catch (err) {
        console.error("ERC20 balance check error:", err.message)
        return 0
    }
}

async function checkSOLBalance(address) {
    try {
        if (!address) {
            return 0
        }

        const connection = new Connection(SOLANA_RPC)
        const publicKey = new PublicKey(address)
        const balance = await connection.getBalance(publicKey)
        return balance / LAMPORTS_PER_SOL // Convert lamports to SOL
    } catch (err) {
        console.error("SOL balance check error:", err.message)
        return 0
    }
}


async function processOrderPayment(order) {
    const { network, address, amountFiat, orderId, addressIndex } = order
    const n = network.toUpperCase()

    try {
        // Get expected crypto amount
        const expectedCrypto = await priceService.convertFiatToCrypto(amountFiat, n, "eur")
        if (!expectedCrypto) {
            console.warn(`⚠️ No price for ${n}, skipping ${orderId}`)
            return
        }

        // Check received amount with enhanced BTC handling
        const [received, txNetwork] = await (async () => {
            if (["USDT", "USDC"].includes(n)) {
                return [await checkERC20Balance(TOKEN_ADDRESSES[n], address, 6), "ETH"]
            }

            // Special handling for BTC to include unconfirmed transactions
            if (n === "BTC") {
                const balance = await checkBTCPaymentReceived(address)
                return [balance, "BTC"]
            }

            return [await checkPaymentReceived(n, address), n]
        })()

        console.log(`💰 ${orderId} | Expected: ${expectedCrypto.toFixed(8)} ${n}, Received: ${received.toFixed(8)}`)

        // Process payment if threshold met (99%)
        if (received >= expectedCrypto * 0.99) {
            await completeOrderPayment(order, expectedCrypto, received, txNetwork)
        } else {
            await updatePendingOrder(order, expectedCrypto, received)
        }
    } catch (err) {
        console.error(`❌ Order ${orderId} processing failed:`, err.message)
    }
}

// New helper function for BTC-specific checking
async function checkBTCPaymentReceived(address) {
    try {
        // Include both confirmed and unconfirmed transactions
        const { data } = await axios.get(`https://blockstream.info/api/address/${address}/txs`)

        // Calculate total received amount (both confirmed and unconfirmed)
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

        return receivedSats / 1e8 // Convert to BTC
    } catch (err) {
        console.error("BTC payment check error:", err.message)
        return 0
    }
}

// async function completeOrderPayment(order, expectedCrypto, received, txNetwork) {
//     const { orderId, network, address, addressIndex, _id } = order
//     const n = network.toUpperCase()

//     console.log(`✅ Payment received for ${orderId} on ${n}. Processing...`)
//     function isValidSolanaTxHash(txHash) {
//         return txHash && /^[A-Za-z0-9]{88}$/.test(txHash)
//     }
//     // // Get transaction details
//     // const [txHash, confirmations] = await Promise.all([
//     //     getLatestTxHash(txNetwork, address),
//     //     getConfirmations(txNetwork, address)
//     // ]);

//     let sweepTx = null
//     let txHash = await getLatestTxHash(txNetwork, address)
//     let confirmations = 0

//     if (txHash && isValidSolanaTxHash(txHash)) {
//         confirmations = await getConfirmations(txNetwork, txHash)
//     } else {
//         console.warn(`Invalid tx hash for ${orderId}: ${txHash}`)
//         txHash = null
//     }

//     if (received > 0) {
//         try {
//             const sweepNetwork = ["USDT", "USDC"].includes(n) ? "ETH" : n
//             sweepTx = await sweepByNetwork(sweepNetwork, addressIndex)

//             if (sweepTx) {
//                 console.log(`🧹 Swept funds for ${orderId}: ${sweepTx}`)
//                 await recordSweptBalance(order, received, sweepTx, n)
//             }
//         } catch (sweepErr) {
//             console.error(`❌ Sweep failed for ${orderId}:`, sweepErr.message)
//             // Don't fail the whole order if sweeping fails
//         }
//     }

//     // Update order status
//     try {
//         const updateResult = await getOrdersCollection().updateOne(
//             { _id },
//             {
//                 $set: {
//                     status: "processing",
//                     paidAt: new Date(),
//                     amountCryptoExpected: expectedCrypto,
//                     amountCryptoReceived: received,
//                     txHash,
//                     confirmations,
//                     sweepTxHash: sweepTx || null,
//                     priceEurAtCheck: expectedCrypto / order.amountFiat,
//                     lastProbeAt: new Date(),
//                 },
//             },
//         )

//         console.log(
//             updateResult.modifiedCount === 1 ? `📦 ${orderId} updated to processing` : `❌ Failed to update ${orderId}`,
//         )
//     } catch (err) {
//         console.error(`❌ Order ${orderId} update failed:`, err.message)
//     }
// }


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

                // ✅ Only update status if sweep succeeded
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
    console.log(`[PM: ⌛ Payment pending for] ${order.orderId}`)
}

// ==================== WITHDRAWAL PROCESSING ====================

async function processWithdrawalPayment(payment) {
    const { network, address, cryptoAmount, verificationPaymentId } = payment

    try {
        const received = await checkPaymentReceived(network, address)
        const expected = cryptoAmount // expected full amount

        // Only process if received >= expected
        if (received >= expected) {
            await completeWithdrawalPayment(payment, received, expected)
        } else {
            console.log(
                `⚠️ Withdrawal ${verificationPaymentId}: received amount (${received}) less than expected (${expected}). Skipping.`
            )
            // Optionally update last probe timestamp without changing status
            await updatePendingWithdrawal(payment, received)
        }
    } catch (err) {
        console.error(`Withdrawal check failed for ${verificationPaymentId}:`, err.message)
    }
}

async function completeWithdrawalPayment(payment, received, expected) {
    const { network, address, _id, verificationPaymentId, addressIndex } = payment

    // Verify again before proceeding
    if (received < expected) {
        console.warn(
            `⚠️ Withdrawal ${verificationPaymentId}: received amount (${received}) less than expected (${expected}). Aborting sweep.`
        )
        return
    }

    // Get payment tx and confirmations
    const [txHash, confirmations] = await Promise.all([
        getLatestTxHash(network, address),
        getConfirmations(network, address),
    ])

    // Mark payment as confirmed
    await getWithdrawChargePaymentCollection().updateOne(
        { _id },
        {
            $set: {
                status: "confirmed",
                paidAt: new Date(),
                amountCryptoReceived: received,
                txHash,
                confirmations,
            },
        }
    )

    console.log(`✅ Withdrawal payment confirmed: ${verificationPaymentId}`)

    // Sweep funds to main wallet
    if (received > 0) {
        try {
            const sweepTx = await sweepByNetwork(network.toUpperCase(), addressIndex)

            if (sweepTx) {
                console.log(`🧹 Swept withdrawal funds to main wallet: ${sweepTx}`)

                // Update DB with sweep tx hash and processed status
                await getWithdrawChargePaymentCollection().updateOne(
                    { _id },
                    { $set: { sweepTxHash: sweepTx, status: "processed" } }
                )
            } else {
                console.warn(`⚠️ Sweep failed for withdrawal ${verificationPaymentId}`)
            }
        } catch (err) {
            console.error(`❌ Sweep error for withdrawal ${verificationPaymentId}:`, err.message)
        }
    }

    // Create withdrawal request if verification payment
    if (payment.type === "verification_payment") {
        await createWithdrawalRequest(payment)
    }
}

async function createWithdrawalRequest(payment) {
    const withdrawCollection = getWithdrawCollection()

    // Check if a withdrawal request already exists for this orderId
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
        const thirtyMinutesAgo = Date.now() - 7200000 // 120 minutes in milliseconds

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
        const thirtyMinutesAgo = Date.now() - 7200000 // 120 minutes in milliseconds

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

// ==================== MAIN POLLER ====================

async function pollPendingOrders() {
    try {
        await cleanupExpiredOrders()
        await cleanupExpiredWithdrawals()

        // Process regular orders
        const orders = await getOrdersCollection()
            .find({
                status: "pending",
                expiresAt: { $gt: Date.now() - 1800000 * 4 }, // Within last 120 minutes
            })
            .toArray()

        console.log(`🟡 Found ${orders.length} pending orders`)
        await Promise.all(orders.map(processOrderPayment))

        // Process withdrawal payments
        const withdrawals = await getWithdrawChargePaymentCollection()
            .find({
                status: "pending",
                expiresAt: { $gt: Date.now() - 1800000 * 4 }, // Within last 120 minutes
            })
            .toArray()

        console.log(`🟡 Found ${withdrawals.length} pending withdrawal payments`)
        await Promise.all(withdrawals.map(processWithdrawalPayment))
    } catch (err) {
        console.error("Polling error:", err.message)
    }
}

function startPaymentMonitor({ intervalMs = 60000, minConfirmRatio = 0.94 } = {}) {
    console.log(`🛰️ Payment monitor started (every ${intervalMs / 1000}s)`)

    // Immediate first run
    pollPendingOrders().catch((err) => console.error("Initial polling error:", err))

    // Periodic runs
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
