// services/sweeper/erc20-sweeper.js
const { ethers } = require("ethers")
const { deriveAddressByNetwork } = require("../hdWallet")
const { ETH_PROVIDER, ERC20_ABI, GAS_CONFIG } = require("./config")
const { getMainWallet } = require("./utils")

async function sweepERC20(tokenAddress, fromIndex, decimals = 6) {
    try {
        if (fromIndex === 0) {
            console.log(`⚠️ Skipping index 0 (main wallet)`)
            return null
        }

        const fromWallet = await deriveAddressByNetwork("ETH", fromIndex)
        const toWallet = await deriveAddressByNetwork("ETH", 0)
        const wallet = new ethers.Wallet(fromWallet.privateKey, ETH_PROVIDER)
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet)

        console.log(`\n--- 🔍 Sweep Debug [Index ${fromIndex}] ---`)
        console.log(`[FROM] ${fromWallet.address}`)
        console.log(`[TO]   ${toWallet.address}`)

        // --- 1. Check token balance ---
        const balance = await tokenContract.balanceOf(fromWallet.address)
        if (balance <= 0n) {
            console.log(`⚠️ No token balance at index ${fromIndex}`)
            return null
        }
        console.log(`[Token Balance] ${ethers.formatUnits(balance, decimals)}`)

        // --- 2. Check ETH balance for gas ---
        const feeData = await ETH_PROVIDER.getFeeData()
        const estimatedGas = BigInt(GAS_CONFIG.ERC20.TRANSFER_LIMIT)
        const maxFeePerGas = feeData.maxFeePerGas ?? ethers.parseUnits("50", "gwei")
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? ethers.parseUnits("2", "gwei")
        const requiredGas = estimatedGas * maxFeePerGas
        const ethBalance = await ETH_PROVIDER.getBalance(fromWallet.address)
        console.log(`[ETH Balance] ${ethers.formatEther(ethBalance)} ETH`)
        console.log(`[Estimated Gas Cost] ${ethers.formatEther(requiredGas)} ETH`)

        if (ethBalance < requiredGas) {
            console.log(`⛽ Funding gas for ERC20 sweep at index ${fromIndex}`)
            const fundAmount = requiredGas * BigInt(GAS_CONFIG.ERC20.BUFFER_MULTIPLIER)
            const fundTx = await getMainWallet().sendTransaction({
                to: fromWallet.address,
                value: fundAmount,
                gasLimit: GAS_CONFIG.ETH.BASE_LIMIT,
            })
            await fundTx.wait()
            console.log(`✅ Gas funded: ${fundTx.hash}`)
        }

        // --- 3. Get nonce ---
        const nonce = await ETH_PROVIDER.getTransactionCount(fromWallet.address, "pending")
        console.log(`[Nonce] Using nonce: ${nonce}`)

        // --- 4. Get token info ---
        const tokenDecimals = await tokenContract.decimals()
        const tokenSymbol = await tokenContract.symbol()
        console.log(`[Token] ${tokenSymbol} (decimals: ${tokenDecimals})`)
        console.log(`[Transfer Amount] ${ethers.formatUnits(balance, tokenDecimals)} ${tokenSymbol}`)

        // --- 5. Execute transfer ---
        console.log(`🚀 Sending transfer...`)
        const transferTx = await tokenContract.transfer(toWallet.address, balance, {
            gasLimit: estimatedGas,
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            nonce: nonce,
        })

        console.log(`📨 Transfer broadcasted: ${transferTx.hash}`)
        const receipt = await transferTx.wait()
        if (receipt.status === 1) {
            console.log(`✅ Sweep complete: ${ethers.formatUnits(balance, tokenDecimals)} ${tokenSymbol} transferred. TX: ${transferTx.hash}`)
        } else {
            console.log(`❌ Sweep failed: TX ${transferTx.hash}`)
        }

        return transferTx.hash
    } catch (err) {
        console.error(`❌ ERC20 sweep failed for index ${fromIndex}:`, err.message)
        return null
    }
}

module.exports = {
    sweepERC20,
}
