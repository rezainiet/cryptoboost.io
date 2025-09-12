// services/sweeper/utils.js
const { ethers } = require("ethers")
const { ETH_PROVIDER } = require("./config")

// Main wallet management
let mainWallet
function getMainWallet() {
    if (!mainWallet) {
        if (!process.env.MNEMONIC) throw new Error("MNEMONIC not found")
        mainWallet = ethers.HDNodeWallet.fromPhrase(process.env.MNEMONIC, undefined, "m/44'/60'/0'/0/0").connect(
            ETH_PROVIDER,
        )
    }
    return mainWallet
}

// Verification utilities
async function verifyTransaction(txid, network, timeout = 60000) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
        try {
            let verified = false

            switch (network.toUpperCase()) {
                case "BTC":
                    const axios = require("axios")
                    const { data } = await axios.get(`https://blockstream.info/api/tx/${txid}`)
                    verified = data.status.confirmed
                    break
                case "SOL":
                    const { Connection } = require("@solana/web3.js")
                    const { SOLANA_RPC } = require("./config")
                    const connection = new Connection(SOLANA_RPC)
                    const status = await connection.getSignatureStatus(txid)
                    verified = status.value?.confirmationStatus === "confirmed"
                    break
                default:
                    // For ETH/ERC20, we can check if transaction is mined
                    const receipt = await ETH_PROVIDER.getTransactionReceipt(txid)
                    verified = receipt && receipt.status === 1
            }

            if (verified) return true
        } catch (err) {
            // Ignore temporary errors
        }
        await new Promise((resolve) => setTimeout(resolve, 5000))
    }
    return false
}

module.exports = {
    getMainWallet,
    verifyTransaction,
}
