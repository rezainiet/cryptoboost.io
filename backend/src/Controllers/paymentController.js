const moment = require("moment")
const { getOrdersCollection, getCountersCollection } = require("../config/db")
const { deriveAddressByNetwork } = require("../services/hdWallet")
const { ulid } = require("ulid")

const orders = getOrdersCollection()
const counters = getCountersCollection()

// Get monotonic index per network to avoid address reuse
async function nextIndexFor(network) {
    if (!network) throw new Error("Network is required for address generation")

    const key = `addr_index_${network}`

    const doc = await counters.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }, // returns the updated document
    )

    // doc itself is the updated document
    return doc.seq
}

// Create an order and return a fresh address derived from HD wallet
async function createOrder(req, res) {
    try {
        const { pkg, network = "BTC", userEmail } = req.body

        if (!pkg || !pkg.title || typeof pkg.investment === "undefined") {
            return res.status(400).send({ success: false, message: "Invalid package payload" })
        }

        const inv =
            typeof pkg.investment === "string"
                ? Number(String(pkg.investment).replace(/[^\d.]/g, ""))
                : Number(pkg.investment)

        if (!inv || Number.isNaN(inv)) {
            return res.status(400).send({ success: false, message: "Invalid investment amount" })
        }

        const orderId = ulid()
        const expiresAt = Date.now() + 30 * 60 * 1000 // 30 minutes
        const index = await nextIndexFor(network) // unique per network
        // console.log("index payment controller", index)
        const { address, path } = deriveAddressByNetwork(network, index)

        const orderDoc = {
            orderId,
            status: "pending",
            network,
            address,
            derivationPath: path,
            addressIndex: index,
            userEmail: userEmail || null,
            package: {
                title: pkg.title,
                investment: inv,
                returns:
                    typeof pkg.returns === "string"
                        ? Number(String(pkg.returns).replace(/[^\d.]/g, ""))
                        : Number(pkg.returns || 0),
                timeframe: pkg.timeframe || null,
                apy: pkg.apy || null,
                token: pkg.token || null,
            },
            amountFiat: inv,
            fiatCurrency: "EUR",
            createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            createdAtMs: Date.now(),
            expiresAt,
            txHash: null,
            confirmations: 0,
        }

        await orders.insertOne(orderDoc)

        res.send({
            success: true,
            order: {
                orderId,
                network,
                address,
                expiresAt,
                amountFiat: inv,
                fiatCurrency: "EUR",
                package: orderDoc.package,
            },
        })
    } catch (err) {
        console.error("createOrder error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
}

// Get order by ID
async function getOrder(req, res) {
    try {
        const { orderId } = req.params
        const order = await orders.findOne({ orderId })
        if (!order) return res.status(404).send({ success: false, message: "Order not found" })
        res.send({ success: true, order })
    } catch (err) {
        console.error("getOrder error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
}

// Record a payment Tx hash
async function submitTx(req, res) {
    try {
        const { orderId } = req.params
        const { txHash } = req.body

        const result = await orders.findOneAndUpdate(
            { orderId },
            { $set: { txHash, status: "processing" } },
            { returnDocument: "after" },
        )

        if (!result.value) return res.status(404).send({ success: false, message: "Order not found" })

        res.send({ success: true, order: result.value })
    } catch (err) {
        console.error("submitTx error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
}

// Get all orders for a specific user
async function getUserOrders(req, res) {
    try {
        const { email } = req.params
        const { page = 1, limit = 10, status } = req.query

        const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
        const query = { userEmail: email }

        if (status) {
            query.status = status
        }

        const userOrders = await orders
            .find(query)
            .sort({ createdAtMs: -1 })
            .skip(skip)
            .limit(Number.parseInt(limit))
            .toArray()

        const total = await orders.countDocuments(query)

        res.send({
            success: true,
            orders: userOrders,
            pagination: {
                page: Number.parseInt(page),
                limit: Number.parseInt(limit),
                total,
                pages: Math.ceil(total / Number.parseInt(limit)),
            },
        })
    } catch (err) {
        console.error("getUserOrders error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
}

// Get user portfolio analytics
async function getUserAnalytics(req, res) {
    try {
        const { email } = req.params

        const userOrders = await orders.find({ userEmail: email }).toArray()

        if (userOrders.length === 0) {
            return res.send({
                success: true,
                analytics: {
                    totalInvested: 0,
                    totalReturns: 0,
                    activeInvestments: 0,
                    completedInvestments: 0,
                    roi: 0,
                    networkDistribution: {},
                    monthlyPerformance: [],
                },
            })
        }

        const totalInvested = userOrders.reduce((sum, order) => sum + order.amountFiat, 0)
        const activeInvestments = userOrders.filter(
            (order) => order.status === "processing" || order.status === "pending",
        ).length
        const completedInvestments = userOrders.filter((order) => order.status === "completed").length

        const totalReturns = userOrders
            .filter((order) => order.status === "completed")
            .reduce((sum, order) => sum + (order.package.returns || 0), 0)

        const roi = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0

        // Network distribution
        const networkDistribution = userOrders.reduce((dist, order) => {
            dist[order.network] = (dist[order.network] || 0) + order.amountFiat
            return dist
        }, {})

        // Monthly performance (last 6 months)
        const monthlyPerformance = []
        for (let i = 5; i >= 0; i--) {
            const date = moment().subtract(i, "months")
            const monthStart = date.startOf("month").valueOf()
            const monthEnd = date.endOf("month").valueOf()

            const monthOrders = userOrders.filter((order) => order.createdAtMs >= monthStart && order.createdAtMs <= monthEnd)

            const monthInvested = monthOrders.reduce((sum, order) => sum + order.amountFiat, 0)
            const monthReturns = monthOrders
                .filter((order) => order.status === "completed")
                .reduce((sum, order) => sum + (order.package.returns || 0), 0)

            monthlyPerformance.push({
                month: date.format("MMM YYYY"),
                invested: monthInvested,
                returns: monthReturns,
                profit: monthReturns - monthInvested,
            })
        }

        res.send({
            success: true,
            analytics: {
                totalInvested,
                totalReturns,
                activeInvestments,
                completedInvestments,
                roi: Number.parseFloat(roi.toFixed(2)),
                networkDistribution,
                monthlyPerformance,
            },
        })
    } catch (err) {
        console.error("getUserAnalytics error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
}

// Get active investments for dashboard
async function getActiveInvestments(req, res) {
    try {
        const { email } = req.params

        const activeOrders = await orders
            .find({
                userEmail: email,
                status: { $in: ["pending", "processing"] },
            })
            .sort({ createdAtMs: -1 })
            .toArray()

        const enrichedOrders = activeOrders.map((order) => {
            const now = Date.now()
            const timeRemaining = order.expiresAt - now
            const isExpired = timeRemaining <= 0

            // Calculate expected completion time (3 hours after payment confirmation)
            let expectedCompletion = null
            if (order.status === "processing" && order.txHash) {
                expectedCompletion = order.createdAtMs + 3 * 60 * 60 * 1000 // 3 hours
            }

            return {
                ...order,
                timeRemaining: Math.max(0, timeRemaining),
                isExpired,
                expectedCompletion,
                progress: order.status === "processing" ? 50 : 25, // Simple progress indicator
            }
        })

        res.send({
            success: true,
            activeInvestments: enrichedOrders,
        })
    } catch (err) {
        console.error("getActiveInvestments error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
}

// Extend order expiration time
async function extendOrder(req, res) {
    try {
        const { orderId } = req.params
        const { minutes = 30 } = req.body

        const order = await orders.findOne({ orderId })
        if (!order) {
            return res.status(404).send({ success: false, message: "Order not found" })
        }

        if (order.status !== "pending") {
            return res.status(400).send({
                success: false,
                message: "Can only extend pending orders",
            })
        }

        const newExpiresAt = Date.now() + Number.parseInt(minutes) * 60 * 1000

        const result = await orders.findOneAndUpdate(
            { orderId },
            { $set: { expiresAt: newExpiresAt } },
            { returnDocument: "after" },
        )

        res.send({
            success: true,
            order: result.value,
            message: `Order extended by ${minutes} minutes`,
        })
    } catch (err) {
        console.error("extendOrder error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
}

// Get dashboard statistics
async function getDashboardStats(req, res) {
    try {
        const { email } = req.params

        const userOrders = await orders.find({ userEmail: email }).toArray()
        const today = moment().startOf("day").valueOf()
        const todayEnd = moment().endOf("day").valueOf()

        // Today's activity
        const todayOrders = userOrders.filter((order) => order.createdAtMs >= today && order.createdAtMs <= todayEnd)

        const todayInvestments = todayOrders.reduce((sum, order) => sum + order.amountFiat, 0)
        const todayReturns = todayOrders
            .filter((order) => order.status === "completed")
            .reduce((sum, order) => sum + (order.package.returns || 0), 0)

        // Overall stats
        const totalInvested = userOrders.reduce((sum, order) => sum + order.amountFiat, 0)
        const activeCount = userOrders.filter((order) => order.status === "processing" || order.status === "pending").length

        const completedOrders = userOrders.filter((order) => order.status === "completed")
        const totalReturns = completedOrders.reduce((sum, order) => sum + (order.package.returns || 0), 0)
        const avgROI = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0

        res.send({
            success: true,
            stats: {
                totalBalance: totalReturns,
                activeInvestments: activeCount,
                todayGains: todayReturns,
                avgROI: Number.parseFloat(avgROI.toFixed(1)),
                totalInvested,
                completedInvestments: completedOrders.length,
            },
        })
    } catch (err) {
        console.error("getDashboardStats error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
}

module.exports = {
    createOrder,
    getOrder,
    submitTx,
    getUserOrders,
    getUserAnalytics,
    getActiveInvestments,
    extendOrder,
    getDashboardStats,
}
