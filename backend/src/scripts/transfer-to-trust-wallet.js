const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = require("@solana/web3.js")
const bip39 = require("bip39")
const { derivePath } = require("ed25519-hd-key")
const nacl = require("tweetnacl")
require("dotenv").config()

// Validate MNEMONIC
if (!process.env.MNEMONIC) {
    console.error("❌ Error: MNEMONIC not found in .env file")
    console.log("Please add your mnemonic phrase to .env file:")
    console.log("MNEMONIC=your twelve or twenty four word phrase here")
    process.exit(1)
}

const MNEMONIC = process.env.MNEMONIC

// Validate mnemonic
if (!bip39.validateMnemonic(MNEMONIC)) {
    console.error("❌ Error: Invalid MNEMONIC in .env file")
    console.log("Please ensure your mnemonic phrase is valid (12 or 24 words)")
    process.exit(1)
}

// Solana connection
const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed")

// Method 4: Direct seed with index 0 (source address with funds)
function getMethod4Address() {
    const seed = bip39.mnemonicToSeedSync(MNEMONIC)
    const derivedSeed = nacl.sign.keyPair.fromSeed(seed.slice(0, nacl.sign.seedLength)).secretKey
    const keypair = Keypair.fromSecretKey(derivedSeed)

    return {
        address: keypair.publicKey.toString(),
        keypair: keypair,
        privateKey: Buffer.from(keypair.secretKey).toString("hex"),
    }
}

// Method 3: Alternative derivation m/44'/501'/0' (Trust Wallet main)
function getMethod3Address() {
    const seed = bip39.mnemonicToSeedSync(MNEMONIC)
    const path = `m/44'/501'/0'`
    const derivedSeed = derivePath(path, seed.toString("hex")).key
    const keypair = Keypair.fromSeed(derivedSeed)

    return {
        address: keypair.publicKey.toString(),
        keypair: keypair,
        path: path,
    }
}

async function transferToTrustWallet() {
    try {
        console.log("🔄 Preparing transfer to Trust Wallet...\n")

        // Get source and destination addresses
        const sourceWallet = getMethod4Address()
        const destWallet = getMethod3Address()

        console.log(`📤 From (Method 4): ${sourceWallet.address}`)
        console.log(`📥 To (Trust Wallet): ${destWallet.address}\n`)

        // Check source balance
        const sourceBalance = await connection.getBalance(new PublicKey(sourceWallet.address))
        const sourceBalanceSOL = sourceBalance / LAMPORTS_PER_SOL

        console.log(`💰 Source balance: ${sourceBalanceSOL} SOL`)

        if (sourceBalance === 0) {
            console.log("❌ No SOL balance to transfer")
            return
        }

        // Get recent blockhash and fee
        const { blockhash } = await connection.getLatestBlockhash()

        // Create transfer transaction
        const transaction = new Transaction({
            feePayer: sourceWallet.keypair.publicKey,
            recentBlockhash: blockhash,
        })

        // Calculate transfer amount (leave some for transaction fee)
        const estimatedFee = 5000 // 0.000005 SOL (typical fee)
        const transferAmount = sourceBalance - estimatedFee

        if (transferAmount <= 0) {
            console.log("❌ Insufficient balance to cover transaction fee")
            return
        }

        const transferAmountSOL = transferAmount / LAMPORTS_PER_SOL
        console.log(`📊 Transfer amount: ${transferAmountSOL} SOL (after fee)`)

        // Add transfer instruction
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: sourceWallet.keypair.publicKey,
                toPubkey: new PublicKey(destWallet.address),
                lamports: transferAmount,
            }),
        )

        // Sign and send transaction
        console.log("\n🔐 Signing transaction...")
        transaction.sign(sourceWallet.keypair)

        console.log("📡 Sending transaction...")
        const signature = await connection.sendTransaction(transaction, [sourceWallet.keypair])

        console.log(`✅ Transaction sent!`)
        console.log(`🔗 Transaction signature: ${signature}`)
        console.log(`🌐 View on Solscan: https://solscan.io/tx/${signature}`)

        // Wait for confirmation
        console.log("\n⏳ Waiting for confirmation...")
        const confirmation = await connection.confirmTransaction(signature)

        if (confirmation.value.err) {
            console.log("❌ Transaction failed:", confirmation.value.err)
        } else {
            console.log("🎉 Transaction confirmed successfully!")

            // Check final balances
            const finalSourceBalance = await connection.getBalance(new PublicKey(sourceWallet.address))
            const finalDestBalance = await connection.getBalance(new PublicKey(destWallet.address))

            console.log(`\n📊 Final balances:`)
            console.log(`Source: ${finalSourceBalance / LAMPORTS_PER_SOL} SOL`)
            console.log(`Trust Wallet: ${finalDestBalance / LAMPORTS_PER_SOL} SOL`)
        }
    } catch (error) {
        console.error("❌ Transfer failed:", error.message)
        if (error.logs) {
            console.error("Transaction logs:", error.logs)
        }
    }
}

// Run the transfer
transferToTrustWallet()
