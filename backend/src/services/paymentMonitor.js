// services/paymentMonitor.js
const axios = require("axios");
const {
    getOrdersCollection,
    getWithdrawCollection,
    getWithdrawChargePaymentCollection
} = require("../config/db");
const priceService = require("./priceService");
const { getLatestTxHash, getConfirmations } = require("./transactionService");
const { sweepByNetwork } = require("./sweeper");
const { ethers } = require("ethers");
const { v4: uuidv4 } = require("uuid");

// Constants
const ETH_PROVIDER = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`);
const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];
const TOKEN_ADDRESSES = {
    USDT: ethers.getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
    USDC: ethers.getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
};

// ==================== CORE PAYMENT PROCESSING ====================

async function verifyBalanceWithEtherscan(network, address) {
    try {
        const n = network.toUpperCase();

        if (n === 'USDT' || n === 'USDC') {
            const { data } = await axios.get(`https://api.etherscan.io/api`, {
                params: {
                    module: 'account',
                    action: 'tokenbalance',
                    contractaddress: TOKEN_ADDRESSES[n],
                    address: address,
                    tag: 'latest',
                    apikey: process.env.ETHERSCAN_KEY
                }
            });

            if (data.status !== "1") throw new Error(data.message);
            return Number(data.result) / 1e6;
        }

        if (n === 'ETH') {
            const { data } = await axios.get(`https://api.etherscan.io/api`, {
                params: {
                    module: 'account',
                    action: 'balance',
                    address: address,
                    tag: 'latest',
                    apikey: process.env.ETHERSCAN_KEY
                }
            });

            if (data.status !== "1") throw new Error(data.message);
            return Number(data.result) / 1e18;
        }

        throw new Error('Unsupported network for Etherscan verification');
    } catch (err) {
        console.error('Etherscan verification failed:', err.message);
        throw err;
    }
}

async function checkPaymentReceived(network, address) {
    const n = network.toUpperCase();
    try {
        switch (n) {
            case "BTC":
                return await checkBTCBalance(address);
            case "ETH":
                return await checkETHBalance(address);
            case "USDT":
                return await checkERC20Balance(TOKEN_ADDRESSES.USDT, address, 6);
            case "USDC":
                return await checkERC20Balance(TOKEN_ADDRESSES.USDC, address, 6);
            case "TRX":
            case "TRC":
                return await checkTRXBalance(address);
            default:
                throw new Error(`Unsupported network: ${network}`);
        }
    } catch (err) {
        console.error(`Balance check failed for ${network}:`, err.message);
        return 0;
    }
}

async function checkBTCBalance(address) {
    const { data } = await axios.get(`https://blockstream.info/api/address/${address}/utxo`);
    const sats = data.reduce((sum, utxo) => sum + (utxo.value || 0), 0);
    return sats / 1e8;
}

async function checkETHBalance(address) {
    const { data } = await axios.get(`https://api.etherscan.io/api`, {
        params: {
            module: "account",
            action: "balance",
            address: ethers.getAddress(address),
            tag: "latest",
            apikey: process.env.ETHERSCAN_KEY
        }
    });
    if (data.status !== "1") throw new Error(data.message);
    return parseFloat(ethers.formatUnits(BigInt(data.result), 18));
}

async function checkERC20Balance(tokenAddress, userAddress, decimals = 18) {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, ETH_PROVIDER);
    const balance = await contract.balanceOf(ethers.getAddress(userAddress));
    return Number(ethers.formatUnits(balance, decimals));
}

async function processOrderPayment(order) {
    const { network, address, amountFiat, orderId, addressIndex } = order;
    const n = network.toUpperCase();

    try {
        // Get expected crypto amount
        const expectedCrypto = await priceService.convertFiatToCrypto(amountFiat, n, "eur");
        if (!expectedCrypto) {
            console.warn(`⚠️ No price for ${n}, skipping ${orderId}`);
            return;
        }

        // Check received amount
        const [received, txNetwork] = await (async () => {
            if (["USDT", "USDC"].includes(n)) {
                return [
                    await checkERC20Balance(TOKEN_ADDRESSES[n], address, 6),
                    "ETH"
                ];
            }
            return [
                await checkPaymentReceived(n, address),
                n
            ];
        })();

        console.log(`💰 ${orderId} | Expected: ${expectedCrypto.toFixed(8)} ${n}, Received: ${received.toFixed(8)}`);

        // Process payment if threshold met (98%)
        if (received >= expectedCrypto * 0.98) {
            await completeOrderPayment(order, expectedCrypto, received, txNetwork);
        } else {
            await updatePendingOrder(order, expectedCrypto, received);
        }
    } catch (err) {
        console.error(`❌ Order ${orderId} processing failed:`, err.message);
    }
}

