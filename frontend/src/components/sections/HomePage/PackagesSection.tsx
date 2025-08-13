"use client"

import { useState, useEffect } from "react"

const PackagesSection = () => {
    const [isVisible, setIsVisible] = useState(false)

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
            title: "Package Starter",
            subtitle: "Parfait pour débuter dans l'investissement automatisé",
            investment: "250€",
            returns: "5,000€",
            timeframe: "3 heures",
            apy: "1900%",
            token: "ETH",
            tokenIcon: "Ξ",
            robotType: "single", // single robot
            popular: false,
            cryptoOptions: ["ETH", "SOL", "BTC"],
        },
        {
            title: "Package Premium",
            subtitle: "Maximisez vos rendements avec notre stratégie avancée",
            investment: "500€",
            returns: "7,800€",
            timeframe: "3 heures",
            apy: "1460%",
            token: "SOL",
            tokenIcon: "◎",
            robotType: "double", // two robots
            popular: true,
            cryptoOptions: ["ETH", "SOL", "BTC"],
        },
        {
            title: "Package Elite",
            subtitle: "Pour les investisseurs expérimentés cherchant les meilleurs rendements",
            investment: "750€",
            returns: "9,200€",
            timeframe: "2.5 heures",
            apy: "1127%",
            token: "BTC",
            tokenIcon: "₿",
            robotType: "triple", // three robots
            popular: false,
            cryptoOptions: ["ETH", "SOL", "BTC"],
        },
    ]

    const SingleRobot = () => (
        <div className="relative w-24 h-24 bg-gradient-to-b from-gray-300 to-gray-600 rounded-full flex items-center justify-center shadow-xl">
            <div className="w-16 h-16 bg-gradient-to-b from-gray-800 to-black rounded-full flex items-center justify-center relative">
                <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/50"></div>
                    <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/50"></div>
                </div>
                <div className="absolute bottom-2 w-4 h-3 bg-gradient-to-b from-gray-600 to-gray-800 rounded"></div>
            </div>
        </div>
    )

    const DoubleRobot = () => (
        <div className="flex space-x-2">
            <div className="relative w-20 h-20 bg-gradient-to-b from-gray-300 to-gray-600 rounded-full flex items-center justify-center shadow-xl">
                <div className="w-14 h-14 bg-gradient-to-b from-gray-800 to-black rounded-full flex items-center justify-center relative">
                    <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/50"></div>
                        <div className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/50"></div>
                    </div>
                </div>
            </div>
            <div className="relative w-20 h-20 bg-gradient-to-b from-gray-300 to-gray-600 rounded-full flex items-center justify-center shadow-xl">
                <div className="w-14 h-14 bg-gradient-to-b from-gray-800 to-black rounded-full flex items-center justify-center relative">
                    <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
                    </div>
                </div>
            </div>
        </div>
    )

    const TripleRobot = () => (
        <div className="flex flex-col items-center space-y-1">
            <div className="relative w-16 h-16 bg-gradient-to-b from-gray-300 to-gray-600 rounded-full flex items-center justify-center shadow-xl">
                <div className="w-12 h-12 bg-gradient-to-b from-gray-800 to-black rounded-full flex items-center justify-center relative">
                    <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></div>
                        <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></div>
                    </div>
                </div>
            </div>
            <div className="flex space-x-1">
                <div className="relative w-16 h-16 bg-gradient-to-b from-gray-300 to-gray-600 rounded-full flex items-center justify-center shadow-xl">
                    <div className="w-12 h-12 bg-gradient-to-b from-gray-800 to-black rounded-full flex items-center justify-center relative">
                        <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/50"></div>
                            <div className="w-1 h-1 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/50"></div>
                        </div>
                    </div>
                </div>
                <div className="relative w-16 h-16 bg-gradient-to-b from-gray-300 to-gray-600 rounded-full flex items-center justify-center shadow-xl">
                    <div className="w-12 h-12 bg-gradient-to-b from-gray-800 to-black rounded-full flex items-center justify-center relative">
                        <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div id="packages-section" className="bg-gradient-to-b from-gray-100 to-gray-200 py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-gray-600 text-sm mb-4">Personnalisé selon votre tolérance au risque</p>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Packages d'Investissement
                        <br />
                        <span className="text-teal-600">Automatisés</span>
                    </h2>
                    <p className="text-gray-700 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Choisissez le package qui correspond à votre profil d'investisseur. Notre IA de trading automatisé travaille
                        24/7 pour maximiser vos rendements avec des stratégies éprouvées.
                    </p>
                    <div className="mt-8 p-4 bg-teal-50 rounded-lg border border-teal-200 max-w-2xl mx-auto">
                        <p className="text-teal-800 font-semibold mb-2">💰 Dépôts acceptés en crypto</p>
                        <div className="flex justify-center space-x-6 text-sm text-teal-700">
                            <span className="flex items-center space-x-1">
                                <span className="font-bold">₿</span>
                                <span>Bitcoin (BTC)</span>
                            </span>
                            <span className="flex items-center space-x-1">
                                <span className="font-bold">Ξ</span>
                                <span>Ethereum (ETH)</span>
                            </span>
                            <span className="flex items-center space-x-1">
                                <span className="font-bold">◎</span>
                                <span>Solana (SOL)</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Packages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {packages.map((pkg, index) => (
                        <div
                            key={index}
                            className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-700 hover:scale-105 hover:shadow-2xl ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                } ${pkg.popular ? "ring-4 ring-teal-400 ring-opacity-50" : ""}`}
                            style={{ animationDelay: `${index * 200}ms` }}
                        >
                            {/* Popular Badge */}
                            {pkg.popular && (
                                <div className="absolute top-4 right-4 bg-lime-400 text-black px-3 py-1 rounded-full text-sm font-semibold z-10">
                                    Populaire
                                </div>
                            )}

                            {/* 3D Robot Section */}
                            <div className="relative h-48 bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center overflow-hidden">
                                {/* Glowing Background */}
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 blur-3xl"></div>

                                {/* Robot */}
                                <div className="relative z-10">
                                    {pkg.robotType === "single" && <SingleRobot />}
                                    {pkg.robotType === "double" && <DoubleRobot />}
                                    {pkg.robotType === "triple" && <TripleRobot />}
                                </div>

                                {/* Floating Particles */}
                                <div className="absolute inset-0">
                                    {[...Array(6)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-1 h-1 bg-lime-400 rounded-full animate-pulse"
                                            style={{
                                                left: `${20 + i * 15}%`,
                                                top: `${30 + (i % 3) * 20}%`,
                                                animationDelay: `${i * 300}ms`,
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            {/* Package Details */}
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.title}</h3>
                                <p className="text-gray-600 text-sm mb-6">{pkg.subtitle}</p>

                                {/* Investment Details */}
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Investissement</span>
                                        <span className="font-bold text-lg text-gray-900">{pkg.investment}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Retour estimé</span>
                                        <span className="font-bold text-lg text-teal-600">{pkg.returns}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Durée de session</span>
                                        <span className="font-bold text-lg text-gray-900">{pkg.timeframe}</span>
                                    </div>
                                </div>

                                {/* APY and Token */}
                                <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="text-sm text-gray-600">Rendement APY</div>
                                        <div className="text-2xl font-bold text-gray-900">{pkg.apy}</div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {pkg.tokenIcon}
                                        </div>
                                        <span className="font-semibold text-gray-900">{pkg.token}</span>
                                    </div>
                                </div>

                                <div className="mb-6 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-100">
                                    <div className="text-xs text-gray-600 mb-2">Dépôt accepté en:</div>
                                    <div className="flex justify-center space-x-3">
                                        {pkg.cryptoOptions.map((crypto, i) => (
                                            <span
                                                key={i}
                                                className="text-xs bg-white px-2 py-1 rounded-full border border-teal-200 text-teal-700 font-medium"
                                            >
                                                {crypto}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button className="w-full bg-lime-400 hover:bg-lime-300 text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-300 transform hover:scale-105">
                                    Choisir ce Package
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16">
                    <p className="text-gray-600 mb-4">Besoin d'aide pour choisir ?</p>
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300">
                        Parler à un Conseiller
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PackagesSection
