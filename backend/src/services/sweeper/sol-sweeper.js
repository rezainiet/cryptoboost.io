const {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    PublicKey,
} = require("@solana/web3.js")
const { deriveAddressByNetwork } = require("../hdWallet")
const { SOLANA_RPC, GAS_CONFIG } = require("./config")

async function sweepSOL(index) {
    try {
        if (index === 0) return null

        const fromWallet = deriveAddressByNetwork("SOL", index)
        const toWallet = deriveAddressByNetwork("SOL", 0) // Main wallet at index 0

        console.log(`[${index}] From wallet address: ${fromWallet.address}`)
        console.log(`[${index}] To wallet address: ${toWallet.address}`)

        const fromPrivateKeyBuffer = Buffer.from(fromWallet.privateKey, "hex")
        const toPrivateKeyBuffer = Buffer.from(toWallet.privateKey, "hex")

        // Take only first 32 bytes for Solana keypair
        const fromKeypair = Keypair.fromSeed(fromPrivateKeyBuffer.slice(0, 32))
        const toKeypair = Keypair.fromSeed(toPrivateKeyBuffer.slice(0, 32))

        console.log(`[${index}] From keypair pubkey: ${fromKeypair.publicKey.toString()}`)
        console.log(`[${index}] To keypair pubkey: ${toKeypair.publicKey.toString()}`)

        const connection = new Connection(SOLANA_RPC, "confirmed")

        // Check balance using the derived keypair
        const balance = await connection.getBalance(fromKeypair.publicKey)
        const toBalance = await connection.getBalance(toKeypair.publicKey)

        console.log(`[${index}] From account balance: ${balance / 1e9} SOL`)
        console.log(`[${index}] To account balance: ${toBalance / 1e9} SOL`)

        if (balance <= 0) {
            console.log(`No SOL balance at index ${index}`)
            return null
        }

        const amountToSend = balance - GAS_CONFIG.SOL.FEE_RESERVE
        if (amountToSend <= 0) {
            console.log(`Insufficient SOL (${balance / 1e9}) for gas at index ${index}`)
            return null
        }

        console.log(
            `[${index}] Sending ${amountToSend / 1e9} SOL from ${fromKeypair.publicKey.toString()} to ${toKeypair.publicKey.toString()}`,
        )

        // Create transaction
        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: toKeypair.publicKey,
                lamports: amountToSend,
            }),
        )

        // Send and confirm with timeout
        const txHash = await sendAndConfirmTransaction(connection, tx, [fromKeypair], {
            commitment: "confirmed",
            preflightCommitment: "confirmed",
            skipPreflight: false,
        })

        // Verify transaction
        const status = await connection.getSignatureStatus(txHash)
        if (!status.value || status.value.confirmationStatus !== "confirmed") {
            throw new Error("Transaction not confirmed")
        }

        console.log(`✅ SOL swept ${amountToSend / 1e9}. TX: ${txHash}`)
        return txHash
    } catch (err) {
        console.error(`❌ SOL sweep failed for index ${index}:`, err.message)
        return null
    }
}

module.exports = {
    sweepSOL,
}
