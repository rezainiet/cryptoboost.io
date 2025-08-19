require("dotenv").config()

// Check if MNEMONIC is set before importing hdWallet
if (!process.env.MNEMONIC) {
    console.error("❌ Error: MNEMONIC environment variable is not set")
    console.log("Please add your mnemonic phrase to your .env file:")
    console.log("MNEMONIC=your twelve or twenty four word mnemonic phrase here")
    process.exit(1)
}

const bip39 = require("bip39")
if (!bip39.validateMnemonic(process.env.MNEMONIC.trim())) {
    console.error("❌ Error: Invalid MNEMONIC in .env file")
    console.log("Please ensure your MNEMONIC is a valid 12 or 24 word phrase")
    process.exit(1)
}

// Now safely import hdWallet after validation
const { getPrivateKeyForSOLAddress, deriveSOLAddress } = require("../services/hdWallet.js")
const { Keypair } = require("@solana/web3.js")

console.log("Testing private key generation for address: EiayTJLkB4raFZ75aU9kFfogHi6cPDCFRF2qkm1fnd9J")

try {
    // Get the private key for the target address
    const result = getPrivateKeyForSOLAddress("EiayTJLkB4raFZ75aU9kFfogHi6cPDCFRF2qkm1fnd9J")

    console.log("Found match!")
    console.log("Index:", result.index)
    console.log("Address:", result.address)
    console.log("Private Key (hex):", result.privateKey)

    // Verify the private key works by recreating the keypair
    const privateKeyBytes = Buffer.from(result.privateKey, "hex")
    console.log("Private key length:", privateKeyBytes.length, "bytes")

    // Create keypair from the private key
    const keypair = Keypair.fromSecretKey(privateKeyBytes)
    console.log("Recreated address:", keypair.publicKey.toString())
    console.log("Addresses match:", keypair.publicKey.toString() === result.address)

    // Also test direct derivation at the found index
    console.log("\nTesting direct derivation at index", result.index)
    const directResult = deriveSOLAddress(result.index)
    console.log("Direct derivation address:", directResult.address)
    console.log("Direct addresses match:", directResult.address === result.address)
} catch (error) {
    console.error("Error:", error.message)

    // Let's test a few indices manually to see what addresses we get
    console.log("\nTesting first few indices:")
    for (let i = 0; i < 5; i++) {
        const { address } = deriveSOLAddress(i)
        console.log(`Index ${i}: ${address}`)
    }
}
