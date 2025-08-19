"use client"

import { useState, useEffect } from "react"
import Navbar from "../../layouts/Navbar"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../../../firebase"
import CryptoPrices from "./CryptoPrices"

const Hero = () => {
    const [user] = useAuthState(auth);
    const [isVisible, setIsVisible] = useState(false)


    useEffect(() => { setIsVisible(true) }, [])

    const yieldCards = [
        { percentage: "1400%", detail: "+237.42 €/jour", icon: "E", color: "bg-emerald-400" },
        { percentage: "2173%", detail: "+677.32 USDT/jour", icon: "T", color: "bg-teal-400" },
        { percentage: "3123%", detail: "+297.38 DAI/jour", icon: "D", color: "bg-green-400" },
        { percentage: "123%", detail: "+132.91 USDT/jour", icon: "T", color: "bg-emerald-300" },
        { percentage: "4123%", detail: "+537.32 USDT/jour", icon: "T", color: "bg-teal-300" },
    ]
    // console.log(user?.email)
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
            <Navbar />

            {/* Hero Content */}
            <div className="relative z-10 px-4 md:px-8 py-12 md:py-20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div
                        className={`transform transition-all duration-1000 font-mono ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"}`}
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
                                {user?.email ? "Tableau de bord" : "Se connecter"}
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
                    <div className="relative flex justify-center items-center min-h-[500px] md:min-h-[600px] lg:min-h-[650px]">
                        {/* Glowing Sphere Background */}
                        <div className="absolute inset-0 flex justify-center items-center">
                            <div className="w-80 h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px] rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl animate-pulse"></div>
                        </div>

                        {/* Robot Character - Centered */}
                        <div className="relative z-20 w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 bg-gradient-to-b from-gray-300 to-gray-600 rounded-full flex items-center justify-center shadow-2xl">
                            <div className="w-32 h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 bg-gradient-to-b from-gray-800 to-black rounded-full flex items-center justify-center relative">
                                {/* Robot Eyes */}
                                <div className="flex space-x-4">
                                    <div className="w-4 h-4 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/50"></div>
                                    <div className="w-4 h-4 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/50"></div>
                                </div>

                                {/* Robot Body Details */}
                                <div className="absolute bottom-4 w-8 h-6 bg-gradient-to-b from-gray-600 to-gray-800 rounded"></div>
                            </div>
                        </div>

                        {/* Floating Yield Cards - Desktop & Tablet */}
                        <div className="hidden md:block absolute inset-0">
                            {/* Top Cards */}
                            <div
                                className={`absolute top-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-xl transition-all duration-1000 hover:scale-105 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}
                                style={{ animationDelay: "0ms" }}
                            >
                                <div className="flex items-center space-x-2 lg:space-x-3">
                                    <div
                                        className={`w-7 h-7 lg:w-8 lg:h-8 ${yieldCards[0].color} rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-sm`}
                                    >
                                        {yieldCards[0].icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-base lg:text-lg">{yieldCards[0].percentage}</div>
                                        <div className="text-gray-600 text-xs">{yieldCards[0].detail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Top Right Card */}
                            <div
                                className={`absolute top-16 right-4 lg:right-8 bg-white/95 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-xl transition-all duration-1000 hover:scale-105 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}
                                style={{ animationDelay: "200ms" }}
                            >
                                <div className="flex items-center space-x-2 lg:space-x-3">
                                    <div
                                        className={`w-7 h-7 lg:w-8 lg:h-8 ${yieldCards[1].color} rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-sm`}
                                    >
                                        {yieldCards[1].icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-base lg:text-lg">{yieldCards[1].percentage}</div>
                                        <div className="text-gray-600 text-xs">{yieldCards[1].detail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Middle Left Card */}
                            <div
                                className={`absolute top-1/2 left-2 lg:left-4 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-xl transition-all duration-1000 hover:scale-105 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}
                                style={{ animationDelay: "400ms" }}
                            >
                                <div className="flex items-center space-x-2 lg:space-x-3">
                                    <div
                                        className={`w-7 h-7 lg:w-8 lg:h-8 ${yieldCards[2].color} rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-sm`}
                                    >
                                        {yieldCards[2].icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-base lg:text-lg">{yieldCards[2].percentage}</div>
                                        <div className="text-gray-600 text-xs">{yieldCards[2].detail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Left Card */}
                            <div
                                className={`absolute bottom-16 left-8 lg:left-12 bg-white/95 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-xl transition-all duration-1000 hover:scale-105 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                                style={{ animationDelay: "600ms" }}
                            >
                                <div className="flex items-center space-x-2 lg:space-x-3">
                                    <div
                                        className={`w-7 h-7 lg:w-8 lg:h-8 ${yieldCards[3].color} rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-sm`}
                                    >
                                        {yieldCards[3].icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-base lg:text-lg">{yieldCards[3].percentage}</div>
                                        <div className="text-gray-600 text-xs">{yieldCards[3].detail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Right Card */}
                            <div
                                className={`absolute bottom-8 right-12 lg:right-16 bg-white/95 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-xl transition-all duration-1000 hover:scale-105 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                                style={{ animationDelay: "800ms" }}
                            >
                                <div className="flex items-center space-x-2 lg:space-x-3">
                                    <div
                                        className={`w-7 h-7 lg:w-8 lg:h-8 ${yieldCards[4].color} rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-sm`}
                                    >
                                        {yieldCards[4].icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-base lg:text-lg">{yieldCards[4].percentage}</div>
                                        <div className="text-gray-600 text-xs">{yieldCards[4].detail}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Yield Cards - Stacked below robot */}
                        <div className="md:hidden absolute -bottom-24 left-0 right-0 px-4">
                            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                                {yieldCards.slice(0, 4).map((card, index) => (
                                    <div
                                        key={index}
                                        className={`bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                                        style={{ animationDelay: `${index * 150}ms` }}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className={`w-6 h-6 ${card.color} rounded-full flex items-center justify-center text-white font-bold text-xs`}
                                            >
                                                {card.icon}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">{card.percentage}</div>
                                                <div className="text-gray-600 text-xs truncate">{card.detail}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <>
                <CryptoPrices />
            </>

            {/* Bottom Section */}
            <div className="relative z-10 bg-white/5 backdrop-blur-sm mt-24 md:mt-16 lg:mt-0">
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
