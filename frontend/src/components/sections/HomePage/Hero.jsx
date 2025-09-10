"use client"

import { useState, useEffect } from "react"
import Navbar from "../../layouts/Navbar"
import { useAuthState } from "react-firebase-hooks/auth"
import CryptoPrices from "./CryptoPrices"
import { auth } from "../../../../firebase"
import { Link } from "react-router-dom"

const Hero = () => {
    const [user] = useAuthState(auth)
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
                        className={`transform transition-all duration-1000 font-mono ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"}`}
                    >
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                            Le Protocole
                            <br />
                            d'Automatisation
                            <br />
                            des Rendements
                        </h1>

                        <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-lg">
                            Les rendements crypto ne sont pas faciles à gérer.
                            <br />
                            Mais Cryptoboost vous fait sentir comme s'ils l'étaient.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="bg-lime-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-lime-300 transition-colors">
                                <Link to={"/dashboard"}>
                                    {user?.email ? "Tableau de bord" : "Se connecter"}
                                </Link>
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

                    {/* Right Content - Self-contained Professional Robot */}
                    <div className="relative flex justify-center items-center min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
                        <div
                            className="absolute inset-0 flex justify-center items-center"
                            style={{
                                animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                            }}
                        >
                            <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-r from-teal-500/10 to-emerald-500/10 blur-2xl"></div>
                        </div>

                        <div className="relative z-20 group">
                            {/* Robot Container */}
                            <div
                                className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-gradient-to-b from-slate-100 to-slate-300 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-700 hover:scale-105"
                                style={{
                                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                                }}
                            >
                                {/* Robot Screen/Face */}
                                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                                    <div
                                        className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-emerald-400 rounded-full mb-2 shadow-lg"
                                        style={{
                                            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                                            boxShadow: "0 0 20px rgba(52, 211, 153, 0.5)",
                                        }}
                                    ></div>

                                    {/* Simple Display Lines */}
                                    <div className="space-y-1">
                                        <div className="w-6 h-0.5 sm:w-8 sm:h-0.5 md:w-10 md:h-0.5 bg-teal-400/60 rounded-full"></div>
                                        <div className="w-4 h-0.5 sm:w-6 sm:h-0.5 md:w-8 md:h-0.5 bg-teal-400/40 rounded-full"></div>
                                        <div className="w-5 h-0.5 sm:w-7 sm:h-0.5 md:w-9 md:h-0.5 bg-teal-400/30 rounded-full"></div>
                                    </div>

                                    <div
                                        className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/5 to-transparent h-0.5"
                                        style={{
                                            animation: "pulse 3s ease-in-out infinite",
                                        }}
                                    ></div>
                                </div>

                                {/* Simple Base */}
                                <div className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-3 sm:w-10 sm:h-4 md:w-12 md:h-5 bg-gradient-to-b from-slate-200 to-slate-400 rounded-lg shadow-lg">
                                    <div
                                        className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-400 rounded-full"
                                        style={{
                                            animation: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop & Tablet Cards - More organized positioning */}
                        <div className="hidden md:block absolute inset-0">
                            {/* Top Card */}
                            <div
                                className={`absolute top-4 lg:top-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-lg transition-all duration-1000 hover:scale-105 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className={`w-8 h-8 ${yieldCards[0].color} rounded-full flex items-center justify-center text-white font-bold text-sm`}
                                    >
                                        {yieldCards[0].icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-lg">{yieldCards[0].percentage}</div>
                                        <div className="text-gray-600 text-xs">{yieldCards[0].detail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Left Card */}
                            <div
                                className={`absolute top-1/2 left-2 lg:left-8 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-lg transition-all duration-1000 hover:scale-105 ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"}`}
                                style={{ transitionDelay: "200ms" }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className={`w-8 h-8 ${yieldCards[1].color} rounded-full flex items-center justify-center text-white font-bold text-sm`}
                                    >
                                        {yieldCards[1].icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-lg">{yieldCards[1].percentage}</div>
                                        <div className="text-gray-600 text-xs">{yieldCards[1].detail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Card */}
                            <div
                                className={`absolute top-1/2 right-2 lg:right-8 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-lg transition-all duration-1000 hover:scale-105 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}`}
                                style={{ transitionDelay: "400ms" }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className={`w-8 h-8 ${yieldCards[2].color} rounded-full flex items-center justify-center text-white font-bold text-sm`}
                                    >
                                        {yieldCards[2].icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-lg">{yieldCards[2].percentage}</div>
                                        <div className="text-gray-600 text-xs">{yieldCards[2].detail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Card */}
                            <div
                                className={`absolute bottom-4 lg:bottom-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-lg transition-all duration-1000 hover:scale-105 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                                style={{ transitionDelay: "600ms" }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className={`w-8 h-8 ${yieldCards[3].color} rounded-full flex items-center justify-center text-white font-bold text-sm`}
                                    >
                                        {yieldCards[3].icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-lg">{yieldCards[3].percentage}</div>
                                        <div className="text-gray-600 text-xs">{yieldCards[3].detail}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:hidden absolute -bottom-12 sm:-bottom-16 left-0 right-0 px-4">
                            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                                {yieldCards.slice(0, 4).map((card, index) => (
                                    <div
                                        key={index}
                                        className={`bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                                        style={{ transitionDelay: `${index * 150}ms` }}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className={`w-6 h-6 ${card.color} rounded-full flex items-center justify-center text-white font-bold text-xs`}
                                            >
                                                {card.icon}
                                            </div>
                                            <div className="min-w-0 flex-1">
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
