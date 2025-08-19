import dotenv from "dotenv"
import * as bip39 from "bip39"
import { derivePath } from "ed25519-hd-key"
import { Keypair } from "@solana/web3.js"
import nacl from "tweetnacl"

dotenv.config()

const MNEMONIC = process.env.MNEMONIC
const TARGET_ADDRESS = "qiJdne6CUK8WZQqcjCghdrfuugzwsEGzNjXpFkmMxwK"

if (!MNEMONIC || !bip39.validateMnemonic(MNEMONIC)) {
    console.error("❌ Invalid or missing MNEMONIC in .env file")
    process.exit(1)
}

console.log(`🔍 Searching for derivation method that generates: ${TARGET_ADDRESS}`)

// Method 1: Original broken method (same for all indices)
function originalMethod() {
    const seed = bip39.mnemonicToSeedSync(MNEMONIC)
    const derivedSeed = nacl.sign.keyPair.fromSeed(seed.slice(0, nacl.sign.seedLength)).secretKey
    const keypair = Keypair.fromSecretKey(derivedSeed)
    return {
        address: keypair.publicKey.toString(),
        privateKey: Buffer.from(keypair.secretKey).toString("hex"),
        method: "Original (broken)",
    }
}

// Method 2: Standard Solana derivation
function standardDerivation(index) {
    const seed = bip39.mnemonicToSeedSync(MNEMONIC)
    const path = `m/44'/501'/${index}'/0'`
    const derivedSeed = derivePath(path, seed.toString("hex")).key
    const keypair = Keypair.fromSeed(derivedSeed)
    return {
        address: keypair.publicKey.toString(),
        privateKey: Buffer.from(keypair.secretKey).toString("hex"),
        method: `Standard derivation (${path})`,
    }
}

// Method 3: Alternative derivation
function alternativeDerivation(index) {
    const seed = bip39.mnemonicToSeedSync(MNEMONIC)
    const path = `m/44'/501'/${index}'`
    const derivedSeed = derivePath(path, seed.toString("hex")).key
    const keypair = Keypair.fromSeed(derivedSeed)
    return {
        address: keypair.publicKey.toString(),
        privateKey: Buffer.from(keypair.secretKey).toString("hex"),
        method: `Alternative derivation (${path})`,
    }
}

// Method 4: Direct seed with index
function directSeedMethod(index) {
    const seed = bip39.mnemonicToSeedSync(MNEMONIC)
    // Add index to seed
    const indexBuffer = Buffer.alloc(4)
    indexBuffer.writeUInt32BE(index, 0)
    const combinedSeed = Buffer.concat([seed.slice(0, 28), indexBuffer])
    const keypair = Keypair.fromSeed(combinedSeed.slice(0, 32))
    return {
        address: keypair.publicKey.toString(),
        privateKey: Buffer.from(keypair.secretKey).toString("hex"),
        method: `Direct seed with index ${index}`,
    }
}

// Test all methods
console.log("\n🧪 Testing different derivation methods...\n")

// Test original method
const original = originalMethod()
console.log(`Method 1 - ${original.method}:`)
console.log(`Address: ${original.address}`)
if (original.address === TARGET_ADDRESS) {
    console.log("🎉 MATCH FOUND!")
    console.log(`Private Key: ${original.privateKey}`)
    console.log(`Trust Wallet Key: ${original.privateKey.slice(0, 64)}`)
    process.exit(0)
}

// Test standard derivation for indices 0-10
for (let i = 0; i <= 10; i++) {
    const standard = standardDerivation(i)
    console.log(`Method 2 - ${standard.method}:`)
    console.log(`Address: ${standard.address}`)
    if (standard.address === TARGET_ADDRESS) {
        console.log("🎉 MATCH FOUND!")
        console.log(`Private Key: ${standard.privateKey}`)
        console.log(`Trust Wallet Key: ${standard.privateKey.slice(0, 64)}`)
        process.exit(0)
    }

    const alternative = alternativeDerivation(i)
    console.log(`Method 3 - ${alternative.method}:`)
    console.log(`Address m3: ${alternative.address}`)
    if (alternative.address === TARGET_ADDRESS) {
        console.log("🎉 MATCH FOUND!")
        console.log(`Private Key alter: ${alternative.privateKey}`)
        console.log(`Trust Wallet Key: ${alternative.privateKey.slice(0, 64)}`)
        process.exit(0)
    }

    const direct = directSeedMethod(i)
    console.log(`Method 4 - ${direct.method}:`)
    console.log(`Address: ${direct.address}`)
    if (direct.address === TARGET_ADDRESS) {
        console.log("🎉 MATCH FOUND!")
        console.log(`Private Key: ${direct.privateKey}`)
        console.log(`Trust Wallet Key: ${direct.privateKey.slice(0, 64)}`)
        process.exit(0)
    }

    console.log("---")
}

console.log("❌ No matching derivation method found for the target address.")
console.log("The address might have been generated using different parameters or a different mnemonic.")
