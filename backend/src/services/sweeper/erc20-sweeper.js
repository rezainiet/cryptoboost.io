const { ethers } = require("ethers")
const { deriveAddressByNetwork } = require("../hdWallet")
const { ETH_PROVIDER, ERC20_ABI, GAS_CONFIG } = require("./config")
const { getMainWallet } = require("./utils")

async function sweepERC20(tokenAddress, fromIndex) {
    try {
        if (fromIndex === 0) return null

        const fromWallet = await deriveAddressByNetwork("ETH", fromIndex)
        console.log("[fromWallet]", fromWallet)
        const toWallet = await deriveAddressByNetwork("ETH", 0)

        if (!fromWallet?.privateKey || !fromWallet?.address) {
            throw new Error(`❌ Missing wallet derivation for ETH index ${fromIndex}`)
        }

        const wallet = new ethers.Wallet(fromWallet.privateKey, ETH_PROVIDER)
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet)

        // Check token balance
        const balance = await tokenContract.balanceOf(fromWallet.address)
        if (balance <= 0n) {
            console.log(`No token balance at index ${fromIndex}`)
            return null
        }

        // Gas funding
        const feeData = await ETH_PROVIDER.getFeeData()
        const gasPrice = feeData.gasPrice || feeData.maxFeePerGas
        if (!gasPrice) throw new Error("No gas price available")

        const requiredGas = gasPrice * BigInt(GAS_CONFIG.ERC20.TRANSFER_LIMIT)
        const ethBalance = await ETH_PROVIDER.getBalance(fromWallet.address)

        if (ethBalance < requiredGas) {
            console.log(`Funding gas for ERC20 sweep at index ${fromIndex}`)
            const fundTx = await getMainWallet().sendTransaction({
                to: fromWallet.address,
                value: requiredGas * BigInt(GAS_CONFIG.ERC20.BUFFER_MULTIPLIER),
                gasLimit: 21000n, // standard transfer
            })
            await fundTx.wait()
        }

        // Get token details
        const tokenDecimals = await tokenContract.decimals()
        const tokenSymbol = await tokenContract.symbol()

        // Execute transfer
        const transferTx = await tokenContract.transfer(toWallet.address, balance, {
            gasLimit: GAS_CONFIG.ERC20.TRANSFER_LIMIT,
        })
        await transferTx.wait()

        console.log(`✅ ${tokenSymbol} swept ${ethers.formatUnits(balance, tokenDecimals)}. TX: ${transferTx.hash}`)
        return transferTx.hash
    } catch (err) {
        console.error(`❌ ERC20 sweep failed for index ${fromIndex}:`, err.message)
        return null
    }
}

module.exports = {
    sweepERC20,
}
