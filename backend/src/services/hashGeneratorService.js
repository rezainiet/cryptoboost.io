const { getOrdersCollection } = require("../config/db")
const moment = require("moment")

const orders = getOrdersCollection()

// Generate random transaction hash
function generateRandomHash() {
    const chars = "0123456789abcdef"
    let hash = "0x"
    for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)]
    }
    return hash
}

// Add trading hash to order
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

// Process all started orders and generate hashes
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
                const packageDurationHours = 3 // 3 hours package timeframe

                // Check if 3 hours have elapsed since start
                if (currentTime.diff(startedTime, "hours", true) >= packageDurationHours) {
                    console.log(`[HashGenerator] Order ${order.orderId} has reached completion time, marking as completed`)
                    await completeOrder(order.orderId)
                    continue // Skip hash generation for completed order
                }
            }

            // Generate hash only for orders that haven't reached completion time
            const hash = generateRandomHash()
            await addTradingHashToOrder(order.orderId, hash)

            // Add small delay between orders to avoid overwhelming the database
            await new Promise((resolve) => setTimeout(resolve, 100))
        }
    } catch (err) {
        console.error("[HashGenerator] Error processing started orders:", err)
    }
}

// Start the hash generation service
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
}

// Stop hash generation for completed orders
async function completeOrder(orderId) {
    try {
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
        }

        return result.value
    } catch (err) {
        console.error(`[HashGenerator] Error completing order ${orderId}:`, err)
        return null
    }
}

module.exports = {
    startHashGeneratorService,
    generateRandomHash,
    addTradingHashToOrder,
    processStartedOrders,
    completeOrder,
}
