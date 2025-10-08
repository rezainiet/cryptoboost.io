const express = require("express")
const router = express.Router()
const withdrawalController = require("../Controllers/withdrawalController")

// Create withdrawal request
router.post("/create", withdrawalController.createWithdrawal)
router.get("/get-withdrawals/:email", withdrawalController.getWithdrawals)


// Generate payment for withdrawal VAT
router.post("/:withdrawalId/generate-payment", withdrawalController.generateWithdrawalPayment)

router.post("/create-verification-payment", withdrawalController.createVerificationPayment)
router.post("/create-after-verification", withdrawalController.createWithdrawalAfterVerification)

// Get user withdrawals
router.get("/user/:email", withdrawalController.getUserWithdrawals)
router.post("/update-order-status", withdrawalController.updateOrderStatus)

// Update withdrawal status
router.put("/:withdrawalId/status", withdrawalController.updateWithdrawalStatus)

module.exports = router
