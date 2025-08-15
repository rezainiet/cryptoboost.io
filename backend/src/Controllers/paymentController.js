const moment = require("moment");
const { getOrdersCollection, getCountersCollection } = require("../config/db");
const { deriveAddressByNetwork } = require("../services/hdWallet");
const { ulid } = require("ulid");

const orders = getOrdersCollection();
const counters = getCountersCollection();

// Get monotonic index per network to avoid address reuse
async function nextIndexFor(network) {
    if (!network) throw new Error("Network is required for address generation");

    const key = `addr_index_${network}`;

    const doc = await counters.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" } // returns the updated document
    );

    // doc itself is the updated document
    return doc.seq;
}




// Create an order and return a fresh address derived from HD wallet
async function createOrder(req, res) {
    try {
        const { pkg, network = "BTC", userEmail } = req.body;

        if (!pkg || !pkg.title || typeof pkg.investment === "undefined") {
            return res.status(400).send({ success: false, message: "Invalid package payload" });
        }

        const inv = (typeof pkg.investment === "string")
            ? Number(String(pkg.investment).replace(/[^\d.]/g, ""))
            : Number(pkg.investment);

        if (!inv || Number.isNaN(inv)) {
            return res.status(400).send({ success: false, message: "Invalid investment amount" });
        }

        const orderId = ulid();
        const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
        const index = await nextIndexFor(network); // unique per network
        // console.log("index payment controller", index)
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

// Record a payment Tx hash
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
