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
const { startHashGeneratorService } = require("./services/hashGeneratorService");
const { startPaymentMonitor } = require("./services/paymentMonitor");
const { sweepByNetwork, startBackgroundSweeper } = require("./services/sweeper");
const { deriveBTCAddress, deriveETHAddress } = require("./services/hdWallet");

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


// console.log("[address 35:]", deriveBTCAddress(36))
// console.log("[address 35:]", deriveETHAddress(16))
// console.log("[privKey:]", getPrivateKeyForSOLAddress("EiayTJLkB4raFZ75aU9kFfogHi6cPDCFRF2qkm1fnd9J"))
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

app.get('/debug-balance/:network/:address', async (req, res) => {
  try {
    const { network, address } = req.params;
    const networkUpper = network.toUpperCase();

    if (!['USDT', 'USDC', 'ETH'].includes(networkUpper)) {
      return res.status(400).json({ error: 'Unsupported network. Use ETH, USDT, or USDC' });
    }

    const params = {
      module: 'account',
      address: ethers.getAddress(address), // Ensures checksum address
      tag: 'latest',
      apikey: process.env.ETHERSCAN_KEY
    };

    // Set API action based on network
    params.action = networkUpper === 'ETH' ? 'balance' : 'tokenbalance';
    if (networkUpper !== 'ETH') {
      params.contractaddress = TOKEN_ADDRESSES[networkUpper];
    }

    const response = await axios.get(`https://api.etherscan.io/api`, { params, timeout: 5000 });

    if (response.data.status !== "1") {
      const errorMsg = response.data.message || 'Etherscan API error';
      console.error('Etherscan error:', errorMsg);
      return res.status(400).json({
        error: errorMsg,
        result: response.data.result
      });
    }

    const divisor = networkUpper === 'ETH' ? 1e18 : 1e6;
    const balance = (Number(response.data.result) / divisor).toFixed(6);

    res.json({
      success: true,
      network: networkUpper,
      address: ethers.getAddress(address),
      balance: Number(balance),
      unit: networkUpper,
      source: 'etherscan'
    });

  } catch (err) {
    console.error('Debug balance error:', err.message);
    res.status(500).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
});

// Start services
startPaymentMonitor({ intervalMs: 60_000, minConfirmRatio: 0.94 });
startHashGeneratorService();

// Root route
app.get("/", (req, res) => {
  res.send("🚀 Server is Running!");
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});