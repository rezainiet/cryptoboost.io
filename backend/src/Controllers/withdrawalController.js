const { v4: uuidv4 } = require("uuid")
const hdWallet = require("../services/hdWallet")
const { getWithdrawCollection, getWithdrawChargePaymentCollection, getOrdersCollection } = require("../config/db")
const priceService = require("../services/priceService")

const createVerificationPayment = async (req, res) => {
    try {
        const {
            orderId,
            withdrawalAmount,
            network,
            verificationNetwork, // Separate network for verification payment
            walletAddress,
            userEmail,
            withdrawalMethod, // 'crypto' or 'bank'
            bankDetails, // Accept bankDetails as nested object instead of separate fields
        } = req.body

        if (!orderId || !withdrawalAmount || !userEmail || !withdrawalMethod) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields",
            })
        }

        const order = getOrdersCollection();
        const orderDoc = await order.findOne({ orderId });

        const numericWithdrawalAmount = Number(withdrawalAmount);
        const numericOrderReturns = Number(orderDoc?.package?.returns);

        console.log("Order returns:", numericOrderReturns);
        console.log("Withdrawal amount:", numericWithdrawalAmount);

        if (numericOrderReturns !== numericWithdrawalAmount) {
            console.error("Withdrawal amount is not same as Generated amount!")
            return res.status(400).json({
                success: false,
                error: "Withdrawal amount is not same as Generated amount!",
            })
        }

        if (!["crypto", "bank"].includes(withdrawalMethod)) {
            console.error("Invalid withdrawal method. Must be 'crypto' or 'bank'")
            return res.status(400).json({
                success: false,
                error: "Invalid withdrawal method. Must be 'crypto' or 'bank'",
            })
        }

        if (withdrawalMethod === "crypto") {
            console.error("Network, wallet address, and verification network are required for crypto withdrawals")
            if (!network || !walletAddress || !verificationNetwork) {
                return res.status(400).json({
                    success: false,
                    error: "Network, wallet address, and verification network are required for crypto withdrawals",
                })
            }

            const validVerificationNetworks = ["SOL", "ETH", "USDC", "USDT"];
            if (!validVerificationNetworks.includes(verificationNetwork)) {
                console.error("Invalid verification network. Must be one of: SOL, ETH, USDC, USDT")
                return res.status(400).json({
                    success: false,
                    error: "Invalid verification network. Must be one of: SOL, ETH, USDC, USDT",
                })
            }
        }

        if (withdrawalMethod === "bank") {
            if (!bankDetails || !bankDetails.firstName || !bankDetails.lastName || !bankDetails.iban) {
                console.error("Bank details (firstName, lastName, iban) are required for bank account withdrawals")
                return res.status(400).json({
                    success: false,
                    error: "Bank details (firstName, lastName, iban) are required for bank account withdrawals",
                })
            }

            if (!verificationNetwork) {
                console.error("Verification network is required for fee payment")
                return res.status(400).json({
                    success: false,
                    error: "Verification network is required for fee payment",
                })
            }
        }

        const verificationFeePercentage = withdrawalMethod === "crypto" ? 0.03 : 0.08; // 3% for crypto, 8% for bank
        const verificationAmount = numericWithdrawalAmount * verificationFeePercentage;

        const withdrawChargePaymentCollection = getWithdrawChargePaymentCollection();

        // 🔎 1. Check if a record already exists for this orderId with status "pending"
        const existingPayment = await withdrawChargePaymentCollection.findOne({ orderId, status: "pending" });
        if (existingPayment) {
            console.log(`[v0] Existing verification payment found for orderId: ${orderId}`);
            return res.json({
                success: true,
                payment: {
                    verificationPaymentId: existingPayment.verificationPaymentId,
                    address: existingPayment.address,
                    cryptoAmount: existingPayment.cryptoAmount,
                    network: existingPayment.verificationNetwork, // return verification network
                    expiresAt: existingPayment.expiresAt,
                    withdrawalMethod: existingPayment.withdrawalMethod,
                    verificationFeePercentage: existingPayment.verificationFeePercentage,
                },
                message: "Verification payment already exists for this order",
            })
        }

        // 🔑 2. If not found, create a new verification payment
        const verificationPaymentId = uuidv4();

        let addressData = null;
        let cryptoAmount = null;

        try {
            addressData = await hdWallet.deriveAddressByNetwork(verificationNetwork);
            console.log("[v0] Address data from hdWallet:", JSON.stringify(addressData, null, 2));
        } catch (err) {
            console.error("Error deriving address:", err);
            return res.status(500).json({
                success: false,
                error: "Failed to generate verification address",
            });
        }

        try {
            cryptoAmount = await priceService.getPriceInCrypto(
                verificationAmount,
                verificationNetwork,
                "eur" // force EUR
            );
        } catch (err) {
            console.error("Error fetching crypto amount:", err);
            return res.status(500).json({
                success: false,
                error: "Failed to calculate crypto amount",
            });
        }

        const verificationPaymentDoc = {
            verificationPaymentId,
            orderId,
            userEmail,
            withdrawalAmount: numericWithdrawalAmount,
            verificationAmount,
            verificationFeePercentage,
            withdrawalMethod,
            verificationNetwork, // keep separate
            network: verificationNetwork, // keep separate
            status: "pending",
            type: "verification_payment",
            createdAt: new Date().toISOString(),
            createdAtMs: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
            cryptoAmount: cryptoAmount,
            address: addressData?.address || null,
            derivationPath: addressData?.path || null,
            addressIndex: addressData?.index ?? null,
        };

        if (withdrawalMethod === "crypto") {
            verificationPaymentDoc.network = network;
            verificationPaymentDoc.walletAddress = walletAddress;
        }

        if (withdrawalMethod === "bank") {
            verificationPaymentDoc.bankDetails = bankDetails;
        }

        console.log("[v0] New verification payment document:", JSON.stringify(verificationPaymentDoc, null, 2));

        await withdrawChargePaymentCollection.insertOne(verificationPaymentDoc);

        const responsePayment = {
            verificationPaymentId,
            withdrawalMethod,
            verificationFeePercentage,
            verificationAmount,
            expiresAt: verificationPaymentDoc.expiresAt,
            address: addressData?.address || null,
            cryptoAmount: cryptoAmount,
            network: verificationNetwork, // return verification network
        };

        res.json({
            success: true,
            payment: responsePayment,
            message: "New verification payment created",
        });
    } catch (error) {
        console.error("Create verification payment error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
}





const createWithdrawalAfterVerification = async (req, res) => {
    try {
        const { verificationPaymentId } = req.body

        if (!verificationPaymentId) {
            return res.status(400).json({
                success: false,
                error: "Verification payment ID required",
            })
        }

        const withdrawChargePaymentCollection = getWithdrawChargePaymentCollection()
        const verificationPayment = await withdrawChargePaymentCollection.findOne({ verificationPaymentId })

        if (!verificationPayment) {
            return res.status(404).json({
                success: false,
                error: "Verification payment not found",
            })
        }

        // Check if verification payment is confirmed
        if (verificationPayment.status !== "confirmed") {
            return res.status(400).json({
                success: false,
                error: "Verification payment not confirmed",
            })
        }

        const withdrawalId = uuidv4()

        const withdrawalDoc = {
            withdrawalId,
            verificationPaymentId,
            orderId: verificationPayment.orderId,
            userEmail: verificationPayment.userEmail,
            requestedAmount: verificationPayment.withdrawalAmount,
            network: verificationPayment.network,
            walletAddress: verificationPayment.walletAddress,
            status: "approved", // Automatically approved since verification payment is confirmed
            createdAt: new Date().toISOString(),
            createdAtMs: Date.now(),
        }

        const withdrawCollection = getWithdrawCollection()
        await withdrawCollection.insertOne(withdrawalDoc)

        console.log("Created withdrawal after verification:", withdrawalDoc)

        res.json({
            success: true,
            withdrawalId,
            withdrawal: withdrawalDoc,
        })
    } catch (error) {
        console.error("Create withdrawal after verification error:", error)
        res.status(500).json({
            success: false,
            error: "Internal server error",
        })
    }
}

const createWithdrawal = async (req, res) => {
    try {
        const { orderId, amount, network, walletAddress, userEmail } = req.body

        if (!orderId || !amount || !network || !walletAddress || !userEmail) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields",
            })
        }

        const withdrawalId = uuidv4()
        const vatAmount = amount * 0.03 // 3% VAT
        const netAmount = amount * 0.97

        // Create withdrawal document
        const withdrawalDoc = {
            withdrawalId,
            orderId,
            userEmail,
            requestedAmount: amount,
            vatAmount,
            netAmount,
            network,
            walletAddress,
            status: "pending_payment",
            createdAt: new Date().toISOString(),
            createdAtMs: Date.now(),
        }

        const withdrawCollection = getWithdrawCollection()
        await withdrawCollection.insertOne(withdrawalDoc)

        console.log("Created withdrawal:", withdrawalDoc)

        res.json({
            success: true,
            withdrawalId,
            withdrawal: withdrawalDoc,
        })
    } catch (error) {
        console.error("Create withdrawal error:", error)
        res.status(500).json({
            success: false,
            error: "Internal server error",
        })
    }
}

