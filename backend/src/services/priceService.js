const axios = require("axios")
const { getPriceCacheCollection } = require("../config/db")

class PriceService {
    constructor() {
        this.CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        this.API_ENDPOINTS = {
            coinGecko: "https://api.coingecko.com/api/v3/simple/price",
            binance: "https://api.binance.com/api/v3/ticker/price",
        }
    }

    async getCryptoPrice(symbol, fiatCurrency = "usd") {
        try {
            const priceCache = getPriceCacheCollection()
            const cacheKey = `${symbol.toLowerCase()}_${fiatCurrency.toLowerCase()}`

            // Check if we have cached price within 24 hours
            const cachedPrice = await priceCache.findOne({
                symbol: cacheKey,
                timestamp: { $gt: Date.now() - this.CACHE_DURATION },
            })

            if (cachedPrice) {
                console.log(`[v0] Using cached price for ${symbol}: ${cachedPrice.price}`)
                return cachedPrice.price
            }

            // Fetch fresh price from API
            const freshPrice = await this.fetchPriceFromAPI(symbol, fiatCurrency)

            // Cache the new price
            await priceCache.updateOne(
                { symbol: cacheKey },
                {
                    $set: {
                        symbol: cacheKey,
                        price: freshPrice,
                        timestamp: Date.now(),
                        lastUpdated: new Date(),
                    },
                },
                { upsert: true },
            )

            console.log(`[v0] Fetched and cached fresh price for ${symbol}: ${freshPrice}`)
            return freshPrice
        } catch (error) {
            console.error(`[v0] Error getting crypto price for ${symbol}:`, error)
            throw new Error(`Failed to get price for ${symbol}`)
        }
    }

    async fetchPriceFromAPI(symbol, fiatCurrency) {
        const symbolMap = {
            BTC: "bitcoin",
            ETH: "ethereum",
            TRX: "tron",
            USDT: "tether",
        }

        try {
            // Try CoinGecko first
            const coinGeckoId = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase()
            const response = await axios.get(this.API_ENDPOINTS.coinGecko, {
                params: {
                    ids: coinGeckoId,
                    vs_currencies: fiatCurrency.toLowerCase(),
                },
                timeout: 10000,
            })

            const price = response.data[coinGeckoId]?.[fiatCurrency.toLowerCase()]
            if (price) {
                return Number.parseFloat(price)
            }

            throw new Error("Price not found in CoinGecko response")
        } catch (error) {
            console.log(`[v0] CoinGecko failed for ${symbol}, trying Binance...`)

            // Fallback to Binance
            try {
                const binanceSymbol = `${symbol.toUpperCase()}${fiatCurrency.toUpperCase()}`
                const response = await axios.get(this.API_ENDPOINTS.binance, {
                    params: { symbol: binanceSymbol },
                    timeout: 10000,
                })

                return Number.parseFloat(response.data.price)
            } catch (binanceError) {
                console.error(`[v0] Both APIs failed for ${symbol}:`, error, binanceError)
                throw new Error(`All price APIs failed for ${symbol}`)
            }
        }
    }

    async convertFiatToCrypto(fiatAmount, cryptoSymbol, fiatCurrency = "usd") {
        const cryptoPrice = await this.getCryptoPrice(cryptoSymbol, fiatCurrency)
        const cryptoAmount = fiatAmount / cryptoPrice

        // Round to appropriate decimal places based on crypto
        const decimals = cryptoSymbol.toUpperCase() === "BTC" ? 8 : 6
        return Number.parseFloat(cryptoAmount.toFixed(decimals))
    }

    async convertCryptoToFiat(cryptoAmount, cryptoSymbol, fiatCurrency = "usd") {
        const cryptoPrice = await this.getCryptoPrice(cryptoSymbol, fiatCurrency)
        const fiatAmount = cryptoAmount * cryptoPrice
        return Number.parseFloat(fiatAmount.toFixed(2))
    }

    async getMultiplePrices(symbols, fiatCurrency = "usd") {
        const prices = {}

        for (const symbol of symbols) {
            try {
                prices[symbol] = await this.getCryptoPrice(symbol, fiatCurrency)
            } catch (error) {
                console.error(`[v0] Failed to get price for ${symbol}:`, error)
                prices[symbol] = null
            }
        }

        return prices
    }

    async clearExpiredCache() {
        try {
            const priceCache = getPriceCacheCollection()
            const result = await priceCache.deleteMany({
                timestamp: { $lt: Date.now() - this.CACHE_DURATION },
            })

            console.log(`[v0] Cleared ${result.deletedCount} expired price cache entries`)
            return result.deletedCount
        } catch (error) {
            console.error("[v0] Error clearing expired cache:", error)
            throw error
        }
    }

    async getPriceInCrypto(fiatAmount, cryptoSymbol, fiatCurrency = "usd") {
        return await this.convertFiatToCrypto(fiatAmount, cryptoSymbol, fiatCurrency)
    }
}

module.exports = new PriceService()
