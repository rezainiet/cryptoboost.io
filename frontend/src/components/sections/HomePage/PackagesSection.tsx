"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const PackagesSection = () => {
    const [isVisible, setIsVisible] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.1 },
        )

        const element = document.getElementById("packages-section")
        if (element) observer.observe(element)

        return () => observer.disconnect()
    }, [])

    const packages = [
        {
            title: "Test Starter",
            subtitle: "Parfait pour débuter dans l'investissement automatisé",
            investment: 5,
            returns: 500, // estimated gain shown in UI
            actualReturns: 1200, // actual gain from backend (for reference)
            timeframe: "2 heures",
            apy: "800%",
            token: "ETH",
            tokenIcon: "Ξ",
            robotType: "single",
            popular: false,
            cryptoOptions: ["ETH", "SOL", "BTC"],
            accentColor: "from-cyan-400 to-blue-500",
            glowColor: "cyan-400",
        },
        {
            title: "Package Starter",
            subtitle: "Parfait pour débuter dans l'investissement automatisé",
            investment: 150,
            returns: 1200, // estimated gain shown in UI
            actualReturns: 4800, // actual gain from backend (for reference)
            timeframe: "2 heures",
            apy: "800%",
            token: "ETH",
            tokenIcon: "Ξ",
            robotType: "single",
            popular: false,
            cryptoOptions: ["ETH", "SOL", "BTC"],
            accentColor: "from-cyan-400 to-blue-500",
            glowColor: "cyan-400",
        },
        {
            title: "Package Standard",
            subtitle: "Équilibre parfait entre risque et rendement",
            investment: 250,
            returns: 2400, // estimated gain shown in UI
            actualReturns: 6780, // actual gain from backend (for reference)
            timeframe: "3 heures",
            apy: "960%",
            token: "ETH",
            tokenIcon: "Ξ",
            robotType: "single",
            popular: true,
            cryptoOptions: ["ETH", "SOL", "BTC"],
            accentColor: "from-purple-400 to-pink-500",
            glowColor: "purple-400",
        },
        {
            title: "Package Premium",
            subtitle: "Maximisez vos rendements avec notre stratégie avancée",
            investment: 400,
            returns: 3700, // estimated gain shown in UI
            actualReturns: 9800, // actual gain from backend (for reference)
            timeframe: "3 heures",
            apy: "925%",
            token: "SOL",
            tokenIcon: "◎",
            robotType: "double",
            popular: false,
            cryptoOptions: ["ETH", "SOL", "BTC"],
            accentColor: "from-orange-400 to-red-500",
            glowColor: "orange-400",
        },
        {
            title: "Package Elite",
            subtitle: "Pour les investisseurs expérimentés cherchant les meilleurs rendements",
            investment: 750,
            returns: 7100, // estimated gain shown in UI
            actualReturns: 9600, // actual gain from backend (for reference)
            timeframe: "2.5 heures",
            apy: "947%",
            token: "BTC",
            tokenIcon: "₿",
            robotType: "triple",
            popular: false,
            cryptoOptions: ["ETH", "SOL", "BTC"],
            accentColor: "from-emerald-400 to-teal-500",
            glowColor: "emerald-400",
        },
    ]

    const handlePackageSelect = (pkg) => {
        // default to BTC network for now; PaymentPage lets them switch
        navigate("/payment", { state: { package: pkg, network: "BTC" } })
    }

    return (
        <div
            id="packages-section"
            className="relative bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 py-16 md:py-24 overflow-hidden"
        >
            {/* Animated background elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div
                    className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "2s" }}
                ></div>
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "4s" }}
                ></div>
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: "50px 50px",
                    }}
                ></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 md:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-slate-400 text-sm mb-4 font-mono tracking-wider">
                        PERSONNALISÉ SELON VOTRE TOLÉRANCE AU RISQUE
                    </p>
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                        Packages d'Investissement
                        <br />
                        <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                            Automatisés
                        </span>
                    </h2>
                    <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Choisissez le package qui correspond à votre profil d'investisseur. Notre IA de trading automatisé travaille
                        24/7 pour maximiser vos rendements avec des stratégies éprouvées.
                    </p>
                </div>

                {/* Packages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {packages.map((pkg, index) => (
                        <div
                            key={index}
                            className={`relative group transform transition-all duration-700 hover:scale-105 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                }`}
                            style={{ animationDelay: `${index * 200}ms` }}
                        >
                            <div className="relative bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-600/30 overflow-hidden shadow-2xl">
                                {/* Popular Badge */}
                                {pkg.popular && (
                                    <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold z-20 shadow-lg shadow-purple-500/25 animate-pulse">
                                        POPULAIRE
                                    </div>
                                )}

                                {/* Card Details */}
                                <div className="relative p-6 z-10">
                                    <h3 className="text-2xl font-bold text-white mb-2 font-mono tracking-wide">{pkg.title}</h3>
                                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">{pkg.subtitle}</p>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                            <span className="text-slate-400 font-mono text-sm">INVESTISSEMENT</span>
                                            <span className="font-bold text-lg text-white font-mono">€{pkg.investment.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                            <span className="text-slate-400 font-mono text-sm">GAIN ESTIMÉ</span>
                                            <span className={`font-bold text-lg text-${pkg.glowColor} font-mono`}>
                                                €{pkg.returns.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                            <span className="text-slate-400 font-mono text-sm">DURÉE SESSION</span>
                                            <span className="font-bold text-lg text-white font-mono">{pkg.timeframe}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handlePackageSelect(pkg)}
                                        className={`w-full bg-gradient-to-r ${pkg.accentColor} hover:shadow-lg hover:shadow-${pkg.glowColor}/25 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 font-mono tracking-wider`}
                                    >
                                        CHOISIR CE PACKAGE
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default PackagesSection
