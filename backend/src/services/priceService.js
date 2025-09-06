// services/priceService.js
const axios = require("axios")
const { getPriceCacheCollection } = require("../config/db")

class PriceService {
    constructor() {
        this.CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache
        this.API_ENDPOINTS = {
            coinGecko: "https://api.coingecko.com/api/v3/simple/price",
            binance: "https://api.binance.com/api/v3/ticker/price",
            coinCap: "https://api.coincap.io/v2/assets",
        }
        this.symbolMap = {
            BTC: "bitcoin",
            ETH: "ethereum",
            TRX: "tron",
            USDT: "tether",
            USDC: "usd-coin",
            SOL: "solana",
        }
        this.lastApiCall = 0
        this.minApiDelay = 1000 // 1 second between API calls
    }

    async getCryptoPrice(symbol, fiatCurrency = "usd") {
        try {
            const priceCache = getPriceCacheCollection()
            const cacheKey = `${symbol.toLowerCase()}_${fiatCurrency.toLowerCase()}`

            // Check cache
            const cachedPrice = await priceCache.findOne({
                symbol: cacheKey,
                timestamp: { $gt: Date.now() - this.CACHE_DURATION },
            })

            if (cachedPrice) {
                console.log(`[v0] Using cached price for ${symbol}: ${cachedPrice.price}`)
                return cachedPrice.price
            }

            // Fetch fresh price
            const freshPrice = await this.fetchPriceFromAPI(symbol, fiatCurrency)

            // Cache it
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
        const now = Date.now()
        const timeSinceLastCall = now - this.lastApiCall
        if (timeSinceLastCall < this.minApiDelay) {
            await new Promise((resolve) => setTimeout(resolve, this.minApiDelay - timeSinceLastCall))
        }
        this.lastApiCall = Date.now()

        const coinGeckoId = this.symbolMap[symbol.toUpperCase()] || symbol.toLowerCase()

        try {
            const response = await axios.get(this.API_ENDPOINTS.coinGecko, {
                params: {
                    ids: coinGeckoId,
                    vs_currencies: fiatCurrency.toLowerCase(),
                },
                timeout: 10000,
            })

            const price = response.data[coinGeckoId]?.[fiatCurrency.toLowerCase()]
            if (price) return Number.parseFloat(price)

            throw new Error("Price not found in CoinGecko response")
        } catch (err) {
            console.error(`[v0] CoinGecko failed for ${symbol}:`, err.message)
        }

        try {
            const binanceSymbol = `${symbol.toUpperCase()}${fiatCurrency.toUpperCase()}`
            const response = await axios.get(this.API_ENDPOINTS.binance, {
                params: { symbol: binanceSymbol },
                timeout: 10000,
            })

            if (response.data.price) {
                return Number.parseFloat(response.data.price)
            }
        } catch (err) {
            console.error(`[v0] Binance failed for ${symbol}:`, err.message)
        }

        try {
            const response = await axios.get(`${this.API_ENDPOINTS.coinCap}/${coinGeckoId}`, {
                timeout: 10000,
            })

            if (response.data.data?.priceUsd && fiatCurrency.toLowerCase() === "usd") {
                return Number.parseFloat(response.data.data.priceUsd)
            }
        } catch (err) {
            console.error(`[v0] CoinCap failed for ${symbol}:`, err.message)
        }

        throw new Error(`All price APIs failed for ${symbol}`)
    }

    async convertFiatToCrypto(fiatAmount, cryptoSymbol, fiatCurrency = "usd") {
        const cryptoPrice = await this.getCryptoPrice(cryptoSymbol, fiatCurrency)
        const cryptoAmount = fiatAmount / cryptoPrice

        const decimals = ["BTC"].includes(cryptoSymbol.toUpperCase()) ? 8 : 6
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
            } catch (err) {
                console.error(`[v0] Failed to get price for ${symbol}:`, err.message)
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
        } catch (err) {
            console.error("[v0] Error clearing expired cache:", err.message)
            throw err
        }
    }

    async getPriceInCrypto(fiatAmount, cryptoSymbol, fiatCurrency = "eur") {
        return await this.convertFiatToCrypto(fiatAmount, cryptoSymbol, fiatCurrency)
    }
}

module.exports = new PriceService()
