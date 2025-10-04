const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const axios = require("axios");
const { ethers } = require("ethers");

const { connectDB } = require("./config/db");
const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const priceRoutes = require("./routes/priceRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contactRoutes = require("./routes/contactRoutes");


const { startHashGeneratorService } = require("./services/hashGeneratorService");
const { startPaymentMonitor } = require("./services/paymentMonitor");
const { sweepByNetwork, startBackgroundSweeper } = require("./services/sweeper");
const { deriveBTCAddress, deriveETHAddress, deriveTRXAddress, deriveSOLAddress, deriveAddressByNetwork, getPrivateKeyForSOLAddress } = require("./services/hdWallet");

// Load environment variables
dotenv.config();

// Token addresses with proper checksums
const TOKEN_ADDRESSES = {
  USDT: ethers.getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
  USDC: ethers.getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
};

// Create express app
const app = express();
const port = process.env.PORT || 9000;

app.set("trust proxy", true)
// Middleware
app.use(cors({
  origin: function (origin, callback) {
    callback(null, origin);
  },
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Database connection
connectDB().catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/payments", paymentRouter);
app.use("/withdrawals", withdrawalRoutes);
app.use("/prices", priceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact-form", contactRoutes);


// Start services

startPaymentMonitor({ intervalMs: 120000, minConfirmRatio: 1 });
startHashGeneratorService();
startBackgroundSweeper()


// Test endpoint for sweeping
app.get('/test-sweep/:network/:index', async (req, res) => {
  try {
    const { network, index } = req.params;
    const sweepTx = await sweepByNetwork(network, parseInt(index));
    res.json({ success: true, txHash: sweepTx });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/scan-range/:from/:to", async (req, res) => {
  try {
    const from = parseInt(req.params.from, 10);
    const to = parseInt(req.params.to, 10);

    if (isNaN(from) || isNaN(to) || from < 0 || to < from) {
      return res.status(400).json({ error: "Invalid range" });
    }

    const results = [];

    for (let i = from; i <= to; i++) {
      const { address, path } = deriveBTCAddress(i);

      try {
        const response = await axios.get(
          `https://blockstream.info/api/address/${address}`
        );

        const balance =
          response.data.chain_stats.funded_txo_sum -
          response.data.chain_stats.spent_txo_sum;

        if (balance > 0) {
          console.log(
            `[+] Found balance at index ${i}, address ${address}, balance: ${balance / 1e8
            } BTC`
          );

          results.push({
            index: i,
            path,
            address,
            balance: balance / 1e8, // sats → BTC
          });
        } else {
          console.log(
            `[-] No balance at index ${i}, address ${address}`
          );

          results.push({
            index: i,
            path,
            address,
            balance: 0,
          });
        }
      } catch (err) {
        console.error(
          `[x] Error fetching balance for index ${i}, address ${address}: ${err.message}`
        );

        results.push({
          index: i,
          path,
          address,
          error: err.message,
        });
      }
    }

    res.json({ success: true, scanned: results.length, results });
  } catch (err) {
    console.error("Scan range error:", err.message);
    res.status(500).json({ error: err.message });
  }
});



// Root route
app.get("/", (req, res) => {
  res.send("🚀 Server is Running!");
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});