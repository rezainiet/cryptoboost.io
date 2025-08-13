"use client"

import { useState, useEffect } from "react"
import Navbar from "../../layouts/Navbar"

const Hero = () => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
    }, [])

    const yieldCards = [
        { percentage: "1400%", detail: "+237.42 €/jour", icon: "E", color: "bg-emerald-400" },
        { percentage: "2173%", detail: "+677.32 USDT/jour", icon: "T", color: "bg-teal-400" },
        { percentage: "3123%", detail: "+297.38 DAI/jour", icon: "D", color: "bg-green-400" },
        { percentage: "123%", detail: "+132.91 USDT/jour", icon: "T", color: "bg-emerald-300" },
        { percentage: "4123%", detail: "+537.32 USDT/jour", icon: "T", color: "bg-teal-300" },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
            <Navbar />

            {/* Hero Content */}
            <div className="relative z-10 px-4 md:px-8 py-12 md:py-20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div
                        className={`transform transition-all duration-1000 ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"}`}
                    >
                        <h1 className="hero-title text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                            Le Protocole
                            <br />
                            d'Automatisation
                            <br />
                            des Rendements
                        </h1>

                        <p className="hero-subtitle text-gray-300 text-lg md:text-xl mb-8 max-w-lg">
                            Les rendements crypto ne sont pas faciles à gérer.
                            <br />
                            Mais Cryptoboost vous fait sentir comme s'ils l'étaient.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="bg-lime-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-lime-300 transition-colors">
                                Se connecter
                            </button>
                            <button className="text-gray-300 hover:text-white transition-colors">Lire la Documentation</button>
                        </div>

                        {/* Partner Logos */}
                        <div className="flex items-center space-x-8 mt-12 opacity-60">
                            <div className="text-gray-400 font-semibold">Compound</div>
                            <div className="text-gray-400 font-semibold">dYdX</div>
                            <div className="text-gray-400 font-semibold">AAVE</div>
                        </div>
                    </div>

                    {/* Right Content - 3D Robot and Cards */}
                    <div className="relative flex justify-center items-center min-h-[400px] md:min-h-[500px]">
                        {/* Glowing Sphere Background */}
                        <div className="absolute inset-0 flex justify-center items-center">
                            <div className="w-80 h-80 md:w-96 md:h-96 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl animate-pulse"></div>
                        </div>

                        {/* Robot Character */}
                        <div className="relative z-10 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-b from-gray-300 to-gray-600 rounded-full flex items-center justify-center shadow-2xl">
                            <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-b from-gray-800 to-black rounded-full flex items-center justify-center relative">
                                {/* Robot Eyes */}
                                <div className="flex space-x-4">
                                    <div className="w-4 h-4 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/50"></div>
                                    <div className="w-4 h-4 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/50"></div>
                                </div>

                                {/* Robot Body Details */}
                                <div className="absolute bottom-4 w-8 h-6 bg-gradient-to-b from-gray-600 to-gray-800 rounded"></div>
                            </div>
                        </div>

                        {/* Floating Yield Cards - Desktop */}
                        <div className="hidden md:block">
                            {yieldCards.map((card, index) => (
                                <div
                                    key={index}
                                    className={`absolute bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-xl transform transition-all duration-1000 hover:scale-105 floating-card ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                        }`}
                                    style={{
                                        animationDelay: `${index * 200}ms`,
                                        left: `${50 + Math.cos((index * 72 * Math.PI) / 180) * 120}px`,
                                        top: `${50 + Math.sin((index * 72 * Math.PI) / 180) * 120}px`,
                                    }}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className={`w-8 h-8 ${card.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}
                                        >
                                            {card.icon}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800 text-lg">{card.percentage}</div>
                                            <div className="text-gray-600 text-xs">{card.detail}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Floating Yield Cards - Mobile */}
                        <div className="md:hidden absolute -bottom-20 left-0 right-0 flex flex-wrap justify-center gap-2">
                            {yieldCards.slice(0, 3).map((card, index) => (
                                <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-xl">
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className={`w-6 h-6 ${card.color} rounded-full flex items-center justify-center text-white font-bold text-xs`}
                                        >
                                            {card.icon}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800 text-sm">{card.percentage}</div>
                                            <div className="text-gray-600 text-xs">{card.detail}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="relative z-10 bg-white/5 backdrop-blur-sm mt-16 md:mt-0">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-gray-400 text-sm mb-4">Personnalisé selon votre tolérance au risque</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                Investissements Automatisés et
                                <br />
                                <span className="text-teal-400">Sans Effort</span>
                            </h2>
                        </div>

                        <div className="text-gray-300 text-lg leading-relaxed">
                            <p>
                                Investir dans la crypto peut parfois sembler accablant. Êtes-vous constamment en train de suivre votre
                                portefeuille ? Avec Cryptoboost, c'est du passé. Choisissez simplement un package avec lequel vous êtes
                                à l'aise, et laissez notre puissante automatisation prendre le relais.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Hero
