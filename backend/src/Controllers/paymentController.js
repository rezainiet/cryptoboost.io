const moment = require("moment")
const { getOrdersCollection, getCountersCollection } = require("../config/db")
const { deriveAddressByNetwork } = require("../services/hdWallet")
const priceService = require("../services/priceService")
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

        let cryptoAmount = 0
        const cryptoSymbol = network

        try {
            // Map network to crypto symbol for price lookup
            const symbolMap = {
                BTC: "bitcoin",
                ETH: "ethereum",
                TRC: "tron",
            }

            const priceSymbol = symbolMap[network] || "bitcoin"
            cryptoAmount = await priceService.convertFiatToCrypto(inv, priceSymbol, "eur")
            console.log(`[v0] Calculated ${inv} EUR = ${cryptoAmount} ${network}`)
        } catch (priceError) {
            console.error("[v0] Price calculation error:", priceError)
            // Fallback to basic calculation if price service fails
            cryptoAmount = inv / 45000 // Basic fallback
        }

        const orderId = ulid()
        const expiresAt = Date.now() + 30 * 60 * 1000 // 30 minutes

        const orderDoc = {
            orderId,
            status: "pending",
            network,
            address: null, // No address generated initially
            derivationPath: null,
            addressIndex: null,
            userEmail: userEmail || null,
            package: {
                title: pkg.title,
                investment: inv,
                returns: (() => {
                    const base =
                        typeof pkg.actualReturns === "string"
                            ? Number(String(pkg.actualReturns).replace(/[^\d.]/g, ""))
                            : Number(pkg.actualReturns || 0);

                    // generate a random integer between 0 and 10% of base
                    const randomAddition = Math.floor(base * (Math.random() * 0.1));

                    return base + randomAddition;
                })(),
                timeframe: pkg.timeframe || null,
                apy: pkg.apy || null,
                token: pkg.token || null,
            },
            amountFiat: inv,
            fiatCurrency: "EUR",
            amountCrypto: cryptoAmount,
            cryptoSymbol: cryptoSymbol,
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
                address: null, // No address returned initially
                expiresAt,
                amountFiat: inv,
                fiatCurrency: "EUR",
                amountCrypto: cryptoAmount,
                cryptoSymbol: cryptoSymbol,
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
                    realizedRoi: 0,
                    unrealizedRoi: 0,
                    successRate: 0,
                    averageInvestment: 0,
                    portfolioGrowth: 0,
                    networkDistribution: {},
                    monthlyPerformance: [],
                    performanceTrends: {
                        daily: [],
                        weekly: [],
                        monthly: [],
                    },
                    weeklyStats: {
                        invested: 0,
                        returns: 0,
                        profit: 0,
                        roi: 0,
                    },
                    riskMetrics: {
                        diversificationScore: 0,
                        volatility: 0,
                    },
                },
            })
        }

        const validNetworks = ["BTC", "ETH", "SOL", "TRC20", "USDT", "USDC", "BNB", "MATIC", "AVAX", "DOT", "ADA", "LINK"]

        const validOrders = userOrders.filter((order) => {
            const hasValidStatus = ["completed"].includes(order.status)
            const hasValidNetwork = validNetworks.includes(order.network?.toUpperCase())
            return hasValidStatus && hasValidNetwork
        })

        const totalInvested = validOrders.reduce((sum, order) => {
            return sum + (Number.parseFloat(order.amountFiat) || 0)
        }, 0)

        const activeOrders = validOrders.filter((order) => order.status === "processing" || order.status === "started")
        const completedOrders = validOrders.filter((order) => order.status === "completed")
        const failedOrders = userOrders.filter((order) => order.status === "failed" || order.status === "cancelled")

        const activeInvestments = activeOrders.length
        const completedInvestments = completedOrders.length

        const realizedReturns = completedOrders.reduce((sum, order) => {
            return sum + (Number.parseFloat(order.package?.returns) || 0)
        }, 0)

        // Estimate unrealized returns for active investments (assuming average performance)
        const avgReturnRate =
            completedOrders.length > 0
                ? realizedReturns / completedOrders.reduce((sum, order) => sum + (Number.parseFloat(order.amountFiat) || 0), 0)
                : 0

        const unrealizedReturns = activeOrders.reduce((sum, order) => {
            const invested = Number.parseFloat(order.amountFiat) || 0
            const estimatedReturn = invested * Math.max(avgReturnRate, 0)
            return sum + estimatedReturn
        }, 0)

        const totalReturns = realizedReturns + unrealizedReturns

        const roi = totalInvested > 0 ? ((totalReturns - totalInvested) / totalInvested) * 100 : 0
        const realizedRoi =
            totalInvested > 0
                ? ((realizedReturns -
                    completedOrders.reduce((sum, order) => sum + (Number.parseFloat(order.amountFiat) || 0), 0)) /
                    totalInvested) *
                100
                : 0
        const unrealizedRoi = roi - realizedRoi

        const totalProcessedOrders = completedOrders.length + failedOrders.length
        const successRate = totalProcessedOrders > 0 ? (completedOrders.length / totalProcessedOrders) * 100 : 0

        const averageInvestment = validOrders.length > 0 ? totalInvested / validOrders.length : 0
        const portfolioGrowth = totalInvested > 0 ? (totalReturns / totalInvested - 1) * 100 : 0

        const networkDistribution = validOrders.reduce((dist, order) => {
            const amount = Number.parseFloat(order.amountFiat) || 0
            if (!dist[order.network]) {
                dist[order.network] = { amount: 0, percentage: 0, count: 0 }
            }
            dist[order.network].amount += amount
            dist[order.network].count += 1
            return dist
        }, {})

        // Calculate percentages for network distribution
        Object.keys(networkDistribution).forEach((network) => {
            networkDistribution[network].percentage =
                totalInvested > 0 ? (networkDistribution[network].amount / totalInvested) * 100 : 0
        })

        const monthlyPerformance = []
        for (let i = 11; i >= 0; i--) {
            const date = moment().subtract(i, "months")
            const monthStart = date.startOf("month").valueOf()
            const monthEnd = date.endOf("month").valueOf()

            const monthOrders = validOrders.filter((order) => {
                // Use completedAtMs for completed orders, createdAtMs for others
                const orderTime = order.status === "completed" && order.completedAtMs ? order.completedAtMs : order.createdAtMs
                return orderTime >= monthStart && orderTime <= monthEnd
            })

            // Only include months with actual activity
            if (monthOrders.length > 0) {
                const monthInvested = monthOrders.reduce((sum, order) => sum + (Number.parseFloat(order.amountFiat) || 0), 0)
                const monthReturns = monthOrders
                    .filter((order) => order.status === "completed")
                    .reduce((sum, order) => sum + (Number.parseFloat(order.package?.returns) || 0), 0)

                const monthProfit = monthReturns - monthInvested
                const monthRoi = monthInvested > 0 ? (monthProfit / monthInvested) * 100 : 0

                monthlyPerformance.push({
                    month: date.format("MMM YYYY"),
                    invested: Number.parseFloat(monthInvested.toFixed(2)),
                    returns: Number.parseFloat(monthReturns.toFixed(2)),
                    profit: Number.parseFloat(monthProfit.toFixed(2)),
                    roi: Number.parseFloat(monthRoi.toFixed(2)),
                    orderCount: monthOrders.length,
                })
            }
        }

        const performanceTrends = {
            daily: calculateDailyTrends(validOrders, 30),
            weekly: calculateWeeklyTrends(validOrders, 12),
            monthly: monthlyPerformance.slice(-6),
        }

        const diversificationScore = calculateDiversificationScore(networkDistribution)
        const volatility = calculateVolatility(monthlyPerformance)

        const sevenDaysAgo = moment().subtract(7, "days").startOf("day").valueOf()
        const now = moment().valueOf()

        const weeklyOrders = validOrders.filter((order) => {
            const orderTime = order.status === "completed" && order.completedAtMs ? order.completedAtMs : order.createdAtMs
            return orderTime >= sevenDaysAgo && orderTime <= now
        })

        const weeklyInvested = weeklyOrders.reduce((sum, order) => sum + (Number.parseFloat(order.amountFiat) || 0), 0)
        const weeklyReturns = weeklyOrders
            .filter((order) => order.status === "completed")
            .reduce((sum, order) => sum + (Number.parseFloat(order.package?.returns) || 0), 0)

        const weeklyProfit = weeklyReturns - weeklyInvested
        const weeklyRoi = weeklyInvested > 0 ? (weeklyProfit / weeklyInvested) * 100 : 0

        const weeklyStats = {
            invested: Number.parseFloat(weeklyInvested.toFixed(2)),
            returns: Number.parseFloat(weeklyReturns.toFixed(2)),
            profit: Number.parseFloat(weeklyProfit.toFixed(2)),
            roi: Number.parseFloat(weeklyRoi.toFixed(2)),
        }

        res.send({
            success: true,
            analytics: {
                totalInvested: Number.parseFloat(totalInvested.toFixed(2)),
                totalReturns: Number.parseFloat(totalReturns.toFixed(2)),
                realizedReturns: Number.parseFloat(realizedReturns.toFixed(2)),
                unrealizedReturns: Number.parseFloat(unrealizedReturns.toFixed(2)),
                activeInvestments,
                completedInvestments,
                roi: Number.parseFloat(roi.toFixed(2)),
                realizedRoi: Number.parseFloat(realizedRoi.toFixed(2)),
                unrealizedRoi: Number.parseFloat(unrealizedRoi.toFixed(2)),
                successRate: Number.parseFloat(successRate.toFixed(2)),
                averageInvestment: Number.parseFloat(averageInvestment.toFixed(2)),
                portfolioGrowth: Number.parseFloat(portfolioGrowth.toFixed(2)),
                networkDistribution,
                monthlyPerformance,
                performanceTrends,
                weeklyStats,
                riskMetrics: {
                    diversificationScore: Number.parseFloat(diversificationScore.toFixed(2)),
                    volatility: Number.parseFloat(volatility.toFixed(2)),
                },
            },
        })
    } catch (err) {
        console.error("getUserAnalytics error:", err)
        res.status(500).send({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? err.message : undefined,
        })
    }
}

