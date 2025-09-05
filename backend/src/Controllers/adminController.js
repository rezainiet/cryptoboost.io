const {
    getUserCollection,
    getOrdersCollection,
    getWithdrawCollection,
    getActivityLogsCollection,
} = require("../config/db")

// Monitor total invested amounts
const getInvestmentStats = async (req, res) => {
    try {
        const ordersCollection = getOrdersCollection()

        // Get total invested amounts
        const totalInvested = await ordersCollection
            .aggregate([
                { $match: { status: { $in: ["completed", "processing", "paid"] } } },
                { $group: { _id: null, total: { $sum: "$amountFiat" } } },
            ])
            .toArray()

        // Get investment by currency
        const investmentByCurrency = await ordersCollection
            .aggregate([
                { $match: { status: { $in: ["completed", "processing", "paid"] } } },
                { $group: { _id: "$fiatCurrency", total: { $sum: "$amountFiat" }, count: { $sum: 1 } } },
            ])
            .toArray()

        // Get recent investments (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const recentInvestments = await ordersCollection
            .aggregate([
                {
                    $match: {
                        status: { $in: ["completed", "processing", "paid"] },
                        createdAtMs: { $gte: thirtyDaysAgo.getTime() },
                    },
                },
                { $group: { _id: null, total: { $sum: "$amountFiat" }, count: { $sum: 1 } } },
            ])
            .toArray()

        // Get investment trends (daily for last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const dailyTrends = await ordersCollection
            .aggregate([
                {
                    $match: {
                        status: { $in: ["completed", "processing", "paid"] },
                        createdAtMs: { $gte: sevenDaysAgo.getTime() },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAtMs" } } },
                        total: { $sum: "$amountFiat" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ])
            .toArray()

        res.json({
            success: true,
            data: {
                totalInvested: totalInvested[0]?.total || 0,
                investmentByCurrency,
                recentInvestments: recentInvestments[0] || { total: 0, count: 0 },
                dailyTrends,
            },
        })
    } catch (error) {
        console.error("Error getting investment stats:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

// Manage users
const getUserStats = async (req, res) => {
    try {
        const usersCollection = getUserCollection()
        const ordersCollection = getOrdersCollection()

        // Total users
        const totalUsers = await usersCollection.countDocuments()

        // Active users (last 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
        const activeUsers = await usersCollection.countDocuments({
            lastActive: { $gte: thirtyDaysAgo },
        })

        // New users (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const newUsers = await usersCollection.countDocuments({
            createdAt: { $gte: sevenDaysAgo.toISOString().split("T")[0] },
        })

        const usersWithInvestmentsResult = await ordersCollection
            .aggregate([{ $group: { _id: "$userEmail" } }, { $count: "totalUniqueUsers" }])
            .toArray()

        const usersWithInvestmentsCount = usersWithInvestmentsResult[0]?.totalUniqueUsers || 0

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                newUsers,
                usersWithInvestments: usersWithInvestmentsCount,
            },
        })
    } catch (error) {
        console.error("Error getting user stats:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query
        const usersCollection = getUserCollection()
        const ordersCollection = getOrdersCollection()

        const skip = (page - 1) * limit
        const searchQuery = search
            ? {
                $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }],
            }
            : {}

        const users = await usersCollection
            .find(searchQuery)
            .skip(skip)
            .limit(Number.parseInt(limit))
            .sort({ createdAt: -1 })
            .toArray()

        // Get investment data for each user
        const usersWithInvestments = await Promise.all(
            users.map(async (user) => {
                const userOrders = await ordersCollection.find({ userEmail: user.email }).toArray()
                const totalInvested = userOrders.reduce((sum, order) => sum + (order.amountFiat || 0), 0)
                const completedOrders = userOrders.filter((order) => order.status === "completed").length

                return {
                    ...user,
                    totalInvested,
                    totalOrders: userOrders.length,
                    completedOrders,
                }
            }),
        )

        const totalCount = await usersCollection.countDocuments(searchQuery)

        res.json({
            success: true,
            data: {
                users: usersWithInvestments,
                pagination: {
                    currentPage: Number.parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    hasNext: skip + users.length < totalCount,
                    hasPrev: page > 1,
                },
            },
        })
    } catch (error) {
        console.error("Error getting users:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

// Validate performance
const getPerformanceStats = async (req, res) => {
    try {
        const ordersCollection = getOrdersCollection()
        const withdrawCollection = getWithdrawCollection()

        // Order completion rates
        const orderStats = await ordersCollection
            .aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ])
            .toArray()

        const totalOrders = orderStats.reduce((sum, stat) => sum + stat.count, 0)
        const completedOrders = orderStats.find((stat) => stat._id === "completed")?.count || 0
        const processingOrders = orderStats.find((stat) => stat._id === "processing")?.count || 0
        const failedOrders = orderStats.find((stat) => stat._id === "failed")?.count || 0

        // Average processing time
        const avgProcessingTime = await ordersCollection
            .aggregate([
                {
                    $match: {
                        status: "completed",
                        paidAt: { $exists: true },
                        createdAtMs: { $exists: true },
                    },
                },
                {
                    $addFields: {
                        processingTime: {
                            $subtract: [{ $toLong: "$paidAt" }, "$createdAtMs"],
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        avgTime: { $avg: "$processingTime" },
                    },
                },
            ])
            .toArray()

        // Success rate by network
        const networkPerformance = await ordersCollection
            .aggregate([
                {
                    $group: {
                        _id: "$network",
                        total: { $sum: 1 },
                        completed: {
                            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                        },
                    },
                },
                {
                    $addFields: {
                        successRate: { $multiply: [{ $divide: ["$completed", "$total"] }, 100] },
                    },
                },
            ])
            .toArray()

        // Withdrawal statistics
        const withdrawStats = await withdrawCollection
            .aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        totalAmount: { $sum: "$amount" },
                    },
                },
            ])
            .toArray()

        res.json({
            success: true,
            data: {
                orderStats: {
                    total: totalOrders,
                    completed: completedOrders,
                    processing: processingOrders,
                    failed: failedOrders,
                    completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0,
                },
                avgProcessingTime: avgProcessingTime[0]?.avgTime || 0,
                networkPerformance,
                withdrawStats,
            },
        })
    } catch (error) {
        console.error("Error getting performance stats:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

// Get system activity logs
const getActivityLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query
        const activityCollection = getActivityLogsCollection()

        const skip = (page - 1) * limit

        const logs = await activityCollection
            .find({})
            .skip(skip)
            .limit(Number.parseInt(limit))
            .sort({ timestamp: -1 })
            .toArray()

        const totalCount = await activityCollection.countDocuments()

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    currentPage: Number.parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                },
            },
        })
    } catch (error) {
        console.error("Error getting activity logs:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const updateUser = async (req, res) => {
    try {
        const { id } = req.params
        const updateData = req.body
        const usersCollection = getUserCollection()

        const result = await usersCollection.updateOne(
            { _id: new require("mongodb").ObjectId(id) },
            { $set: { ...updateData, updatedAt: new Date().toISOString() } },
        )

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        res.json({ success: true, message: "User updated successfully" })
    } catch (error) {
        console.error("Error updating user:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params
        const usersCollection = getUserCollection()

        const result = await usersCollection.deleteOne({ _id: new require("mongodb").ObjectId(id) })

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        res.json({ success: true, message: "User deleted successfully" })
    } catch (error) {
        console.error("Error deleting user:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const getInvestmentStatsByTimeframe = async (req, res) => {
    try {
        const { timeframe } = req.params // '7d', '30d', '90d', '1y'
        const ordersCollection = getOrdersCollection()

        let daysBack = 7
        switch (timeframe) {
            case "30d":
                daysBack = 30
                break
            case "90d":
                daysBack = 90
                break
            case "1y":
                daysBack = 365
                break
        }

        const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

        const stats = await ordersCollection
            .aggregate([
                {
                    $match: {
                        status: { $in: ["completed", "processing", "paid"] },
                        createdAtMs: { $gte: startDate.getTime() },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAtMs" } } },
                        total: { $sum: "$amountFiat" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ])
            .toArray()

        res.json({ success: true, data: stats })
    } catch (error) {
        console.error("Error getting investment stats by timeframe:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const exportUsers = async (req, res) => {
    try {
        const usersCollection = getUserCollection()
        const users = await usersCollection.find({}).toArray()

        res.setHeader("Content-Type", "application/json")
        res.setHeader("Content-Disposition", "attachment; filename=users-export.json")
        res.json(users)
    } catch (error) {
        console.error("Error exporting users:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const exportInvestments = async (req, res) => {
    try {
        const ordersCollection = getOrdersCollection()
        const investments = await ordersCollection.find({}).toArray()

        res.setHeader("Content-Type", "application/json")
        res.setHeader("Content-Disposition", "attachment; filename=investments-export.json")
        res.json(investments)
    } catch (error) {
        console.error("Error exporting investments:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const getUsersWithDeposits = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query
        const usersCollection = getUserCollection()
        const ordersCollection = getOrdersCollection()

        const skip = (page - 1) * limit

        // First, get all users who have made deposits (orders with completed, processing, or paid status)
        const usersWithDepositsEmails = await ordersCollection
            .aggregate([
                {
                    $match: {
                        status: { $in: ["completed", "processing", "paid"] },
                    },
                },
                {
                    $group: {
                        _id: "$userEmail",
                        totalDeposited: { $sum: "$amountFiat" },
                        depositCount: { $sum: 1 },
                        lastDepositDate: { $max: "$createdAt" },
                    },
                },
            ])
            .toArray()

        const depositUserEmails = usersWithDepositsEmails.map((user) => user._id)

        if (depositUserEmails.length === 0) {
            return res.json({
                success: true,
                data: {
                    users: [],
                    pagination: {
                        currentPage: Number.parseInt(page),
                        totalPages: 0,
                        totalCount: 0,
                        hasNext: false,
                        hasPrev: false,
                    },
                },
            })
        }

        // Build search query for users with deposits
        const searchQuery = {
            email: { $in: depositUserEmails },
            ...(search && {
                $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }],
            }),
        }

        const users = await usersCollection
            .find(searchQuery)
            .skip(skip)
            .limit(Number.parseInt(limit))
            .sort({ createdAt: -1 })
            .toArray()

        // Enhance users with deposit information
        const usersWithDepositInfo = users.map((user) => {
            const depositInfo = usersWithDepositsEmails.find((deposit) => deposit._id === user.email)
            return {
                ...user,
                totalDeposited: depositInfo?.totalDeposited || 0,
                depositCount: depositInfo?.depositCount || 0,
                lastDepositDate: depositInfo?.lastDepositDate || null,
                hasDeposits: true,
            }
        })

        const totalCount = await usersCollection.countDocuments(searchQuery)

        res.json({
            success: true,
            data: {
                users: usersWithDepositInfo,
                pagination: {
                    currentPage: Number.parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    hasNext: skip + users.length < totalCount,
                    hasPrev: page > 1,
                },
            },
        })
    } catch (error) {
        console.error("Error getting users with deposits:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const getDepositStats = async (req, res) => {
    try {
        const ordersCollection = getOrdersCollection()
        const usersCollection = getUserCollection()

        // Get users with deposits count
        const usersWithDepositsResult = await ordersCollection
            .aggregate([
                { $match: { status: { $in: ["completed", "processing", "paid"] } } },
                { $group: { _id: "$userEmail" } },
                { $count: "totalUsersWithDeposits" },
            ])
            .toArray()

        const usersWithDepositsCount = usersWithDepositsResult[0]?.totalUsersWithDeposits || 0

        // Get total users for comparison
        const totalUsers = await usersCollection.countDocuments()

        // Get average deposit per user
        const avgDepositResult = await ordersCollection
            .aggregate([
                { $match: { status: { $in: ["completed", "processing", "paid"] } } },
                {
                    $group: {
                        _id: "$userEmail",
                        totalDeposited: { $sum: "$amountFiat" },
                    },
                },
                {
                    $group: {
                        _id: null,
                        avgDepositPerUser: { $avg: "$totalDeposited" },
                        totalDepositedAmount: { $sum: "$totalDeposited" },
                    },
                },
            ])
            .toArray()

        const avgDepositPerUser = avgDepositResult[0]?.avgDepositPerUser || 0
        const totalDepositedAmount = avgDepositResult[0]?.totalDepositedAmount || 0

        res.json({
            success: true,
            data: {
                usersWithDeposits: usersWithDepositsCount,
                totalUsers,
                depositConversionRate: totalUsers > 0 ? ((usersWithDepositsCount / totalUsers) * 100).toFixed(2) : 0,
                avgDepositPerUser: avgDepositPerUser.toFixed(2),
                totalDepositedAmount,
            },
        })
    } catch (error) {
        console.error("Error getting deposit stats:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const validInvestmentMatchQuery = {
    status: { $in: ["completed", "processing", "started"] },
    txHash: { $exists: true, $ne: null },
    amountCryptoExpected: { $gt: 0 },
    amountCryptoReceived: { $gt: 0 },
    paidAt: { $exists: true, $ne: null },
}

const getInvestedUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query
        const pageNum = Number(page)
        const limitNum = Number(limit)
        const skip = (pageNum - 1) * limitNum

        const usersCollection = getUserCollection()
        const ordersCollection = getOrdersCollection()

        // Step 1: Aggregate real investment orders
        const usersWithInvestments = await ordersCollection.aggregate([
            { $match: validInvestmentMatchQuery },
            {
                $group: {
                    _id: "$userEmail",
                    totalInvested: { $sum: "$amountFiat" },
                    investmentCount: { $sum: 1 },
                    lastInvestmentDate: { $max: "$createdAt" }
                }
            }
        ]).toArray()

        const investedUserEmails = usersWithInvestments.map(u => u._id)

        if (investedUserEmails.length === 0) {
            return res.json({
                success: true,
                data: {
                    users: [],
                    pagination: {
                        currentPage: pageNum,
                        totalPages: 0,
                        totalCount: 0,
                        hasNext: false,
                        hasPrev: false
                    }
                }
            })
        }

        // Step 2: Find users by email with optional search
        const searchQuery = {
            email: { $in: investedUserEmails },
            ...(search && {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ]
            })
        }

        const users = await usersCollection.find(searchQuery)
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 })
            .toArray()

        const usersWithInvestmentInfo = users.map(user => {
            const investment = usersWithInvestments.find(i => i._id === user.email)
            return {
                ...user,
                totalInvested: investment?.totalInvested || 0,
                investmentCount: investment?.investmentCount || 0,
                lastInvestmentDate: investment?.lastInvestmentDate || null,
                hasInvestments: true
            }
        })

        const totalCount = await usersCollection.countDocuments(searchQuery)

        res.json({
            success: true,
            data: {
                users: usersWithInvestmentInfo,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalCount,
                    hasNext: skip + users.length < totalCount,
                    hasPrev: pageNum > 1
                }
            }
        })
    } catch (error) {
        console.error("Error getting invested users:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const getNonInvestedUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query
        const pageNum = Number(page)
        const limitNum = Number(limit)
        const skip = (pageNum - 1) * limitNum

        const usersCollection = getUserCollection()
        const ordersCollection = getOrdersCollection()

        // Step 1: Find invested user emails (valid orders only)
        const usersWithInvestments = await ordersCollection.aggregate([
            { $match: validInvestmentMatchQuery },
            {
                $group: { _id: "$userEmail" }
            }
        ]).toArray()

        const investedUserEmails = usersWithInvestments.map(u => u._id)

        // Step 2: Query for users not in that list
        const searchQuery = {
            email: { $nin: investedUserEmails },
            ...(search && {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ]
            })
        }

        const users = await usersCollection.find(searchQuery)
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 })
            .toArray()

        const usersWithInvestmentInfo = users.map(user => ({
            ...user,
            totalInvested: 0,
            investmentCount: 0,
            lastInvestmentDate: null,
            hasInvestments: false
        }))

        const totalCount = await usersCollection.countDocuments(searchQuery)

        res.json({
            success: true,
            data: {
                users: usersWithInvestmentInfo,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalCount,
                    hasNext: skip + users.length < totalCount,
                    hasPrev: pageNum > 1
                }
            }
        })
    } catch (error) {
        console.error("Error getting non-invested users:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}


const getAllTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = "", status = "" } = req.query
        const ordersCollection = getOrdersCollection()

        const skip = (page - 1) * limit

        // Allowed statuses
        const allowedStatuses = ["processing", "started", "completed"]

        // Build search and filter query
        const matchQuery = {
            status: { $in: allowedStatuses },
        }

        if (search) {
            matchQuery.$or = [
                { userEmail: { $regex: search, $options: "i" } },
                { orderId: { $regex: search, $options: "i" } },
                { network: { $regex: search, $options: "i" } },
                { fiatCurrency: { $regex: search, $options: "i" } },
            ]
        }

        if (status && allowedStatuses.includes(status)) {
            matchQuery.status = status
        }

        // ✅ Exclude tradingHashes using projection
        const projection = {
            tradingHashes: 0, // exclude this field
        }

        const transactions = await ordersCollection
            .find(matchQuery, { projection })
            .skip(skip)
            .limit(Number.parseInt(limit))
            .sort({ createdAtMs: -1 })
            .toArray()

        const totalCount = await ordersCollection.countDocuments(matchQuery)

        // Stats based on the same filtered query
        const transactionStats = await ordersCollection
            .aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        totalAmount: { $sum: "$amountFiat" },
                    },
                },
            ])
            .toArray()

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    currentPage: Number.parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    hasNext: skip + transactions.length < totalCount,
                    hasPrev: page > 1,
                },
                stats: transactionStats,
            },
        })
    } catch (error) {
        console.error("Error getting transactions:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}


module.exports = {
    getInvestmentStats,
    getUserStats,
    getAllUsers,
    getPerformanceStats,
    getActivityLogs,
    updateUser,
    deleteUser,
    getInvestmentStatsByTimeframe,
    exportUsers,
    exportInvestments,
    getUsersWithDeposits,
    getDepositStats,
    getInvestedUsers,
    getNonInvestedUsers,
    getAllTransactions,
}
