// services/sweeper/index.js
const { sweepBTC } = require("./btc-sweeper")
const { sweepETH } = require("./eth-sweeper")
const { sweepERC20 } = require("./erc20-sweeper")
const { sweepSOL } = require("./sol-sweeper")
const { TOKEN_ADDRESSES } = require("./config")

// Background sweeping state
let isSweeping = false
const sweepQueue = new Map()

// Network-specific sweep dispatcher
async function sweepByNetwork(network, index) {
    return backgroundSweep(network, index)
}

// Background sweeping logic
async function backgroundSweep(network, index) {
    // Skip index 0 (main wallet) for all networks
    if (index === 0) return null

    if (isSweeping) {
        sweepQueue.set(`${network}-${index}`, { network, index })
        return null
    }

    isSweeping = true
    try {
        let result
        switch (network.toUpperCase()) {
            case "BTC":
                result = await sweepBTC(index)
                break
            case "ETH":
                result = await sweepETH(index)
                break
            case "USDT":
                result = await sweepERC20(TOKEN_ADDRESSES.USDT, index)
                break
            case "USDC":
                result = await sweepERC20(TOKEN_ADDRESSES.USDC, index)
                break
            case "SOL":
                result = await sweepSOL(index)
                break
            default:
                console.error(`Unsupported network: ${network}`)
                return null
        }
        return result
    } catch (err) {
        console.error(`Background sweep error for ${network}-${index}:`, err)
        return null
    } finally {
        isSweeping = false
        processSweepQueue()
    }
}

async function processSweepQueue() {
    if (sweepQueue.size > 0 && !isSweeping) {
        const [key, { network, index }] = sweepQueue.entries().next().value
        sweepQueue.delete(key)
        await backgroundSweep(network, index)
    }
}

function startBackgroundSweeper(intervalMinutes = 15) {
    // Only process the queue periodically
    setInterval(processSweepQueue, intervalMinutes * 60 * 1000)
}

module.exports = {
    sweepByNetwork,
    startBackgroundSweeper,
    // Export individual sweep functions for direct use
    sweepBTC,
    sweepETH,
    sweepERC20,
    sweepSOL,
}