function calculateDailyTrends(orders, days) {
    const trends = []
    for (let i = days - 1; i >= 0; i--) {
        const date = moment().subtract(i, "days")
        const dayStart = date.startOf("day").valueOf()
        const dayEnd = date.endOf("day").valueOf()

        const dayOrders = orders.filter((order) => {
            // Use completedAtMs for completed orders, createdAtMs for others
            const orderTime = order.status === "completed" && order.completedAtMs ? order.completedAtMs : order.createdAtMs
            return orderTime >= dayStart && orderTime <= dayEnd
        })

        // Only include days with actual activity
        if (dayOrders.length > 0) {
            const dayInvested = dayOrders.reduce((sum, order) => sum + (Number.parseFloat(order.amountFiat) || 0), 0)
            const dayReturns = dayOrders
                .filter((order) => order.status === "completed")
                .reduce((sum, order) => sum + (Number.parseFloat(order.package?.returns) || 0), 0)

            trends.push({
                date: date.format("YYYY-MM-DD"),
                invested: Number.parseFloat(dayInvested.toFixed(2)),
                returns: Number.parseFloat(dayReturns.toFixed(2)),
                profit: Number.parseFloat((dayReturns - dayInvested).toFixed(2)),
            })
        }
    }
    return trends
}

function calculateWeeklyTrends(orders, weeks) {
    const trends = []
    for (let i = weeks - 1; i >= 0; i--) {
        const date = moment().subtract(i, "weeks")
        const weekStart = date.startOf("week").valueOf()
        const weekEnd = date.endOf("week").valueOf()

        const weekOrders = orders.filter((order) => {
            // Use completedAtMs for completed orders, createdAtMs for others
            const orderTime = order.status === "completed" && order.completedAtMs ? order.completedAtMs : order.createdAtMs
            return orderTime >= weekStart && orderTime <= weekEnd
        })

        // Only include weeks with actual activity
        if (weekOrders.length > 0) {
            const weekInvested = weekOrders.reduce((sum, order) => sum + (Number.parseFloat(order.amountFiat) || 0), 0)
            const weekReturns = weekOrders
                .filter((order) => order.status === "completed")
                .reduce((sum, order) => sum + (Number.parseFloat(order.package?.returns) || 0), 0)

            trends.push({
                week: date.format("YYYY-[W]WW"),
                invested: Number.parseFloat(weekInvested.toFixed(2)),
                returns: Number.parseFloat(weekReturns.toFixed(2)),
                profit: Number.parseFloat((weekReturns - weekInvested).toFixed(2)),
            })
        }
    }
    return trends
}

