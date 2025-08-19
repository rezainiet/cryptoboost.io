import dotenv from "dotenv"
import * as bip39 from "bip39"
import nacl from "tweetnacl"
import { Keypair } from "@solana/web3.js"

dotenv.config()

const MNEMONIC = process.env.MNEMONIC

if (!MNEMONIC || !bip39.validateMnemonic(MNEMONIC)) {
    console.error("❌ Error: Invalid or missing MNEMONIC in .env file")
    console.log("Please add your mnemonic phrase to .env file:")
    console.log("MNEMONIC=your twelve or twenty four word phrase here")
    process.exit(1)
}

function deriveOriginalSOLAddress() {
    const seed = bip39.mnemonicToSeedSync(MNEMONIC)
    const derivedSeed = nacl.sign.keyPair.fromSeed(seed.slice(0, nacl.sign.seedLength)).secretKey

    const keypair = Keypair.fromSecretKey(derivedSeed)

    return {
        address: keypair.publicKey.toString(),
        privateKey: Buffer.from(keypair.secretKey).toString("hex"),
        keypair: keypair,
    }
}

console.log("🔍 Recovering original address using the broken derivation method...\n")

const result = deriveOriginalSOLAddress()

console.log("✅ Original Address Found:")
console.log("Address:", result.address)
console.log("Private Key:", result.privateKey)
console.log("Private Key Length:", result.privateKey.length, "characters")

console.log("Trust Wallet Format (64 chars):", result.privateKey.substring(0, 64))

const targetAddress = "EiayTJLkB4raFZ75aU9kFfogHi6cPDCFRF2qkm1fnd9J"
if (result.address === targetAddress) {
    console.log("\n🎉 SUCCESS! This matches your target address!")
    console.log("You can use this private key to recover your funds.")
    console.log("\n📱 For Trust Wallet, use the 64-character version above")
} else {
    console.log("\n❌ Address mismatch:")
    console.log("Expected:", targetAddress)
    console.log("Got:     ", result.address)
}

console.log("\n🔧 Keypair verification:")
console.log("Public Key:", result.keypair.publicKey.toString())
console.log("Secret Key Length:", result.keypair.secretKey.length, "bytes")
