const express = require("express")
const router = express.Router()
const priceService = require("../services/priceService")

router.get("/price/:symbol", async (req, res) => {
    try {
        const { symbol } = req.params
        const { fiat = "usd" } = req.query

        const price = await priceService.getCryptoPrice(symbol, fiat)

        res.json({
            success: true,
            symbol: symbol.toUpperCase(),
            fiatCurrency: fiat.toUpperCase(),
            price,
            timestamp: Date.now(),
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
})

router.post("/convert/fiat-to-crypto", async (req, res) => {
    try {
        const { fiatAmount, cryptoSymbol, fiatCurrency = "usd" } = req.body

        const cryptoAmount = await priceService.convertFiatToCrypto(fiatAmount, cryptoSymbol, fiatCurrency)

        res.json({
            success: true,
            fiatAmount,
            fiatCurrency: fiatCurrency.toUpperCase(),
            cryptoAmount,
            cryptoSymbol: cryptoSymbol.toUpperCase(),
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
})

router.post("/prices/multiple", async (req, res) => {
    try {
        const { symbols, fiatCurrency = "usd" } = req.body

        const prices = await priceService.getMultiplePrices(symbols, fiatCurrency)

        res.json({
            success: true,
            fiatCurrency: fiatCurrency.toUpperCase(),
            prices,
            timestamp: Date.now(),
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
})

module.exports = router
