"use client"

import { useState, useEffect } from "react"

const FeaturesSection = () => {
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

        const element = document.getElementById("features-section")
        if (element) observer.observe(element)

        return () => observer.disconnect()
    }, [])

    const features = [
        {
            icon: "🧩",
            title: "Intégration Facile",
            description:
                "Pas besoin de connecter des protocoles disparates ou de passer des mois à intégrer et mettre à jour les fonctionnalités de rendement.",
            gradient: "from-orange-400 to-red-500",
        },
        {
            icon: "⚡",
            title: "Protocole en Amélioration Rapide",
            description:
                "Cryptoboost DAO et les Ligues publient des centaines de fonctionnalités et d'améliorations chaque année pour vous aider à rester en avance sur les évolutions du secteur.",
            gradient: "from-teal-400 to-cyan-500",
        },
        {
            icon: "🛡️",
            title: "Fiabilité Éprouvée",
            description:
                "Cryptoboost DAO a investi des efforts considérables pour créer un protocole ouvert et vérifiable que nous croyons sûr, évolutif et redondant.",
            gradient: "from-blue-400 to-indigo-500",
        },
        {
            icon: "📊",
            title: "Analyses Avancées",
            description:
                "Surveillez vos investissements avec des tableaux de bord en temps réel et des analyses détaillées de performance pour optimiser vos stratégies.",
            gradient: "from-emerald-400 to-teal-500",
        },
        {
            icon: "⚙️",
            title: "Automatisation Intelligente",
            description:
                "Notre IA de trading fonctionne 24/7, analysant les marchés et exécutant des transactions optimales sans intervention humaine.",
            gradient: "from-purple-400 to-pink-500",
        },
        {
            icon: "🔍",
            title: "Transparence Totale",
            description:
                "Accédez à tous les détails de vos transactions, stratégies utilisées et performances historiques avec une transparence complète.",
            gradient: "from-yellow-400 to-orange-500",
        },
    ]

    return (
        <div
            id="features-section"
            className="bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 py-16 md:py-24 relative overflow-hidden"
        >
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-16">
                    <div className="lg:max-w-2xl">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                            Une intégration
                            <br />
                            pour les gouverner
                            <br />
                            toutes
                        </h2>
                    </div>
                    <div className="lg:max-w-xs lg:mt-8">
                        <p className="text-gray-300 text-lg">
                            Personnalisé selon
                            <br />
                            votre tolérance au risque
                        </p>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 transform transition-all duration-700 hover:scale-105 hover:bg-white/10 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                }`}
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            {/* Gradient Border Effect */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300`}
                            ></div>

                            {/* Icon */}
                            <div className="relative z-10 mb-6">
                                <div
                                    className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
                                >
                                    {feature.icon}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-4 group-hover:text-lime-400 transition-colors duration-300">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-300 leading-relaxed text-sm md:text-base">{feature.description}</p>
                            </div>

                            {/* Hover Glow Effect */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500/0 via-emerald-500/0 to-teal-500/0 group-hover:from-teal-500/5 group-hover:via-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-500"></div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16">
                    <div className="inline-flex items-center space-x-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-8 py-4">
                        <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                            <div
                                className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
                                style={{ animationDelay: "0.4s" }}
                            ></div>
                        </div>
                        <span className="text-gray-300 text-sm">Système de trading automatisé actif 24/7</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FeaturesSection
