const { ulid } = require("ulid")
const moment = require("moment")
const priceService = require("../services/priceService")
const { getKycOrderCollection, getCountersCollection } = require("../config/db")
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
                SOL: 200,
                ETH: 4500,
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
}

module.exports = {
    createKYCOrder
}
