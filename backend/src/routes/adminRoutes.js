const express = require("express")
const router = express.Router()
const { MongoClient } = require("mongodb")
const {
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
} = require("../controllers/adminController")
const { getUserCollection } = require("../config/db")

const checkAdminRole = async (req, res, next) => {
    try {
        // Extract user email from request headers or body
        const userEmail = req.headers["user-email"] || (req.body && req.body.userEmail) || req.query.userEmail
        // console.log("[22]", req.body)

        if (!userEmail) {
            return res.status(401).json({
                success: false,
                message: "User email is required for admin access",
            })
        }

        const user = await getUserCollection().findOne({ email: userEmail })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin role required.",
            })
        }

        // Add user info to request for use in controllers
        // req.adminUser = user
        next()
    } catch (error) {
        console.error("Admin role check error:", error)
        res.status(500).json({
            success: false,
            message: "Error verifying admin role",
        })
    }
}

// Investment monitoring routes
router.post("/investments/stats", checkAdminRole, getInvestmentStats)
router.post("/investments/stats/:timeframe", checkAdminRole, getInvestmentStatsByTimeframe)
router.post("/investments/trends", checkAdminRole, getInvestmentStats) // Added trends endpoint
router.post("/investments/by-currency", checkAdminRole, getInvestmentStats) // Added currency breakdown endpoint

// User management routes
router.post("/users/stats", checkAdminRole, getUserStats)
router.post("/users", checkAdminRole, getAllUsers)
router.patch("/users/:id", checkAdminRole, updateUser)
router.delete("/users/:id", checkAdminRole, deleteUser)

// Performance validation routes
router.post("/performance/stats", checkAdminRole, getPerformanceStats)

// Activity logs
router.post("/activity-logs", checkAdminRole, getActivityLogs)

// Export functionality
router.post("/users/export", checkAdminRole, exportUsers)
router.post("/investments/export", checkAdminRole, exportInvestments)

module.exports = router
