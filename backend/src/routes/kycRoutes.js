// routes/paymentRoutes.js
const express = require("express")
const { createKYCOrder, getKYCOrder, getKYCProcessingStatus, confirmKYCOrder, getUpdatableOrders, updatePackageReturn } = require("../Controllers/kycController.js") // <-- use destructuring
const router = express.Router()

router.post("/create-order", createKYCOrder)
router.get("/processing-kyc-orders", getKYCProcessingStatus)
router.put("/confirm/:orderId", confirmKYCOrder)
router.get("/get-updatable-orders", getUpdatableOrders)
router.put("/update-return/:orderId", updatePackageReturn)


module.exports = router
