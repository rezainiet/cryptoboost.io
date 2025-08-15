// routes/paymentRoutes.js
const express = require("express");
const { createOrder, getOrder, submitTx } = require("../Controllers/paymentController");
const router = express.Router();

router.post("/create-order", createOrder);
router.get("/:orderId", getOrder);
router.post("/:orderId/submit-tx", submitTx);

module.exports = router;