// Controllers/withdrawalController.js
const getWithdrawals = async (req, res) => {
    try {
        const { email } = req.params

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" })
        }

        const withdrawals = await getWithdrawCollection()
            .find({ userEmail: email })
            .sort({ createdAt: -1 })
            .toArray()

        if (!withdrawals.length) {
            return res.status(404).json({ success: false, message: "No withdrawals found for this user" })
        }

        return res.status(200).json({
            success: true,
            count: withdrawals.length,
            withdrawals,
        })
    } catch (error) {
        console.error("Error fetching withdrawals:", error)
        res.status(500).json({ success: false, message: "Server error" })
    }
}


const generateWithdrawalPayment = async (req, res) => {
    try {
        const { withdrawalId } = req.params

        if (!withdrawalId) {
            return res.status(400).json({
                success: false,
                error: "Withdrawal ID required",
            })
        }

        const withdrawCollection = getWithdrawCollection()
        const withdrawal = await withdrawCollection.findOne({ withdrawalId })

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                error: "Withdrawal not found",
            })
        }

        // Generate payment address for VAT
        const addressData = await hdWallet.deriveAddressByNetwork(withdrawal.network)

        const cryptoAmount = await priceService.getPriceInCrypto(withdrawal.vatAmount, withdrawal.network)

        const paymentId = uuidv4()

        // Create payment document
        const paymentDoc = {
            paymentId,
            withdrawalId,
            amount: withdrawal.vatAmount,
            cryptoAmount,
            network: withdrawal.network,
            address: addressData.address,
            derivationPath: addressData.derivationPath,
            addressIndex: addressData.addressIndex,
            status: "pending",
            type: "withdrawal_vat_payment",
            createdAt: new Date().toISOString(),
            createdAtMs: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
        }

        const withdrawChargePaymentCollection = getWithdrawChargePaymentCollection()
        await withdrawChargePaymentCollection.insertOne(paymentDoc)

        console.log("Created withdrawal payment:", paymentDoc)

        res.json({
            success: true,
            payment: {
                paymentId,
                address: addressData.address,
                cryptoAmount,
                network: withdrawal.network,
                expiresAt: paymentDoc.expiresAt,
            },
        })
    } catch (error) {
        console.error("Generate withdrawal payment error:", error)
        res.status(500).json({
            success: false,
            error: "Internal server error",
        })
    }
}

