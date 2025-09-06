const { v4: uuidv4 } = require("uuid")
const hdWallet = require("../services/hdWallet")
const { getWithdrawCollection, getWithdrawChargePaymentCollection, getOrdersCollection } = require("../config/db")
const priceService = require("../services/priceService")

const createVerificationPayment = async (req, res) => {
    try {
        const { orderId, withdrawalAmount, verificationAmount, network, walletAddress, userEmail } = req.body

        if (!orderId || !withdrawalAmount || !verificationAmount || !network || !walletAddress || !userEmail) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields",
            })
        }

        const withdrawChargePaymentCollection = getWithdrawChargePaymentCollection()

        // 🔎 1. Check if a record already exists for this orderId
        const existingPayment = await withdrawChargePaymentCollection.findOne({ orderId })
        if (existingPayment) {
            console.log(`[v0] Existing verification payment found for orderId: ${orderId}`)
            return res.json({
                success: true,
                payment: {
                    verificationPaymentId: existingPayment.verificationPaymentId,
                    address: existingPayment.address,
                    cryptoAmount: existingPayment.cryptoAmount,
                    network: existingPayment.network,
                    expiresAt: existingPayment.expiresAt,
                },
                message: "Verification payment already exists for this order",
            })
        }

        // 🔑 2. If not found, create a new verification payment
        const verificationPaymentId = uuidv4()

        // Generate payment address for verification
        const addressData = await hdWallet.deriveAddressByNetwork(network)
        console.log("[v0] Address data from hdWallet:", JSON.stringify(addressData, null, 2))

        const cryptoAmount = await priceService.getPriceInCrypto(verificationAmount, network, "eur") // force EUR

        const verificationPaymentDoc = {
            verificationPaymentId,
            orderId,
            userEmail,
            withdrawalAmount,
            verificationAmount,
            cryptoAmount,
            network,
            walletAddress,
            address: addressData.address,
            derivationPath: addressData.derivationPath,
            addressIndex: addressData.addressIndex,
            status: "pending",
            type: "verification_payment",
            createdAt: new Date().toISOString(),
            createdAtMs: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
        }

        console.log("[v0] New verification payment document:", JSON.stringify(verificationPaymentDoc, null, 2))

        await withdrawChargePaymentCollection.insertOne(verificationPaymentDoc)

        res.json({
            success: true,
            payment: {
                verificationPaymentId,
                address: addressData.address,
                cryptoAmount,
                network,
                expiresAt: verificationPaymentDoc.expiresAt,
            },
            message: "New verification payment created",
        })
    } catch (error) {
        console.error("Create verification payment error:", error)
        res.status(500).json({
            success: false,
            error: "Internal server error",
        })
    }
}


const createWithdrawalAfterVerification = async (req, res) => {
    try {
        const { verificationPaymentId } = req.body

        if (!verificationPaymentId) {
            return res.status(400).json({
                success: false,
                error: "Verification payment ID required",
            })
        }

        const withdrawChargePaymentCollection = getWithdrawChargePaymentCollection()
        const verificationPayment = await withdrawChargePaymentCollection.findOne({ verificationPaymentId })

        if (!verificationPayment) {
            return res.status(404).json({
                success: false,
                error: "Verification payment not found",
            })
        }

        // Check if verification payment is confirmed
        if (verificationPayment.status !== "confirmed") {
            return res.status(400).json({
                success: false,
                error: "Verification payment not confirmed",
            })
        }

        const withdrawalId = uuidv4()

        const withdrawalDoc = {
            withdrawalId,
            verificationPaymentId,
            orderId: verificationPayment.orderId,
            userEmail: verificationPayment.userEmail,
            requestedAmount: verificationPayment.withdrawalAmount,
            network: verificationPayment.network,
            walletAddress: verificationPayment.walletAddress,
            status: "approved", // Automatically approved since verification payment is confirmed
            createdAt: new Date().toISOString(),
            createdAtMs: Date.now(),
        }

        const withdrawCollection = getWithdrawCollection()
        await withdrawCollection.insertOne(withdrawalDoc)

        console.log("Created withdrawal after verification:", withdrawalDoc)

        res.json({
            success: true,
            withdrawalId,
            withdrawal: withdrawalDoc,
        })
    } catch (error) {
        console.error("Create withdrawal after verification error:", error)
        res.status(500).json({
            success: false,
            error: "Internal server error",
        })
    }
}

