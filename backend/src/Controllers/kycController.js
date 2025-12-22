const { ulid } = require("ulid")
const moment = require("moment")
const priceService = require("../services/priceService")
const { getKycOrderCollection, getCountersCollection, getOrdersCollection } = require("../config/db")
const { deriveAddressByNetwork } = require("../services/hdWallet")


// Get monotonic index per network to avoid address reuse
async function nextIndexFor(network) {
    if (!network) throw new Error("Network is required for address generation")

    const key = `addr_index_${network}`

    const doc = await getCountersCollection().findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }, // returns the updated document
    )

    // doc itself is the updated document
    return doc.seq
}


async function createKYCOrder(req, res) {
    try {
        console.log("[v0] createKYCOrder called with body:", req.body)

        const { amount, network = "SOL", userEmail } = req.body

        // Validate network
        if (!network) {
            console.log("[v0] Network is missing from body")
            return res.status(400).send({ success: false, message: "Network is required" })
        }

        // Validate amount (should be 500 EUR for KYC)
        const kycAmount = Number(amount)
        if (!kycAmount || Number.isNaN(kycAmount) || kycAmount !== 500) {
            console.log("[v0] Invalid KYC amount:", amount)
            return res.status(400).send({ success: false, message: "Invalid KYC verification amount. Must be 500 EUR." })
        }

        let cryptoAmount = 0
        const cryptoSymbol = network

        try {
            // Map network to crypto symbol for price lookup
            const symbolMap = {
                SOL: "solana",
                ETH: "ethereum",
                USDT: "tether",
                USDC: "usd-coin",
            }

            const priceSymbol = symbolMap[network] || "solana"
            cryptoAmount = await priceService.convertFiatToCrypto(kycAmount, priceSymbol, "eur")
            console.log(`[v0] Calculated ${kycAmount} EUR = ${cryptoAmount} ${network}`)
        } catch (priceError) {
            console.error("[v0] Price calculation error:", priceError)
            // Fallback to basic calculation if price service fails
            const fallbackPrices = {
                SOL: 110,
                ETH: 2600,
                USDT: 0.99,
                USDC: 0.98,
            }
            cryptoAmount = kycAmount / (fallbackPrices[network] || 150)
        }

        const orderId = ulid()
        const expiresAt = Date.now() + 120 * 60 * 1000 // 120 minutes

        console.log("[v0] Generating address for network:", network)
        const index = await nextIndexFor(network)
        console.log("[v0] Got index:", index)

        const { address, path } = await deriveAddressByNetwork(network, index)
        console.log("[v0] Generated address:", address, "path:", path)

        const orderDoc = {
            orderId,
            type: "kyc_verification",
            status: "pending",
            network,
            address,
            derivationPath: path,
            addressIndex: index,
            userEmail: userEmail || null,
            amountFiat: kycAmount,
            fiatCurrency: "EUR",
            amountCrypto: cryptoAmount,
            cryptoSymbol: cryptoSymbol,
            createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            createdAtMs: Date.now(),
            expiresAt,
            txHash: null,
            confirmations: 0,
            verificationStatus: "pending", // pending, verified, rejected
        }

        // Insert into kyc_orders collection
        await getKycOrderCollection().insertOne(orderDoc)
        console.log("[v0] Created KYC order successfully:", orderId)

        res.send({
            success: true,
            order: {
                orderId,
                type: "kyc_verification",
                network,
                address,
                derivationPath: path,
                addressIndex: index,
                expiresAt,
                amountFiat: kycAmount,
                fiatCurrency: "EUR",
                amountCrypto: cryptoAmount,
                cryptoSymbol: cryptoSymbol,
            },
        })
    } catch (err) {
        console.error("[v0] createKYCOrder error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
};


async function getKYCProcessingStatus(req, res) {
    try {
        // console.log("[v0] getKYCProcessingStatus called")

        // Query only processing orders
        const orders = await getKycOrderCollection()
            .find(
                { status: "processing" },
                {
                    projection: {
                        _id: 0,
                        orderId: 1,
                        userEmail: 1,
                        status: 1,
                        verificationStatus: 1,
                        createdAt: 1,
                        amountFiat: 1,
                        fiatCurrency: 1,
                        amountCrypto: 1,
                        cryptoSymbol: 1,
                        network: 1,
                        txHash: 1,
                        confirmations: 1
                    }
                }
            )
            .toArray()

        // If no processing orders found
        if (!orders || orders.length === 0) {
            return res.send({
                success: true,
                message: "No KYC orders currently in processing status",
                orders: []
            })
        }

        return res.send({
            success: true,
            count: orders.length,
            orders
        })

    } catch (error) {
        console.error("[v0] getKYCProcessingStatus error:", error)
        return res.status(500).send({
            success: false,
            message: "Internal server error"
        })
    }
};

async function confirmKYCOrder(req, res) {
    try {
        const { orderId } = req.params
        const result = await getKycOrderCollection().findOneAndUpdate(
            { orderId },
            { $set: { status: "processed", verificationStatus: "verified" } },
            { returnDocument: "after" }
        )

        const updatedOrder = result.value || result // support both driver formats

        if (!updatedOrder) {
            return res.status(404).send({ success: false, message: "Order not found" })
        }

        return res.send({
            success: true,
            message: "KYC marked as verified",
            order: updatedOrder
        })


    } catch (error) {
        console.error("confirmKYCOrder error:", error)
        return res.status(500).send({ success: false, message: "Internal server error" })
    }
};

async function getUpdatableOrders(req, res) {
    try {

        const orderCollection = await getOrdersCollection()

        // Fetch orders with status: started OR processing
        const orders = await orderCollection
            .find({ status: { $in: ["started", "processing"] } })
            .toArray()

        // No orders found
        if (!orders || orders.length === 0) {
            return res.send({
                success: true,
                message: "No updatable orders found",
                orders: []
            })
        }

        // Return full documents
        return res.send({
            success: true,
            count: orders.length,
            orders
        })

    } catch (error) {
        console.error(" getUpdatableOrders error:", error)
        return res.status(500).send({
            success: false,
            message: "Internal server error"
        })
    }
};

async function updatePackageReturn(req, res) {
    try {
        const { orderId } = req.params
        const { returns } = req.body
        console.log(returns)

        if (!returns && returns !== 0) {
            return res.status(400).send({ success: false, message: "Return amount is required" })
        }

        const result = await getOrdersCollection().findOneAndUpdate(
            { orderId },
            { $set: { "package.returns": returns } },
            { returnDocument: "after" }
        )
        console.log("result", result)

        const updated = result.value || result

        if (!updated) {
            return res.status(404).send({ success: false, message: "Order not found" })
        }

        return res.send({
            success: true,
            message: "Package return updated successfully",
            order: updated
        })

    } catch (error) {
        console.error("updatePackageReturn error:", error)
        return res.status(500).send({ success: false, message: "Internal server error" })
    }
}





module.exports = {
    createKYCOrder,
    getKYCProcessingStatus,
    confirmKYCOrder,
    getUpdatableOrders,
    updatePackageReturn
}