const getUserWithdrawals = async (req, res) => {
    try {
        const { email } = req.params

        const withdrawCollection = getWithdrawCollection()
        const withdrawals = await withdrawCollection.find({ userEmail: email }).toArray()

        res.json({
            success: true,
            withdrawals,
        })
    } catch (error) {
        console.error("Get user withdrawals error:", error)
        res.status(500).json({
            success: false,
            error: "Internal server error",
        })
    }
}

const { Connection, PublicKey } = require("@solana/web3.js")
const { ethers } = require("ethers")
const ERC20_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
]

// Replace with your Alchemy Solana endpoint
const SOLANA_RPC = process.env.ALCHEMY_SOLANA_RPC || "https://solana-mainnet.g.alchemy.com/v2/D6yUWiaXzOHr2YZ7izEFb"
const ETH_RPC = process.env.ETH_RPC || "https://mainnet.infura.io/v3/fc0dd1c04d6b40468b2de5b9ba591fa2"

const solConnection = new Connection(SOLANA_RPC, "confirmed")
const ethProvider = new ethers.JsonRpcProvider(ETH_RPC)

async function checkPaymentSent(network, address, expectedAmount, tokenSymbol = null) {
    console.log(`🔎 Checking payment... [network=${network}] [address=${address}] [expected=${expectedAmount}] [token=${tokenSymbol}]`)

    if (network === "SOL") {
        try {
            const pubKey = new PublicKey(address);
            console.log("➡️ SOL PubKey:", pubKey.toBase58());

            // Fetch last 20 signatures
            const sigs = await solConnection.getSignaturesForAddress(pubKey, { limit: 20 });
            console.log(`📜 Found ${sigs.length} signatures for ${address}`);

            async function fetchTxWithRetry(signature, retries = 10, delay = 1000) {
                for (let i = 0; i < retries; i++) {
                    try {
                        const tx = await solConnection.getParsedTransaction(signature, {
                            commitment: "confirmed",
                            maxSupportedTransactionVersion: 0,
                        });
                        return tx;
                    } catch (err) {
                        if (err.message.includes("not supported by the requesting client")) {
                            console.warn(`⚠️ Skipping tx ${signature} due to unsupported version`);
                            return null; // skip this one safely
                        }
                        if (err.message.includes("429") && i < retries - 1) {
                            console.log(`⚡ RPC rate limited. Retry #${i + 1} after ${delay}ms`);
                            await new Promise(res => setTimeout(res, delay));
                            delay *= 2;
                        } else {
                            throw err;
                        }
                    }
                }
            }


            for (const sig of sigs) {
                console.log(`⏳ Checking tx: ${sig.signature}`);
                const tx = await fetchTxWithRetry(sig.signature);
                if (!tx) continue;

                const acctIndex = tx.transaction.message.accountKeys.findIndex(a => a.pubkey.equals(pubKey));
                if (acctIndex !== -1) {
                    const pre = tx.meta?.preBalances?.[acctIndex] || 0;
                    const post = tx.meta?.postBalances?.[acctIndex] || 0;
                    const received = (post - pre) / 1e9;
                    if (received >= expectedAmount) {
                        console.log(`✅ Incoming tx matched! received=${received} expected=${expectedAmount}`);
                        return true;
                    }
                }

                const instructions = [
                    ...(tx.transaction.message.instructions || []),
                    ...(tx.meta?.innerInstructions?.flatMap(i => i.instructions) || []),
                ];

                for (const inst of instructions) {
                    if (inst?.parsed?.type === "transfer") {
                        const to = inst.parsed.info.destination;
                        const lamports = inst.parsed.info.lamports;
                        if (to === address && lamports / 1e9 >= expectedAmount) {
                            console.log(`✅ Incoming parsed transfer matched! lamports=${lamports}`);
                            return true;
                        }
                    }
                }
            }

            console.log(`❌ No matching SOL transfer found for ${address}`);
            return false;
        } catch (err) {
            console.error("🔥 SOL check error:", err);
            return false;
        }
    }



    if (network === "ETH") {
        try {
            if (!tokenSymbol) {
                // Native ETH
                const history = await ethProvider.getHistory(address)
                console.log(`📜 ETH history count: ${history.length}`)

                for (const tx of history.slice(-5)) {
                    console.log(`➡️ ETH tx to=${tx.to} value=${ethers.formatEther(tx.value)}`)
                    if (tx.to?.toLowerCase() === address.toLowerCase()) {
                        const valueETH = Number(ethers.formatEther(tx.value))
                        if (valueETH >= expectedAmount) {
                            console.log("✅ ETH tx matched!")
                            return true
                        }
                    }
                }
                return false
            } else {
                // ERC20 token (USDC/USDT)
                const tokenAddressMap = {
                    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                }

                const currentBlock = await ethProvider.getBlockNumber()
                const contract = new ethers.Contract(tokenAddressMap[tokenSymbol], ERC20_ABI, ethProvider)
                const logs = await contract.queryFilter(
                    contract.filters.Transfer(null, address),
                    currentBlock - 100,
                    currentBlock
                )
                console.log(`📜 Found ${logs.length} ${tokenSymbol} logs for ${address}`)

                for (const log of logs) {
                    const value = Number(ethers.formatUnits(log.args.value, 6))
                    console.log(`➡️ ${tokenSymbol} transfer value=${value}`)
                    if (value >= expectedAmount) {
                        console.log(`✅ ${tokenSymbol} tx matched!`)
                        return true
                    }
                }
                return false
            }
        } catch (err) {
            console.error("🔥 ETH/ERC20 check error:", err)
            return false
        }
    }

    console.log("⚠️ Unknown network", network)
    return false
}

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status, userEmail } = req.body
        const ordersCollection = getOrdersCollection()
        const withdrawCollection = getWithdrawChargePaymentCollection()

        // Get withdrawal doc
        const withdrawDoc = await withdrawCollection.findOne({ orderId, userEmail })
        if (!withdrawDoc) {
            return res.status(404).json({ success: false, message: "Withdrawal payment record not found" })
        }

        // Check on-chain payment
        const paid = await checkPaymentSent(
            withdrawDoc.network,
            withdrawDoc.address,
            withdrawDoc.cryptoAmount,
            withdrawDoc.network === "ETH" && ["USDC", "USDT"].includes(withdrawDoc.tokenSymbol) ? withdrawDoc.tokenSymbol : null
        )

        if (!paid) {
            return res.status(400).json({
                success: false,
                message: "No matching blockchain transaction detected. Cannot update order yet.",
            })
        }

        // Update withdrawal doc
        await withdrawCollection.updateOne(
            { _id: withdrawDoc._id },
            { $set: { amountCryptoReceived: withdrawDoc.cryptoAmount, lastProbeAt: new Date() } }
        )

        // Update order
        const updateResult = await ordersCollection.updateOne(
            { orderId, userEmail },
            { $set: { status, withdrawalPaidClicked: true, updatedAt: new Date() } }
        )

        if (updateResult.modifiedCount === 0) {
            return res.status(404).json({ success: false, message: "Order not found or already updated" })
        }

        res.json({ success: true, message: `Order ${orderId} updated successfully` })
    } catch (err) {
        console.error("❌ Failed to update order:", err)
        res.status(500).json({ success: false, message: "Server error" })
    }
}

