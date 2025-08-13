"use client"

import { useState, useEffect } from "react"

const StatsSection = () => {
    const [isVisible, setIsVisible] = useState(false)
    const [counters, setCounters] = useState({
        users: 0,
        invested: 0,
        returns: 0,
        success: 0,
    })

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    // Animate counters
                    const targets = { users: 15420, invested: 2.8, returns: 4.2, success: 94.7 }
                    const duration = 2000
                    const steps = 60
                    const stepTime = duration / steps

                    let step = 0
                    const timer = setInterval(() => {
                        step++
                        const progress = step / steps
                        setCounters({
                            users: Math.floor(targets.users * progress),
                            invested: Math.floor(targets.invested * progress * 10) / 10,
                            returns: Math.floor(targets.returns * progress * 10) / 10,
                            success: Math.floor(targets.success * progress * 10) / 10,
                        })

                        if (step >= steps) {
                            clearInterval(timer)
                            setCounters(targets)
                        }
                    }, stepTime)

                    return () => clearInterval(timer)
                }
            },
            { threshold: 0.3 },
        )

        const element = document.getElementById("stats-section")
        if (element) observer.observe(element)

        return () => observer.disconnect()
    }, [])

    const stats = [
        {
            number: counters.users.toLocaleString(),
            suffix: "+",
            label: "Investisseurs Actifs",
            description: "Font confiance à notre plateforme",
            icon: "👥",
            color: "from-blue-400 to-cyan-500",
        },
        {
            number: counters.invested.toFixed(1),
            suffix: "M€",
            label: "Volume Investi",
            description: "Depuis le lancement de la plateforme",
            icon: "💰",
            color: "from-emerald-400 to-teal-500",
        },
        {
            number: counters.returns.toFixed(1),
            suffix: "M€",
            label: "Rendements Générés",
            description: "Pour nos investisseurs",
            icon: "📈",
            color: "from-lime-400 to-green-500",
        },
        {
            number: counters.success.toFixed(1),
            suffix: "%",
            label: "Taux de Réussite",
            description: "Sessions de trading profitables",
            icon: "🎯",
            color: "from-orange-400 to-red-500",
        },
    ]

    return (
        <div id="stats-section" className="bg-white py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Des Résultats qui
                        <span className="text-teal-600"> Parlent d'Eux-Mêmes</span>
                    </h2>
                    <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto">
                        Rejoignez des milliers d'investisseurs qui ont déjà fait confiance à notre technologie de trading automatisé
                        pour maximiser leurs rendements crypto.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className={`text-center transform transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                }`}
                            style={{ animationDelay: `${index * 200}ms` }}
                        >
                            <div className="relative group">
                                {/* Icon */}
                                <div
                                    className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center text-3xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
                                >
                                    {stat.icon}
                                </div>

                                {/* Number */}
                                <div className="mb-2">
                                    <span className="text-4xl md:text-5xl font-bold text-gray-900">{stat.number}</span>
                                    <span className="text-2xl md:text-3xl font-bold text-teal-600">{stat.suffix}</span>
                                </div>

                                {/* Label */}
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{stat.label}</h3>
                                <p className="text-gray-600 text-sm">{stat.description}</p>

                                {/* Hover Effect */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500/0 to-emerald-500/0 group-hover:from-teal-500/5 group-hover:to-emerald-500/5 transition-all duration-300 -z-10"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trust Indicators */}
                <div className="mt-16 pt-16 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Sécurité Maximale</h4>
                            <p className="text-gray-600 text-sm">Fonds protégés par cryptographie avancée</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">⚡</span>
                                </div>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Exécution Rapide</h4>
                            <p className="text-gray-600 text-sm">Transactions traitées en moins de 3 secondes</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">🛡️</span>
                                </div>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Support 24/7</h4>
                            <p className="text-gray-600 text-sm">Équipe d'experts disponible en permanence</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StatsSection
