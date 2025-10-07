// routes/paymentRoutes.js
const express = require("express")
const {
    createOrder,
    getOrder,
    generateAddress,
    submitTx,
    getUserOrders,
    getUserAnalytics,
    getActiveInvestments,
    extendOrder,
    getDashboardStats,
    startBot,
    deleteExpiredOrders,
    addTradingHash,
    getKYCStatus,
} = require("../Controllers/paymentController")
const router = express.Router()

router.post("/create-order", createOrder)
router.get("/:orderId", getOrder)
router.get("/get-kyc-status/:email", getKYCStatus)
router.post("/:orderId/generate-address", generateAddress)
router.post("/:orderId/submit-tx", submitTx)

router.get("/user/:email", getUserOrders)
router.get("/analytics/:email", getUserAnalytics)
router.get("/active/:email", getActiveInvestments)
router.post("/:orderId/extend", extendOrder)
router.get("/dashboard-stats/:email", getDashboardStats)

router.post("/:orderId/start-bot", startBot)
router.post("/:orderId/add-hash", addTradingHash)
router.delete("/delete-expired", deleteExpiredOrders)

module.exports = router
