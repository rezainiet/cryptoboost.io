const { getOrdersCollection, getUserCollection } = require("../config/db")
const moment = require("moment")

const orders = getOrdersCollection()
const users = getUserCollection()

function generateRandomHash() {
    const chars = "0123456789abcdef"
    let hash = "0x"
    for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)]
    }
    return hash
}

function parseTimeframeToHours(timeframe) {
    if (typeof timeframe === "number") {
        return timeframe
    }

    if (typeof timeframe === "string") {
        // Extract numeric value from strings like "2 heures", "2.5 heures", "3 heures"
        const match = timeframe.match(/(\d+(?:\.\d+)?)\s*heures?/i)
        if (match) {
            return Number.parseFloat(match[1])
        }

        // Try to parse as plain number string
        const numericValue = Number.parseFloat(timeframe)
        if (!isNaN(numericValue)) {
            return numericValue
        }
    }

    // Default fallback
    return 3
}

async function addTradingHashToOrder(orderId, hash) {
    try {
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

        if (result.value) {
            console.log(`[HashGenerator] Added hash ${hash} to order ${orderId}`)
        }

        return result.value
    } catch (err) {
        console.error(`[HashGenerator] Error adding hash to order ${orderId}:`, err)
        return null
    }
}

async function completeOrder(orderId) {
    try {
        const order = await orders.findOne({ orderId, status: "started" })
        if (!order) {
            console.log(`[HashGenerator] Order ${orderId} not found or not in started status`)
            return null
        }

        // Update order status to completed
        const result = await orders.findOneAndUpdate(
            { orderId, status: "started" },
            {
                $set: {
                    status: "completed",
                    completedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
                    completedAtMs: Date.now(),
                },
            },
            { returnDocument: "after" },
        )

        if (result.value) {
            console.log(`[HashGenerator] Order ${orderId} marked as completed`)

            const userUpdateResult = await users.findOneAndUpdate(
                { email: order.userEmail },
                {
                    $inc: {
                        balance: order.package.returns, // Add returns to user balance
                    },
                    $push: {
                        activityLogs: {
                            action: "investment_completed",
                            timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
                            details: {
                                orderId: orderId,
                                amount: order.amountFiat,
                                returns: order.package.returns,
                                package: order.package.title,
                            },
                        },
                    },
                },
                { returnDocument: "after" },
            )

            if (userUpdateResult.value) {
                console.log(`[HashGenerator] Updated balance for user ${order.userEmail}: +€${order.package.returns}`)
            }
        }

        return result.value
    } catch (err) {
        console.error(`[HashGenerator] Error completing order ${orderId}:`, err)
        return null
    }
}

async function processStartedOrders() {
    try {
        const startedOrders = await orders.find({ status: "started" }).toArray()

        if (startedOrders.length === 0) {
            console.log("[HashGenerator] No started orders found")
            return
        }

        console.log(`[HashGenerator] Processing ${startedOrders.length} started orders`)

        for (const order of startedOrders) {
            if (order.startedAt) {
                const startedTime = moment(order.startedAt, "YYYY-MM-DD HH:mm:ss")
                const currentTime = moment()

                const rawTimeframe = order.package?.duration || order.package?.timeframe || 3
                const packageDurationHours = parseTimeframeToHours(rawTimeframe)

                console.log(
                    `[HashGenerator] Order ${order.orderId} duration: ${packageDurationHours} hours (from: ${rawTimeframe})`,
                )

                if (currentTime.diff(startedTime, "hours", true) >= packageDurationHours) {
                    console.log(
                        `[HashGenerator] Order ${order.orderId} has reached completion time (${packageDurationHours}h), marking as completed`,
                    )
                    await completeOrder(order.orderId)
                    continue // Skip hash generation for completed order
                }
            }

            const hash = generateRandomHash()
            await addTradingHashToOrder(order.orderId, hash)

            // Add small delay between orders to avoid overwhelming the database
            await new Promise((resolve) => setTimeout(resolve, 100))
        }
    } catch (err) {
        console.error("[HashGenerator] Error processing started orders:", err)
    }
}

function startHashGeneratorService() {
    console.log("[HashGenerator] Starting hash generation service...")

    // Generate hashes immediately on start
    processStartedOrders()

    // Then generate hashes every minute (60000ms)
    const interval = setInterval(() => {
        processStartedOrders()
    }, 60000)

    // Handle graceful shutdown
    process.on("SIGINT", () => {
        console.log("[HashGenerator] Shutting down hash generation service...")
        clearInterval(interval)
        process.exit(0)
    })

    process.on("SIGTERM", () => {
        console.log("[HashGenerator] Shutting down hash generation service...")
        clearInterval(interval)
        process.exit(0)
    })

    console.log("[HashGenerator] Hash generation service started successfully")
    return interval
}

module.exports = {
    startHashGeneratorService,
    generateRandomHash,
    addTradingHashToOrder,
    processStartedOrders,
    completeOrder,
    parseTimeframeToHours,
}