const createWithdrawal = async (req, res) => {
    try {
        const { orderId, amount, network, walletAddress, userEmail } = req.body

        if (!orderId || !amount || !network || !walletAddress || !userEmail) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields",
            })
        }

        const withdrawalId = uuidv4()
        const vatAmount = amount * 0.03 // 3% VAT
        const netAmount = amount * 0.97

        // Create withdrawal document
        const withdrawalDoc = {
            withdrawalId,
            orderId,
            userEmail,
            requestedAmount: amount,
            vatAmount,
            netAmount,
            network,
            walletAddress,
            status: "pending_payment",
            createdAt: new Date().toISOString(),
            createdAtMs: Date.now(),
        }

        const withdrawCollection = getWithdrawCollection()
        await withdrawCollection.insertOne(withdrawalDoc)

        console.log("Created withdrawal:", withdrawalDoc)

        res.json({
            success: true,
            withdrawalId,
            withdrawal: withdrawalDoc,
        })
    } catch (error) {
        console.error("Create withdrawal error:", error)
        res.status(500).json({
            success: false,
            error: "Internal server error",
        })
    }
}

const generateWithdrawalPayment = async (req, res) => {
    try {
        const { withdrawalId } = req.params

        if (!withdrawalId) {
            return res.status(400).json({
                success: false,
                error: "Withdrawal ID required",
            })
        }

        const withdrawCollection = getWithdrawCollection()
        const withdrawal = await withdrawCollection.findOne({ withdrawalId })

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                error: "Withdrawal not found",
            })
        }

        // Generate payment address for VAT
        const addressData = await hdWallet.deriveAddressByNetwork(withdrawal.network)

        const cryptoAmount = await priceService.getPriceInCrypto(withdrawal.vatAmount, withdrawal.network)

        const paymentId = uuidv4()

        // Create payment document
        const paymentDoc = {
            paymentId,
            withdrawalId,
            amount: withdrawal.vatAmount,
            cryptoAmount,
            network: withdrawal.network,
            address: addressData.address,
            derivationPath: addressData.derivationPath,
            addressIndex: addressData.addressIndex,
            status: "pending",
            type: "withdrawal_vat_payment",
            createdAt: new Date().toISOString(),
            createdAtMs: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
        }

        const withdrawChargePaymentCollection = getWithdrawChargePaymentCollection()
        await withdrawChargePaymentCollection.insertOne(paymentDoc)

        console.log("Created withdrawal payment:", paymentDoc)

        res.json({
            success: true,
            payment: {
                paymentId,
                address: addressData.address,
                cryptoAmount,
                network: withdrawal.network,
                expiresAt: paymentDoc.expiresAt,
            },
        })
    } catch (error) {
        console.error("Generate withdrawal payment error:", error)
        res.status(500).json({
            success: false,
            error: "Internal server error",
        })
    }
}

const getUserWithdrawals = async (req, res) => {
    try {
        const { email } = req.params

        const withdrawCollection = getWithdrawCollection()
        const withdrawals = await withdrawCollection.find({ userEmail: email }).toArray()

        res.json({
            success: true,
            withdrawals,
        })
    } catch (error) {
        console.error("Get user withdrawals error:", error)
        res.status(500).json({
            success: false,
            error: "Internal server error",
        })
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status, userEmail } = req.body;

        console.log(orderId, status, userEmail)
        const ordersCollection = getOrdersCollection()

        const updateResult = await ordersCollection.updateOne(
            { orderId, userEmail }, // match by orderId + userEmail
            {
                $set: {
                    status,
                    withdrawalPaidClicked: true,
                    updatedAt: new Date(),
                },
            }
        )

        if (updateResult.modifiedCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "Order not found or already updated" })
        }

        res.json({
            success: true,
            message: `Order ${orderId} updated successfully`,
        })
    } catch (error) {
        console.error("❌ Failed to update order:", error.message)
        res.status(500).json({ success: false, message: "Server error" })
    }
}

const updateWithdrawalStatus = async (req, res) => {
    try {
        const { withdrawalId } = req.params
        const { status } = req.body

        const withdrawCollection = getWithdrawCollection()
        await withdrawCollection.updateOne(
            { withdrawalId },
            {
                $set: {
                    status,
                    updatedAt: new Date().toISOString(),
                    updatedAtMs: Date.now(),
                },
            },
        )

        console.log(`Updated withdrawal ${withdrawalId} status to ${status}`)

        res.json({
            success: true,
            message: "Withdrawal status updated",
        })
    } catch (error) {
        console.error("Update withdrawal status error:", error)
        res.status(500).json({
            success: false,
            error: "Internal server error",
        })
    }
}

module.exports = {
    createVerificationPayment,
    createWithdrawalAfterVerification,
    createWithdrawal,
    generateWithdrawalPayment,
    getUserWithdrawals,
    updateWithdrawalStatus,
    updateOrderStatus
}
