"use client"

import { useState, useEffect } from "react"

const CryptoPrices = () => {
    const [prices, setPrices] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lastUpdated, setLastUpdated] = useState(null)

    const cryptoInfo = {
        bitcoin: { name: "Bitcoin", symbol: "BTC", icon: "₿", color: "from-orange-500 to-yellow-500" },
        ethereum: { name: "Ethereum", symbol: "ETH", icon: "Ξ", color: "from-blue-500 to-purple-500" },
        tether: { name: "Tether", symbol: "USDT", icon: "₮", color: "from-green-500 to-emerald-500" },
        binancecoin: { name: "BNB", symbol: "BNB", icon: "◆", color: "from-yellow-500 to-orange-500" },
    }

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                setError(null)
                const res = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true",
                )

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`)
                }

                const data = await res.json()
                // console.log("[v0] Fetched crypto data:", data)

                setPrices((prevPrices) => ({ ...data }))
                setLastUpdated(new Date())
                setLoading(false)
            } catch (err) {
                console.error("[v0] Error fetching prices:", err)
                setError("Erreur lors du chargement des prix")
                setLoading(false)
            }
        }

        fetchPrices()
        const interval = setInterval(fetchPrices, 15000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <section className="relative z-10 bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 border-t border-emerald-600/30">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400"></div>
                        <p className="text-gray-300 mt-4">Chargement des prix crypto...</p>
                    </div>
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="relative z-10 bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 border-t border-emerald-600/30">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
                    <div className="text-center">
                        <p className="text-red-400">{error}</p>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="relative z-10 bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 border-t border-emerald-600/30 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-ping"></div>
                <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse delay-1000"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-mono">
                        Prix des Cryptomonnaies
                        <span className="text-lime-400 ml-2">EN DIRECT</span>
                    </h2>
                    <p className="text-gray-300 text-lg">Données de marché mises à jour toutes les 15 secondes</p>
                    {lastUpdated && (
                        <p className="text-gray-400 text-sm mt-2">
                            Dernière mise à jour: {lastUpdated.toLocaleTimeString("fr-FR")}
                        </p>
                    )}
                    <div className="w-24 h-1 bg-gradient-to-r from-lime-400 to-emerald-400 mx-auto mt-4 rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(prices).map(([coin, data]) => {
                        const info = cryptoInfo[coin]
                        if (!info || !data) return null

                        const price = data.usd || 0
                        const change = data.usd_24h_change || 0
                        const isUp = change >= 0
                        const marketCap = data.usd_market_cap ? (data.usd_market_cap / 1e9).toFixed(1) : null
                        const volume = data.usd_24h_vol ? (data.usd_24h_vol / 1e6).toFixed(0) : null

                        return (
                            <div
                                key={coin}
                                className="group relative bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-800/50 backdrop-blur-xl border border-emerald-600/20 rounded-2xl p-6 hover:border-lime-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-lime-400/10 hover:-translate-y-1 animate-pulse-subtle"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-lime-400/0 via-lime-400/10 to-lime-400/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                <div className="relative flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className={`w-12 h-12 rounded-full bg-gradient-to-r ${info.color} flex items-center justify-center text-white font-bold text-xl shadow-lg transform transition-transform duration-300 group-hover:scale-110`}
                                        >
                                            {info.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold text-lg">{info.name}</h3>
                                            <p className="text-gray-400 text-sm font-mono">{info.symbol}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/50"></div>
                                        <span className="text-xs text-gray-400 font-mono">LIVE</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div
                                        key={price}
                                        className="text-2xl md:text-3xl font-bold text-white font-mono mb-2 transition-all duration-300"
                                    >
                                        ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    </div>
                                    <div
                                        className={`flex items-center space-x-2 transition-colors duration-300 ${isUp ? "text-emerald-400" : "text-red-400"}`}
                                    >
                                        <span className="text-lg transform transition-transform duration-300 group-hover:scale-125">
                                            {isUp ? "↗" : "↘"}
                                        </span>
                                        <span className="font-semibold">{Math.abs(change.toFixed(2))}%</span>
                                        <span className="text-xs text-gray-400">24h</span>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-gray-600/30">
                                    {marketCap && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Cap. Marché</span>
                                            <span className="text-white font-mono">${marketCap}B</span>
                                        </div>
                                    )}
                                    {volume && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Volume 24h</span>
                                            <span className="text-white font-mono">${volume}M</span>
                                        </div>
                                    )}
                                </div>

                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-lime-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none transform group-hover:scale-105"></div>
                            </div>
                        )
                    })}
                </div>

                <div className="text-center mt-12 pt-8 border-t border-gray-600/30">
                    <p className="text-gray-400 text-sm">
                        Données fournies par <span className="text-lime-400 font-semibold">CoinGecko API</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-1">Mise à jour automatique toutes les 15 secondes</p>
                </div>
            </div>
            <style jsx>{`
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.005);
          }
        }
      `}</style>
        </section>
    )
}

export default CryptoPrices
