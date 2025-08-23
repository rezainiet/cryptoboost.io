"use client"

import { useState, useEffect, useRef } from "react"

const TradingViewChart = () => {
    const containerRef = useRef(null)
    const widgetRef = useRef(null)
    const [selectedSymbol, setSelectedSymbol] = useState("BTCUSD")
    const [selectedTimeframe, setSelectedTimeframe] = useState("1D")
    const [selectedTheme, setSelectedTheme] = useState("dark")
    const [isLoading, setIsLoading] = useState(true)
    const [showControls, setShowControls] = useState(true)
    const [activeTab, setActiveTab] = useState("symbol")

    const symbols = [
        { value: "BTCUSD", label: "Bitcoin", icon: "₿", color: "from-orange-500 to-yellow-500" },
        { value: "ETHUSD", label: "Ethereum", icon: "Ξ", color: "from-blue-500 to-purple-500" },
        { value: "BNBUSD", label: "BNB", icon: "◆", color: "from-yellow-500 to-orange-500" },
        { value: "SOLUSD", label: "Solana", icon: "◎", color: "from-purple-500 to-pink-500" },
        { value: "ADAUSD", label: "Cardano", icon: "₳", color: "from-blue-600 to-cyan-500" },
        { value: "DOTUSD", label: "Polkadot", icon: "●", color: "from-pink-500 to-rose-500" },
    ]

    const timeframes = [
        { value: "1", label: "1m" },
        { value: "5", label: "5m" },
        { value: "15", label: "15m" },
        { value: "60", label: "1h" },
        { value: "240", label: "4h" },
        { value: "1D", label: "1D" },
        { value: "1W", label: "1W" },
    ]

    const chartTypes = [
        { value: "1", label: "Candlesticks", icon: "📊" },
        { value: "0", label: "Bars", icon: "📈" },
        { value: "3", label: "Line", icon: "📉" },
        { value: "9", label: "Area", icon: "🌊" },
    ]

    const [selectedChartType, setSelectedChartType] = useState("1")

    useEffect(() => {
        const script = document.createElement("script")
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
        script.type = "text/javascript"
        script.async = true
        script.innerHTML = JSON.stringify({
            autosize: true,
            symbol: selectedSymbol,
            interval: selectedTimeframe,
            timezone: "Etc/UTC",
            theme: selectedTheme,
            style: selectedChartType,
            locale: "fr",
            enable_publishing: false,
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            gridColor: "rgba(6, 78, 59, 0.3)",
            hide_top_toolbar: false,
            hide_legend: false,
            save_image: true,
            container_id: "tradingview_chart",
            studies: ["Volume@tv-basicstudies", "RSI@tv-basicstudies"],
            overrides: {
                "paneProperties.background": "rgba(15, 23, 42, 0.8)",
                "paneProperties.backgroundType": "gradient",
                "paneProperties.backgroundGradientStartColor": "rgba(15, 23, 42, 0.9)",
                "paneProperties.backgroundGradientEndColor": "rgba(6, 78, 59, 0.8)",
                "scalesProperties.textColor": "#94a3b8",
                "scalesProperties.lineColor": "rgba(6, 78, 59, 0.3)",
            },
        })

        if (containerRef.current) {
            containerRef.current.innerHTML = ""
            containerRef.current.appendChild(script)

            // Set loading to false after a delay to simulate chart loading
            setTimeout(() => setIsLoading(false), 2000)
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = ""
            }
        }
    }, [selectedSymbol, selectedTimeframe, selectedTheme, selectedChartType])

    const currentSymbolInfo = symbols.find((s) => s.value === selectedSymbol)

    return (
        <section className="relative z-10 bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 border-t border-emerald-600/30 overflow-hidden">
            {/* Background Animation */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-ping"></div>
                <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse delay-1000"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-mono">
                        Graphiques TradingView
                        <span className="text-lime-400 ml-2">AVANCÉS</span>
                    </h2>
                    <p className="text-gray-300 text-lg">Analyse technique professionnelle en temps réel</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-lime-400 to-emerald-400 mx-auto mt-4 rounded-full"></div>
                </div>

                <div className="relative bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-800/50 backdrop-blur-xl border border-emerald-600/20 rounded-2xl overflow-hidden">
                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mb-4"></div>
                                <p className="text-gray-300">Chargement du graphique TradingView...</p>
                            </div>
                        </div>
                    )}

                    <div className="h-[700px] w-full">
                        <div ref={containerRef} id="tradingview_chart" className="h-full w-full"></div>
                    </div>

                    {/* Controls at bottom of chart */}
                    <div className="bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-t border-emerald-600/30 p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Symbol Selection */}
                            <div className="flex-1">
                                <h3 className="text-white font-semibold text-sm mb-3 flex items-center">
                                    <span className="mr-2">📈</span>
                                    Cryptomonnaies
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {symbols.map((symbol) => (
                                        <button
                                            key={symbol.value}
                                            onClick={() => setSelectedSymbol(symbol.value)}
                                            className={`flex items-center space-x-2 p-3 rounded-lg transition-all duration-200 ${selectedSymbol === symbol.value
                                                ? "bg-lime-400/20 border border-lime-400/40 text-lime-400"
                                                : "bg-slate-700/30 hover:bg-slate-600/40 text-gray-300 hover:text-white"
                                                }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-full bg-gradient-to-r ${symbol.color} flex items-center justify-center text-white font-bold text-xs`}
                                            >
                                                {symbol.icon}
                                            </div>
                                            <span className="font-medium text-sm">{symbol.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Timeframe Selection */}
                            <div className="flex-1">
                                <h3 className="text-white font-semibold text-sm mb-3 flex items-center">
                                    <span className="mr-2">⏱️</span>
                                    Période
                                </h3>
                                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                                    {timeframes.map((timeframe) => (
                                        <button
                                            key={timeframe.value}
                                            onClick={() => setSelectedTimeframe(timeframe.value)}
                                            className={`p-2 rounded-lg font-mono text-sm transition-all duration-200 ${selectedTimeframe === timeframe.value
                                                ? "bg-lime-400/20 border border-lime-400/40 text-lime-400"
                                                : "bg-slate-700/30 hover:bg-slate-600/40 text-gray-300 hover:text-white"
                                                }`}
                                        >
                                            {timeframe.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chart Type Selection */}
                            <div className="flex-1">
                                <h3 className="text-white font-semibold text-sm mb-3 flex items-center">
                                    <span className="mr-2">📊</span>
                                    Type de graphique
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {chartTypes.map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => setSelectedChartType(type.value)}
                                            className={`flex items-center space-x-2 p-2 rounded-lg text-sm transition-all duration-200 ${selectedChartType === type.value
                                                ? "bg-lime-400/20 border border-lime-400/40 text-lime-400"
                                                : "bg-slate-700/30 hover:bg-slate-600/40 text-gray-300 hover:text-white"
                                                }`}
                                        >
                                            <span>{type.icon}</span>
                                            <span>{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Current Selection Display */}
                        <div className="mt-4 pt-4 border-t border-gray-600/30">
                            <div className="flex items-center justify-center space-x-4 text-sm">
                                <div className="flex items-center space-x-2">
                                    <div
                                        className={`w-5 h-5 rounded-full bg-gradient-to-r ${currentSymbolInfo?.color} flex items-center justify-center text-white font-bold text-xs`}
                                    >
                                        {currentSymbolInfo?.icon}
                                    </div>
                                    <span className="text-white font-medium">{currentSymbolInfo?.label}</span>
                                </div>
                                <span className="text-gray-400">•</span>
                                <span className="text-lime-400 font-mono">
                                    {timeframes.find((t) => t.value === selectedTimeframe)?.label}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-emerald-400">{chartTypes.find((t) => t.value === selectedChartType)?.label}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center mt-8 pt-6 border-t border-gray-600/30">
                    <p className="text-gray-400 text-sm">
                        Graphiques fournis par <span className="text-lime-400 font-semibold">TradingView</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                        Données de marché en temps réel avec indicateurs techniques avancés
                    </p>
                </div>
            </div>
        </section>
    )
}

export default TradingViewChart