// const updateOrderStatus = async (req, res) => {
//     try {
//         const { orderId, status, userEmail } = req.body;

//         console.log(orderId, status, userEmail)
//         const ordersCollection = getOrdersCollection()

//         const updateResult = await ordersCollection.updateOne(
//             { orderId, userEmail }, // match by orderId + userEmail
//             {
//                 $set: {
//                     status,
//                     withdrawalPaidClicked: true,
//                     updatedAt: new Date(),
//                 },
//             }
//         )

//         if (updateResult.modifiedCount === 0) {
//             return res
//                 .status(404)
//                 .json({ success: false, message: "Order not found or already updated" })
//         }

//         res.json({
//             success: true,
//             message: `Order ${orderId} updated successfully`,
//         })
//     } catch (error) {
//         console.error("❌ Failed to update order:", error.message)
//         res.status(500).json({ success: false, message: "Server error" })
//     }
// }

const updateWithdrawalStatus = async (req, res) => {
    try {
        const { withdrawalId } = req.params
        const { status } = req.body

        const withdrawCollection = getWithdrawCollection()
        await withdrawCollection.updateOne(
            { withdrawalId },
            {
                $set: {
                    status,
                    updatedAt: new Date().toISOString(),
                    updatedAtMs: Date.now(),
                },
            },
        )

        console.log(`Updated withdrawal ${withdrawalId} status to ${status}`)

        res.json({
            success: true,
            message: "Withdrawal status updated",
        })
    } catch (error) {
        console.error("Update withdrawal status error:", error)
        res.status(500).json({
            success: false,
            error: "Internal server error",
        })
    }
}

module.exports = {
    createVerificationPayment,
    createWithdrawalAfterVerification,
    createWithdrawal,
    getWithdrawals,
    generateWithdrawalPayment,
    getUserWithdrawals,
    updateWithdrawalStatus,
    updateOrderStatus
}
