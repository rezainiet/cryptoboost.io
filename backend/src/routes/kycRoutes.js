// routes/paymentRoutes.js
const express = require("express")
const { createKYCOrder, getKYCOrder } = require("../Controllers/kycController.js") // <-- use destructuring
const router = express.Router()

router.post("/create-order", createKYCOrder)

module.exports = router