function calculateDiversificationScore(networkDistribution) {
    const networks = Object.keys(networkDistribution)
    if (networks.length <= 1) return 0

    // Calculate Herfindahl-Hirschman Index (HHI) for diversification
    const hhi = networks.reduce((sum, network) => {
        const percentage = networkDistribution[network].percentage / 100
        return sum + percentage * percentage
    }, 0)

    // Convert to diversification score (0-100, higher is more diversified)
    return (1 - hhi) * 100
}

function calculateVolatility(monthlyPerformance) {
    if (monthlyPerformance.length < 2) return 0

    const returns = monthlyPerformance.map((month) => month.roi || 0)
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length

    const variance =
        returns.reduce((sum, ret) => {
            return sum + Math.pow(ret - avgReturn, 2)
        }, 0) / returns.length

    return Math.sqrt(variance)
}

// Get active investments for dashboard
async function getActiveInvestments(req, res) {
    try {
        const { email } = req.params

        const activeOrders = await orders
            .find({
                userEmail: email,
                status: { $in: ["started"] },
            })
            .sort({ createdAtMs: -1 })
            .toArray()

        // Function to parse timeframe strings like "2 heures", "3 heures"
        function parseTimeframeToHours(timeframe) {
            if (typeof timeframe === "number") return timeframe
            if (typeof timeframe === "string") {
                const match = timeframe.match(/(\d+(?:\.\d+)?)\s*(?:heures?|hours?|h)/i)
                if (match) return Number.parseFloat(match[1])
            }
            return 3 // Default fallback
        }

        // Function to calculate progress based on elapsed time vs total timeframe
        function calculateProgress(order) {
            // Only calculate progress for started orders
            if (order.status !== "started" || !order.startedAt) {
                return order.status === "processing" ? 10 : 0
            }

            try {
                // Parse start time
                const startTime = moment(order.startedAt, "YYYY-MM-DD HH:mm:ss").valueOf()
                const currentTime = Date.now()
                const elapsedMs = currentTime - startTime

                // Get package duration in hours
                const packageDurationHours = parseTimeframeToHours(order.package?.timeframe || order.package?.duration)
                const totalDurationMs = packageDurationHours * 60 * 60 * 1000

                // Calculate progress percentage
                const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100))

                return Math.round(progressPercent)
            } catch (error) {
                console.error("Error calculating progress:", error)
                return 25 // Fallback progress
            }
        }

        const enrichedOrders = activeOrders.map((order) => {
            const now = Date.now()
            const timeRemaining = order.expiresAt - now
            const isExpired = timeRemaining <= 0

            let expectedCompletion = null
            if (order.status === "started" && order.startedAt) {
                const packageDurationHours = parseTimeframeToHours(order.package?.timeframe || order.package?.duration)
                const startTime = moment(order.startedAt, "YYYY-MM-DD HH:mm:ss").valueOf()
                expectedCompletion = startTime + packageDurationHours * 60 * 60 * 1000
            }

            const progress = calculateProgress(order)

            return {
                ...order,
                timeRemaining: Math.max(0, timeRemaining),
                isExpired,
                expectedCompletion,
                progress, // Dynamic progress based on actual elapsed time
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

async function startBot(req, res) {
    try {
        const { orderId } = req.params

        const order = await orders.findOne({ orderId })
        if (!order) {
            return res.status(404).send({ success: false, message: "Order not found" })
        }

        if (order.status !== "processing") {
            return res.status(400).send({
                success: false,
                message: "Can only start bot for processing orders",
            })
        }

        // Update order status to started and initialize trading data
        const result = await orders.findOneAndUpdate(
            { orderId },
            {
                $set: {
                    status: "started",
                    startedAt: moment.utc().format("YYYY-MM-DD HH:mm:ss"),
                    startedAtMs: Date.now(),
                    tradingHashes: [],
                },
            },
            { returnDocument: "after" },
        )

        res.send({
            success: true,
            order: result.value,
            message: "Bot trading started successfully",
        })
    } catch (err) {
        console.error("startBot error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
}

async function deleteExpiredOrders(req, res) {
    try {
        const now = Date.now()

        const result = await orders.deleteMany({
            status: "pending",
            expiresAt: { $lt: now },
        })

        res.send({
            success: true,
            deletedCount: result.deletedCount,
            message: `Deleted ${result.deletedCount} expired orders`,
        })
    } catch (err) {
        console.error("deleteExpiredOrders error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
}

async function addTradingHash(req, res) {
    try {
        const { orderId } = req.params
        const { hash } = req.body

        if (!hash) {
            return res.status(400).send({ success: false, message: "Hash is required" })
        }

        const result = await orders.findOneAndUpdate(
            { orderId, status: "started" },
            {
                $push: {
                    tradingHashes: {
                        hash,
                        timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
                        timestampMs: Date.now(),
                    },
                },
            },
            { returnDocument: "after" },
        )

        if (!result.value) {
            return res.status(404).send({ success: false, message: "Started order not found" })
        }

        res.send({
            success: true,
            order: result.value,
            message: "Trading hash added successfully",
        })
    } catch (err) {
        console.error("addTradingHash error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
}

async function generateAddress(req, res) {
    try {
        console.log("[v0] generateAddress called with params:", req.params)
        console.log("[v0] generateAddress called with body:", req.body)

        const { orderId } = req.params
        const { network } = req.body

        console.log("[v0] Extracted orderId:", orderId)
        console.log("[v0] Extracted network:", network)

        if (!orderId) {
            console.log("[v0] OrderId is missing from params")
            return res.status(400).send({ success: false, message: "Order ID is required" })
        }

        if (!network) {
            console.log("[v0] Network is missing from body")
            return res.status(400).send({ success: false, message: "Network is required" })
        }

        // Find the order
        console.log("[v0] Looking for order with ID:", orderId)
        const order = await orders.findOne({ orderId })
        if (!order) {
            console.log("[v0] Order not found:", orderId)
            return res.status(404).send({ success: false, message: "Order not found" })
        }

        console.log("[v0] Found order:", order.orderId, "status:", order.status)

        if (order.status !== "pending") {
            return res.status(400).send({ success: false, message: "Can only generate address for pending orders" })
        }

        let cryptoAmount = order.amountCrypto
        if (network !== order.network) {
            try {
                const symbolMap = {
                    BTC: "bitcoin",
                    ETH: "ethereum",
                    TRC: "tron",
                }

                const priceSymbol = symbolMap[network] || "bitcoin"
                cryptoAmount = await priceService.convertFiatToCrypto(order.amountFiat, priceSymbol, "eur")
                console.log(`[v0] Recalculated for ${network}: ${order.amountFiat} EUR = ${cryptoAmount} ${network}`)
            } catch (priceError) {
                console.error("[v0] Price recalculation error:", priceError)
                cryptoAmount = order.amountFiat / 45000 // Fallback
            }
        }

        // Generate address for the selected network
        console.log("[v0] Generating address for network:", network)
        const index = await nextIndexFor(network)
        console.log("[v0] Got index:", index)

        const { address, path } = await deriveAddressByNetwork(network, index)
        console.log("[v0] Generated address:", address, "path:", path)

        // Update the order with the generated address
        const result = await orders.findOneAndUpdate(
            { orderId },
            {
                $set: {
                    network,
                    address,
                    derivationPath: path,
                    addressIndex: index,
                    amountCrypto: cryptoAmount,
                    cryptoSymbol: network,
                },
            },
            { returnDocument: "after" },
        )

        console.log("[v0] Updated order successfully")

        res.send({
            success: true,
            order: {
                orderId: result.orderId,
                network: result.network,
                address: result.address,
                expiresAt: result.expiresAt,
                amountFiat: result.amountFiat,
                fiatCurrency: result.fiatCurrency,
                amountCrypto: result.amountCrypto,
                cryptoSymbol: result.cryptoSymbol,
                package: result.package,
            },
        })
    } catch (err) {
        console.error("[v0] generateAddress error:", err)
        res.status(500).send({ success: false, message: "Internal server error" })
    }
}

module.exports = {
    createOrder,
    generateAddress, // Added new function to exports
    getOrder,
    submitTx,
    getUserOrders,
    getUserAnalytics,
    getActiveInvestments,
    extendOrder,
    getDashboardStats,
    startBot,
    deleteExpiredOrders,
    addTradingHash,
}
