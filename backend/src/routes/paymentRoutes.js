// routes/paymentRoutes.js
const express = require("express")
const {
    createOrder,
    getOrder,
    submitTx,
    getUserOrders,
    getUserAnalytics,
    getActiveInvestments,
    extendOrder,
    getDashboardStats,
} = require("../Controllers/paymentController")
const router = express.Router()

router.post("/create-order", createOrder)
router.get("/:orderId", getOrder)
router.post("/:orderId/submit-tx", submitTx)

router.get("/user/:email", getUserOrders)
router.get("/analytics/:email", getUserAnalytics)
router.get("/active/:email", getActiveInvestments)
router.post("/:orderId/extend", extendOrder)
router.get("/dashboard-stats/:email", getDashboardStats)

module.exports = router
