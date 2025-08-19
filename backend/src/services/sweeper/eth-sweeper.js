// services/sweeper/eth-sweeper.js
const { ethers } = require("ethers")
const { deriveAddressByNetwork } = require("../hdWallet")
const { ETH_PROVIDER, GAS_CONFIG } = require("./config")

async function sweepETH(index) {
    try {
        // Skip index 0 (main wallet)
        if (index === 0) return null

        const fromWallet = deriveAddressByNetwork("ETH", index)
        const toWallet = deriveAddressByNetwork("ETH", 0)

        // Check balance first
        const balance = await ETH_PROVIDER.getBalance(fromWallet.address)
        if (balance <= 0n) {
            console.log(`No ETH balance at index ${index}`)
            return null
        }

        const feeData = await ETH_PROVIDER.getFeeData()
        const estimatedFee = feeData.gasPrice * BigInt(GAS_CONFIG.ETH.BASE_LIMIT)
        const amountToSend = balance - estimatedFee

        if (amountToSend <= 0n) {
            console.log(`Insufficient ETH (${ethers.formatEther(balance)}) for gas at index ${index}`)
            return null
        }

        const wallet = new ethers.Wallet(fromWallet.privateKey, ETH_PROVIDER)
        const tx = await wallet.sendTransaction({
            to: toWallet.address,
            value: amountToSend,
            gasPrice: feeData.gasPrice,
            gasLimit: GAS_CONFIG.ETH.BASE_LIMIT,
        })

        console.log(`✅ ETH swept ${ethers.formatEther(amountToSend)}. TX: ${tx.hash}`)
        return tx.hash
    } catch (err) {
        console.error(`❌ ETH sweep failed for index ${index}:`, err.message)
        return null
    }
}

module.exports = {
    sweepETH,
}
