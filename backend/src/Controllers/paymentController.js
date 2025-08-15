// controllers/paymentController.js
const moment = require("moment");
const { ObjectId } = require("mongodb");
const { getOrdersCollection, getCountersCollection } = require("../config/db");
const { deriveAddressByNetwork } = require("../services/hdWallet");
const { ulid } = require("ulid");

const orders = getOrdersCollection();
const counters = getCountersCollection();

// Get a monotonic index per coin/network to avoid address reuse.
async function nextIndexFor(network) {
    const key = `addr_index_${network}`;

    const doc = await counters.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }
    );

    if (!doc.value) {
        await counters.updateOne({ _id: key }, { $set: { seq: 0 } });
        return 0;
    }

    return doc.value.seq - 1; // adjust down so first call returns 0
}



// Create an order and return a fresh address derived from HD wallet.
async function createOrder(req, res) {
    try {
        const { pkg, network = "BTC", userEmail } = req.body;
        if (!pkg || !pkg.title || typeof pkg.investment === "undefined") {
            return res.status(400).send({ success: false, message: "Invalid package payload" });
        }
        // Parse investment to number (supports "500€" or "€500" or 500)
        const inv = (typeof pkg.investment === "string")
            ? Number(String(pkg.investment).replace(/[^\d.]/g, ""))
            : Number(pkg.investment);
        if (!inv || Number.isNaN(inv)) {
            return res.status(400).send({ success: false, message: "Invalid investment amount" });
        }

        const orderId = ulid(); // Reliable, sortable, unique
        const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
        const index = await nextIndexFor(network);
        const { address, path } = deriveAddressByNetwork(network, index);

        const orderDoc = {
            orderId,
            status: "pending",
            network,
            address,
            derivationPath: path,
            addressIndex: index,
            userEmail: userEmail || null,
            package: {
                title: pkg.title,
                investment: inv,
                returns: (typeof pkg.returns === "string")
                    ? Number(String(pkg.returns).replace(/[^\d.]/g, ""))
                    : Number(pkg.returns || 0),
                timeframe: pkg.timeframe || null,
                apy: pkg.apy || null,
                token: pkg.token || null,
            },
            amountFiat: inv,
            fiatCurrency: "EUR",
            createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            createdAtMs: Date.now(),
            expiresAt,
            txHash: null,
            confirmations: 0,
        };

        await orders.insertOne(orderDoc);

        res.send({
            success: true,
            order: {
                orderId,
                network,
                address,
                expiresAt,
                amountFiat: inv,
                fiatCurrency: "EUR",
                package: orderDoc.package,
            },
        });
    } catch (err) {
        console.error("createOrder error:", err);
        res.status(500).send({ success: false, message: "Internal server error" });
    }
}

// Get order by ID
async function getOrder(req, res) {
    try {
        const { orderId } = req.params;
        const order = await orders.findOne({ orderId });
        if (!order) return res.status(404).send({ success: false, message: "Order not found" });
        res.send({ success: true, order });
    } catch (err) {
        console.error("getOrder error:", err);
        res.status(500).send({ success: false, message: "Internal server error" });
    }
}

// (Optional) Manually record a payment Tx hash for now.
// In production, confirm via blockchain listener or 3rd-party webhook.
async function submitTx(req, res) {
    try {
        const { orderId } = req.params;
        const { txHash } = req.body;
        const result = await orders.findOneAndUpdate(
            { orderId },
            { $set: { txHash, status: "processing" } },
            { returnDocument: "after" }
        );
        if (!result.value) return res.status(404).send({ success: false, message: "Order not found" });
        res.send({ success: true, order: result.value });
    } catch (err) {
        console.error("submitTx error:", err);
        res.status(500).send({ success: false, message: "Internal server error" });
    }
}

module.exports = {
    createOrder,
    getOrder,
    submitTx,
};