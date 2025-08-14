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
            robotType: "single",
            popular: false,
            cryptoOptions: ["ETH", "SOL", "BTC"],
            accentColor: "from-cyan-400 to-blue-500",
            glowColor: "cyan-400",
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
            robotType: "double",
            popular: true,
            cryptoOptions: ["ETH", "SOL", "BTC"],
            accentColor: "from-purple-400 to-pink-500",
            glowColor: "purple-400",
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
            robotType: "triple",
            popular: false,
            cryptoOptions: ["ETH", "SOL", "BTC"],
            accentColor: "from-orange-400 to-red-500",
            glowColor: "orange-400",
        },
    ]

    const SingleRobot = ({ glowColor }: { glowColor: string }) => (
        <div className="relative">
            {/* Outer glow ring */}
            <div
                className={`absolute inset-0 w-28 h-28 bg-gradient-to-r from-${glowColor}/20 to-transparent rounded-full blur-xl animate-pulse`}
            ></div>
            <div className="relative w-24 h-24 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-full flex items-center justify-center shadow-2xl border border-slate-600/50">
                {/* Inner core */}
                <div className="w-16 h-16 bg-gradient-to-b from-slate-900 to-black rounded-full flex items-center justify-center relative border border-slate-700/50">
                    {/* Glowing eyes */}
                    <div className="flex space-x-2">
                        <div
                            className={`w-2.5 h-2.5 bg-${glowColor} rounded-full animate-pulse shadow-lg shadow-${glowColor}/80`}
                        ></div>
                        <div
                            className={`w-2.5 h-2.5 bg-${glowColor} rounded-full animate-pulse shadow-lg shadow-${glowColor}/80`}
                        ></div>
                    </div>
                    {/* Mouth/speaker */}
                    <div className="absolute bottom-2 w-4 h-3 bg-gradient-to-b from-slate-600 to-slate-800 rounded border border-slate-500/30"></div>
                    {/* Circuit lines */}
                    <div className={`absolute top-1 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-${glowColor}/60`}></div>
                </div>
            </div>
        </div>
    )

    const DoubleRobot = ({ glowColor }: { glowColor: string }) => (
        <div className="flex space-x-3 relative">
            {/* Connecting energy beam */}
            <div
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-0.5 bg-gradient-to-r from-${glowColor}/60 via-${glowColor} to-${glowColor}/60 blur-sm`}
            ></div>

            {[0, 1].map((index) => (
                <div key={index} className="relative">
                    <div
                        className={`absolute inset-0 w-22 h-22 bg-gradient-to-r from-${glowColor}/20 to-transparent rounded-full blur-lg animate-pulse`}
                    ></div>
                    <div className="relative w-20 h-20 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-full flex items-center justify-center shadow-2xl border border-slate-600/50">
                        <div className="w-14 h-14 bg-gradient-to-b from-slate-900 to-black rounded-full flex items-center justify-center relative border border-slate-700/50">
                            <div className="flex space-x-1">
                                <div
                                    className={`w-1.5 h-1.5 bg-${glowColor} rounded-full animate-pulse shadow-lg shadow-${glowColor}/80`}
                                ></div>
                                <div
                                    className={`w-1.5 h-1.5 bg-${glowColor} rounded-full animate-pulse shadow-lg shadow-${glowColor}/80`}
                                ></div>
                            </div>
                            <div
                                className={`absolute top-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-1.5 bg-${glowColor}/60`}
                            ></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )

    const TripleRobot = ({ glowColor }: { glowColor: string }) => (
        <div className="flex flex-col items-center space-y-2 relative">
            {/* Energy network lines */}
            <div className={`absolute inset-0 w-full h-full`}>
                <div
                    className={`absolute top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-${glowColor}/60 to-transparent`}
                ></div>
                <div
                    className={`absolute bottom-4 left-1/4 w-8 h-0.5 bg-gradient-to-r from-${glowColor}/60 to-transparent`}
                ></div>
                <div
                    className={`absolute bottom-4 right-1/4 w-8 h-0.5 bg-gradient-to-l from-${glowColor}/60 to-transparent`}
                ></div>
            </div>

            {/* Top robot */}
            <div className="relative">
                <div
                    className={`absolute inset-0 w-18 h-18 bg-gradient-to-r from-${glowColor}/20 to-transparent rounded-full blur-lg animate-pulse`}
                ></div>
                <div className="relative w-16 h-16 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-full flex items-center justify-center shadow-2xl border border-slate-600/50">
                    <div className="w-12 h-12 bg-gradient-to-b from-slate-900 to-black rounded-full flex items-center justify-center relative border border-slate-700/50">
                        <div className="flex space-x-1">
                            <div
                                className={`w-1 h-1 bg-${glowColor} rounded-full animate-pulse shadow-lg shadow-${glowColor}/80`}
                            ></div>
                            <div
                                className={`w-1 h-1 bg-${glowColor} rounded-full animate-pulse shadow-lg shadow-${glowColor}/80`}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom robots */}
            <div className="flex space-x-2">
                {[0, 1].map((index) => (
                    <div key={index} className="relative">
                        <div
                            className={`absolute inset-0 w-18 h-18 bg-gradient-to-r from-${glowColor}/20 to-transparent rounded-full blur-lg animate-pulse`}
                        ></div>
                        <div className="relative w-16 h-16 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-full flex items-center justify-center shadow-2xl border border-slate-600/50">
                            <div className="w-12 h-12 bg-gradient-to-b from-slate-900 to-black rounded-full flex items-center justify-center relative border border-slate-700/50">
                                <div className="flex space-x-1">
                                    <div
                                        className={`w-1 h-1 bg-${glowColor} rounded-full animate-pulse shadow-lg shadow-${glowColor}/80`}
                                    ></div>
                                    <div
                                        className={`w-1 h-1 bg-${glowColor} rounded-full animate-pulse shadow-lg shadow-${glowColor}/80`}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

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
                        backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
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

                    <div className="mt-8 p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl border border-slate-600/30 backdrop-blur-sm max-w-2xl mx-auto">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mr-3"></div>
                            <p className="text-cyan-400 font-semibold font-mono tracking-wider">DÉPÔTS ACCEPTÉS EN CRYPTO</p>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse ml-3"></div>
                        </div>
                        <div className="flex justify-center space-x-8 text-sm">
                            <span className="flex items-center space-x-2 text-slate-300">
                                <span className="text-orange-400 font-bold text-lg">₿</span>
                                <span className="font-mono">Bitcoin (BTC)</span>
                            </span>
                            <span className="flex items-center space-x-2 text-slate-300">
                                <span className="text-blue-400 font-bold text-lg">Ξ</span>
                                <span className="font-mono">Ethereum (ETH)</span>
                            </span>
                            <span className="flex items-center space-x-2 text-slate-300">
                                <span className="text-purple-400 font-bold text-lg">◎</span>
                                <span className="font-mono">Solana (SOL)</span>
                            </span>
                        </div>
                    </div>
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

                                {/* Glowing border effect */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-r ${pkg.accentColor} opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500`}
                                ></div>
                                <div
                                    className={`absolute inset-[1px] bg-gradient-to-b from-slate-800/90 to-slate-900/90 rounded-3xl`}
                                ></div>

                                {/* 3D Robot Section */}
                                <div
                                    className={`relative h-56 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden border-b border-slate-700/50`}
                                >
                                    {/* Animated background grid */}
                                    <div className="absolute inset-0 opacity-20">
                                        <div
                                            className="w-full h-full"
                                            style={{
                                                backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                      `,
                                                backgroundSize: "20px 20px",
                                            }}
                                        ></div>
                                    </div>

                                    {/* Glowing orb background */}
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-r from-${pkg.glowColor}/20 to-transparent blur-2xl animate-pulse`}
                                    ></div>

                                    {/* Robot */}
                                    <div className="relative z-10">
                                        {pkg.robotType === "single" && <SingleRobot glowColor={pkg.glowColor} />}
                                        {pkg.robotType === "double" && <DoubleRobot glowColor={pkg.glowColor} />}
                                        {pkg.robotType === "triple" && <TripleRobot glowColor={pkg.glowColor} />}
                                    </div>

                                    {/* Floating data particles */}
                                    <div className="absolute inset-0">
                                        {[...Array(8)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`absolute w-1 h-1 bg-${pkg.glowColor} rounded-full animate-pulse opacity-60`}
                                                style={{
                                                    left: `${15 + i * 12}%`,
                                                    top: `${25 + (i % 4) * 15}%`,
                                                    animationDelay: `${i * 400}ms`,
                                                }}
                                            ></div>
                                        ))}
                                    </div>
                                </div>

                                {/* Package Details */}
                                <div className="relative p-6 z-10">
                                    <h3 className="text-2xl font-bold text-white mb-2 font-mono tracking-wide">{pkg.title}</h3>
                                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">{pkg.subtitle}</p>

                                    {/* Investment Details */}
                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                            <span className="text-slate-400 font-mono text-sm">INVESTISSEMENT</span>
                                            <span className="font-bold text-lg text-white font-mono">{pkg.investment}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                            <span className="text-slate-400 font-mono text-sm">RETOUR ESTIMÉ</span>
                                            <span className={`font-bold text-lg text-${pkg.glowColor} font-mono`}>{pkg.returns}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                            <span className="text-slate-400 font-mono text-sm">DURÉE SESSION</span>
                                            <span className="font-bold text-lg text-white font-mono">{pkg.timeframe}</span>
                                        </div>
                                    </div>

                                    {/* APY and Token */}
                                    <div
                                        className={`flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-xl border border-slate-600/30`}
                                    >
                                        <div>
                                            <div className="text-sm text-slate-400 mb-3 font-mono tracking-wider">RENDEMENT APY</div>
                                            <div className={`text-3xl font-bold text-${pkg.glowColor} font-mono`}>{pkg.apy}</div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className={`w-10 h-10 bg-gradient-to-r ${pkg.accentColor} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                                            >
                                                {pkg.tokenIcon}
                                            </div>
                                            <span className="font-semibold text-white font-mono">{pkg.token}</span>
                                        </div>
                                    </div>

                                    {/* Crypto options */}
                                    <div className="mb-6 p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl border border-slate-600/20">
                                        <div className="text-xs text-slate-400 mb-3 font-mono tracking-wider">DÉPÔT ACCEPTÉ EN:</div>
                                        <div className="flex justify-center space-x-3">
                                            {pkg.cryptoOptions.map((crypto, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs bg-slate-700/80 px-3 py-2 rounded-full border border-slate-600/50 text-slate-300 font-mono font-medium hover:border-slate-500/80 transition-colors"
                                                >
                                                    {crypto}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        className={`w-full bg-gradient-to-r ${pkg.accentColor} hover:shadow-lg hover:shadow-${pkg.glowColor}/25 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 font-mono tracking-wider`}
                                    >
                                        CHOISIR CE PACKAGE
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16">
                    <p className="text-slate-400 mb-6 font-mono tracking-wider">BESOIN D'AIDE POUR CHOISIR ?</p>
                    <button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/25 font-mono tracking-wider">
                        PARLER À UN CONSEILLER
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PackagesSection
