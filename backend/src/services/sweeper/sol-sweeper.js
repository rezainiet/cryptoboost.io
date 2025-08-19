// services/sweeper/sol-sweeper.js
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
        const toWallet = deriveAddressByNetwork("SOL", 0)
        const connection = new Connection(SOLANA_RPC, "confirmed")
        const fromKeypair = Keypair.fromSecretKey(Buffer.from(fromWallet.privateKey, "hex"))

        // Check balance
        const balance = await connection.getBalance(fromKeypair.publicKey)
        if (balance <= 0) {
            console.log(`No SOL balance at index ${index}`)
            return null
        }

        const amountToSend = balance - GAS_CONFIG.SOL.FEE_RESERVE
        if (amountToSend <= 0) {
            console.log(`Insufficient SOL (${balance / 1e9}) for gas at index ${index}`)
            return null
        }

        // Create transaction
        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: new PublicKey(toWallet.address),
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
