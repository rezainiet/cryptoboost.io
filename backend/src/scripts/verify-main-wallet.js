import dotenv from "dotenv"
import bip39 from "bip39"
import nacl from "tweetnacl"
import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { derivePath } from "ed25519-hd-key"

dotenv.config()

const MNEMONIC = process.env.MNEMONIC
const connection = new Connection("https://api.mainnet-beta.solana.com")

if (!MNEMONIC || !bip39.validateMnemonic(MNEMONIC)) {
    console.error("❌ Invalid or missing MNEMONIC in .env file")
    process.exit(1)
}

async function verifyMainWallet() {
    console.log("🔍 Verifying your main wallet addresses...\n")

    // Method 1: Original broken derivation (always same address)
    console.log("📍 Method 1: Original derivation (broken - same for all indices)")
    const seed1 = bip39.mnemonicToSeedSync(MNEMONIC)
    const derivedSeed1 = nacl.sign.keyPair.fromSeed(seed1.slice(0, nacl.sign.seedLength)).secretKey
    const keypair1 = Keypair.fromSecretKey(derivedSeed1)
    const originalAddress = keypair1.publicKey.toString()

    // Method 2: Fixed derivation at index 0
    console.log("📍 Method 2: Fixed derivation at index 0")
    const seed2 = bip39.mnemonicToSeedSync(MNEMONIC)
    const derivedSeed2 = derivePath("m/44'/501'/0'/0'", seed2.toString("hex")).key
    const keypair2 = Keypair.fromSeed(derivedSeed2)
    const fixedAddress = keypair2.publicKey.toString()

    console.log(`Original Address: ${originalAddress}`)
    console.log(`Fixed Index 0:    ${fixedAddress}`)
    console.log(`Target Address:   qiJdne6CUK8WZQqcjCghdrfuugzwsEGzNjXpFkmMxwK\n`)

    // Check which method generates the target address
    if (originalAddress === "qiJdne6CUK8WZQqcjCghdrfuugzwsEGzNjXpFkmMxwK") {
        console.log("✅ Target address matches ORIGINAL derivation method")
    } else if (fixedAddress === "qiJdne6CUK8WZQqcjCghdrfuugzwsEGzNjXpFkmMxwK") {
        console.log("✅ Target address matches FIXED derivation method (index 0)")
    } else {
        console.log("❌ Target address does not match either method")
    }

    // Check balances
    console.log("\n💰 Checking balances...")

    try {
        const balance1 = await connection.getBalance(keypair1.publicKey)
        const balance2 = await connection.getBalance(keypair2.publicKey)

        console.log(`Original Address Balance: ${balance1 / LAMPORTS_PER_SOL} SOL`)
        console.log(`Fixed Index 0 Balance:    ${balance2 / LAMPORTS_PER_SOL} SOL`)

        // Check the target address specifically
        const targetKeypair = new Keypair() // We'll check by address string
        try {
            const targetBalance = await connection.getBalance(
                new Keypair().publicKey.constructor.decode("qiJdne6CUK8WZQqcjCghdrfuugzwsEGzNjXpFkmMxwK"),
            )
            console.log(`Target Address Balance:   ${targetBalance / LAMPORTS_PER_SOL} SOL`)
        } catch (e) {
            // Alternative method to check balance by address string
            const { PublicKey } = await import("@solana/web3.js")
            const targetPubkey = new PublicKey("qiJdne6CUK8WZQqcjCghdrfuugzwsEGzNjXpFkmMxwK")
            const targetBalance = await connection.getBalance(targetPubkey)
            console.log(`Target Address Balance:   ${targetBalance / LAMPORTS_PER_SOL} SOL`)
        }
    } catch (error) {
        console.error("Error checking balances:", error.message)
    }

    // Provide recovery instructions
    console.log("\n🔧 Recovery Instructions:")
    console.log("If your funds are at the target address, you can recover them using:")
    console.log("1. The private key from whichever method matches the target address")
    console.log("2. Import that private key into your wallet")
    console.log("3. The funds should then be accessible")
}

verifyMainWallet().catch(console.error)
