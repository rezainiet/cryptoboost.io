const {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
} = require("@solana/web3.js")
const { deriveAddressByNetwork } = require("../hdWallet")
const { SOLANA_RPC, GAS_CONFIG } = require("./config")

async function sweepSOL(index) {
    try {
        if (index === 0) return null

        const fromWallet = await deriveAddressByNetwork("SOL", index)
        const toWallet = await deriveAddressByNetwork("SOL", 0) // Main wallet at index 0

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

        console.log(`[${index}] From account balance: ${balance / 1e9} SOL`)

        if (balance <= 0) {
            console.log(`No SOL balance at index ${index}`)
            return null
        }

        // Get sweep percentage from env (default: 95%)
        const sweepPercent = BigInt(process.env.SWEEP_PERCENT || 95)

        // Convert balance to BigInt lamports
        const balanceLamports = BigInt(balance)

        // Calculate sweep amount
        let amountToSend = (balanceLamports * sweepPercent) / 100n

        // Reserve gas fee
        if (amountToSend > BigInt(GAS_CONFIG.SOL.FEE_RESERVE)) {
            amountToSend = amountToSend - BigInt(GAS_CONFIG.SOL.FEE_RESERVE)
        }

        if (amountToSend <= 0n) {
            console.log(`Insufficient SOL (${balance / 1e9}) for gas at index ${index}`)
            return null
        }

        console.log(`[${index}] Sweep Percent: ${sweepPercent}%`)
        console.log(`[${index}] Sweep Amount: ${Number(amountToSend) / 1e9} SOL`)
        console.log(`[${index}] Remaining Balance: ${(Number(balanceLamports - amountToSend)) / 1e9} SOL`)

        // Create transaction
        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: toKeypair.publicKey,
                lamports: Number(amountToSend), // still needs Number
            }),
        )

        // Send and confirm with stronger commitment
        const txHash = await sendAndConfirmTransaction(connection, tx, [fromKeypair], {
            commitment: "finalized",          // wait until fully finalized
            preflightCommitment: "processed", // do a quick preflight
            skipPreflight: false,
            maxRetries: 5,                    // retry if cluster is lagging
        })

        // Explicit confirmation to be extra safe
        await connection.confirmTransaction(
            {
                signature: txHash,
                commitment: "finalized",
            },
            "finalized"
        )

        console.log(`✅ SOL swept ${Number(amountToSend) / 1e9} SOL. TX: ${txHash}`)
        return txHash
    } catch (err) {
        console.error(`❌ SOL sweep failed for index ${index}:`, err.message)
        return null
    }
}

module.exports = {
    sweepSOL,
}
