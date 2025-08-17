const express = require("express");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

const { connectDB } = require("./config/db");

const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const priceRoutes = require("./routes/priceRoutes");
// const { startPaymentMonitor } = require("./services/paymentMonitor");
// require("./worker/paymentChecker");
const { startHashGeneratorService } = require("./services/hashGeneratorService");
const { deriveETHAddress } = require("./services/hdWallet");
const { startPaymentMonitor } = require("./services/paymentMonitor");


// Load environment variables from .env file
dotenv.config();

// console.log(deriveETHAddress(11))
// Create express app
const app = express();
const port = process.env.PORT || 9000;

app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, origin); // reflect the request origin
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Connect to MongoDB
connectDB().catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/payments", paymentRouter);
app.use("/withdrawals", withdrawalRoutes)
app.use("/prices", priceRoutes)

// // Start background payment monitor (runs every 60s; change if you want)
startPaymentMonitor({ intervalMs: 60_000, minConfirmRatio: 0.98 });

startHashGeneratorService()
// Root route
app.get("/", (req, res) => {
  res.send("🚀 Server is Running!");
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