async function completeOrderPayment(order, expectedCrypto, received, txNetwork) {
    const { orderId, network, address, addressIndex, _id } = order;
    const n = network.toUpperCase();

    console.log(`✅ Payment received for ${orderId} on ${n}. Processing...`);

    // Get transaction details
    const [txHash, confirmations] = await Promise.all([
        getLatestTxHash(txNetwork, address),
        getConfirmations(txNetwork, address)
    ]);

    // Sweep funds (ERC20 uses ETH network)
    let sweepTx = null;
    try {
        const sweepNetwork = ["USDT", "USDC"].includes(n) ? "ETH" : n;
        sweepTx = await sweepByNetwork(sweepNetwork, addressIndex);
        console.log(`🧹 Swept funds for ${orderId}: ${sweepTx || "No funds to sweep"}`);
    } catch (sweepErr) {
        console.error(`❌ Sweep failed for ${orderId}:`, sweepErr.message);
    }

    // Update order status
    const updateResult = await getOrdersCollection().updateOne(
        { _id },
        {
            $set: {
                status: "pending",
                paidAt: new Date(),
                amountCryptoExpected: expectedCrypto,
                amountCryptoReceived: received,
                txHash,
                confirmations,
                sweepTxHash: sweepTx,
                priceEurAtCheck: expectedCrypto / order.amountFiat,
                lastProbeAt: new Date()
            }
        }
    );

    console.log(updateResult.modifiedCount === 1 ?
        `📦 ${orderId} updated to processing` :
        `❌ Failed to update ${orderId}`);
}

async function updatePendingOrder(order, expectedCrypto, received) {
    await getOrdersCollection().updateOne(
        { _id: order._id },
        {
            $set: {
                lastProbeAt: new Date(),
                amountCryptoExpected: expectedCrypto,
                amountCryptoReceived: received
            }
        }
    );
    console.log(`⌛ Payment pending for ${order.orderId}`);
}

// ==================== WITHDRAWAL PROCESSING ====================

async function processWithdrawalPayment(payment) {
    const { network, address, cryptoAmount, verificationPaymentId } = payment;

    try {
        const received = await checkPaymentReceived(network, address);
        const needed = cryptoAmount * 0.98; // 98% threshold

        if (received >= needed) {
            await completeWithdrawalPayment(payment, received);
        } else {
            await updatePendingWithdrawal(payment, received);
        }
    } catch (err) {
        console.error(`Withdrawal check failed for ${verificationPaymentId}:`, err.message);
    }
}

async function completeWithdrawalPayment(payment, received) {
    const { network, address, _id, verificationPaymentId } = payment;

    const [txHash, confirmations] = await Promise.all([
        getLatestTxHash(network, address),
        getConfirmations(network, address)
    ]);

    await getWithdrawChargePaymentCollection().updateOne(
        { _id },
        {
            $set: {
                status: "confirmed",
                paidAt: new Date(),
                amountCryptoReceived: received,
                txHash,
                confirmations
            }
        }
    );

    console.log(`✅ Withdrawal payment confirmed: ${verificationPaymentId}`);

    if (payment.type === "verification_payment") {
        await createWithdrawalRequest(payment);
    }
}

async function createWithdrawalRequest(payment) {
    const withdrawalDoc = {
        withdrawalId: uuidv4(),
        verificationPaymentId: payment.verificationPaymentId,
        orderId: payment.orderId,
        userEmail: payment.userEmail,
        requestedAmount: payment.withdrawalAmount,
        verificationAmount: payment.verificationAmount,
        network: payment.network,
        walletAddress: payment.walletAddress,
        status: "pending_approval",
        createdAt: new Date(),
        verificationTxHash: payment.txHash
    };

    await getWithdrawCollection().insertOne(withdrawalDoc);
    console.log(`📝 Created withdrawal request for ${payment.userEmail}`);
}

async function updatePendingWithdrawal(payment, received) {
    await getWithdrawChargePaymentCollection().updateOne(
        { _id: payment._id },
        {
            $set: {
                lastProbeAt: new Date(),
                amountCryptoReceived: received
            }
        }
    );
}

// ==================== MAIN POLLER ====================

async function pollPendingOrders() {
    try {
        // Process regular orders
        const orders = await getOrdersCollection()
            .find({ status: "pending", expiresAt: { $gt: Date.now() - 86400000 } })
            .toArray();

        console.log(`🟡 Found ${orders.length} pending orders`);
        await Promise.all(orders.map(processOrderPayment));

        // Process withdrawal payments
        const withdrawals = await getWithdrawChargePaymentCollection()
            .find({ status: "pending", expiresAt: { $gt: Date.now() - 86400000 } })
            .toArray();

        console.log(`🟡 Found ${withdrawals.length} pending withdrawal payments`);
        await Promise.all(withdrawals.map(processWithdrawalPayment));
    } catch (err) {
        console.error("Polling error:", err.message);
    }
}

function startPaymentMonitor({ intervalMs = 60000 } = {}) {
    console.log(`🛰️ Payment monitor started (every ${intervalMs / 1000}s)`);

    // Immediate first run
    pollPendingOrders().catch(err => console.error("Initial polling error:", err));

    // Periodic runs
    setInterval(() => pollPendingOrders().catch(console.error), intervalMs);
}

module.exports = { startPaymentMonitor, pollPendingOrders };