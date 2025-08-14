"use client"

import { useState, useEffect } from "react"

const TestimonialsSection = () => {
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

        const element = document.getElementById("testimonials-section")
        if (element) observer.observe(element)

        return () => observer.disconnect()
    }, [])

    const testimonials = [
        {
            name: "Marie Dubois",
            role: "Investisseuse DeFi",
            location: "Paris, France",
            avatar: "🔷",
            rating: 5,
            text: "J'ai investi 500€ et récupéré 7,800€ en seulement 3 heures ! L'interface est intuitive et les résultats dépassent mes attentes. Je recommande vivement Cryptoboost.io.",
            package: "Package Premium",
            return: "+1,460%",
            verified: true,
            blockchain: "ETH",
        },
        {
            name: "Jean-Pierre Martin",
            role: "Trader Crypto",
            location: "Lyon, France",
            avatar: "⬡",
            rating: 5,
            text: "Après avoir testé plusieurs plateformes, Cryptoboost.io se démarque par sa transparence et ses performances. Le trading automatisé fonctionne parfaitement.",
            package: "Package Elite",
            return: "+1,127%",
            verified: true,
            blockchain: "SOL",
        },
        {
            name: "Sophie Laurent",
            role: "Analyste Blockchain",
            location: "Marseille, France",
            avatar: "◈",
            rating: 5,
            text: "En tant que professionnelle de la finance, j'apprécie la rigueur technique de cette plateforme. Les algorithmes sont sophistiqués et les résultats constants.",
            package: "Package Starter",
            return: "+1,900%",
            verified: true,
            blockchain: "BTC",
        },
    ]

    return (
        <div
            id="testimonials-section"
            className="relative bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 py-16 md:py-24 overflow-hidden"
        >
            <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>

                {/* Floating particles */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-teal-400 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                    ></div>
                ))}
            </div>

            <div className="relative max-w-7xl mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-sm border border-cyan-500/30 rounded-full px-6 py-2 mb-6">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                        <span className="text-cyan-300 text-sm font-mono">TESTIMONIALS_VERIFIED</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-6 font-mono">
                        Ce que Disent nos
                        <br />
                        <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                            Investisseurs DeFi
                        </span>
                    </h2>
                    <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Découvrez les témoignages authentiques de nos utilisateurs qui ont transformé leurs investissements grâce à
                        notre technologie de trading automatisé décentralisée.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className={`group relative bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 md:p-8 transform transition-all duration-700 hover:scale-105 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                }`}
                            style={{ animationDelay: `${index * 200}ms` }}
                        >
                            {/* Glowing border effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-orange-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>

                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="relative w-14 h-14 bg-gradient-to-br from-cyan-500 via-purple-500 to-orange-500 rounded-full flex items-center justify-center text-2xl mr-4 shadow-lg shadow-cyan-500/30">
                                        <span className="text-white font-bold">{testimonial.avatar}</span>
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                                            <span className="text-xs">✓</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white font-mono">{testimonial.name}</h4>
                                        <p className="text-cyan-300 text-sm">{testimonial.role}</p>
                                        <p className="text-gray-400 text-xs">{testimonial.location}</p>
                                    </div>
                                </div>

                                {/* Blockchain badge */}
                                <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-3 py-1">
                                    <span className="text-cyan-300 text-xs font-mono">{testimonial.blockchain}</span>
                                </div>
                            </div>

                            <div className="flex items-center mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <span key={i} className="text-orange-400 text-lg drop-shadow-lg filter drop-shadow-orange-500/50">
                                        ★
                                    </span>
                                ))}
                                <span className="ml-2 text-green-400 text-sm font-mono">VERIFIED</span>
                            </div>

                            <blockquote className="text-gray-200 mb-6 leading-relaxed font-light">
                                <span className="text-cyan-400 text-2xl font-mono">"</span>
                                {testimonial.text}
                                <span className="text-cyan-400 text-2xl font-mono">"</span>
                            </blockquote>

                            <div className="border-t border-gray-700/50 pt-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-gray-400 text-sm font-mono">PACKAGE_USED</p>
                                        <p className="font-semibold text-white">{testimonial.package}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-400 text-sm font-mono">ROI_ACHIEVED</p>
                                        <p className="font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent text-xl font-mono">
                                            {testimonial.return}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-16">
                    <div className="relative bg-gradient-to-br from-gray-800/60 via-gray-900/60 to-black/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 md:p-12 overflow-hidden">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-orange-500/10 rounded-3xl blur-xl"></div>

                        <div className="relative">
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-cyan-500/20 backdrop-blur-sm border border-green-500/30 rounded-full px-4 py-2 mb-6">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span className="text-green-300 text-sm font-mono">15,000+ ACTIVE_TRADERS</span>
                            </div>

                            <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-4 font-mono">
                                Rejoignez la Révolution DeFi
                            </h3>
                            <p className="text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                                Commencez votre parcours d'investissement automatisé décentralisé dès aujourd'hui et découvrez pourquoi
                                tant d'investisseurs nous font confiance dans l'écosystème Web3.
                            </p>

                            <button className="group relative bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 text-white font-semibold py-4 px-10 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30 font-mono">
                                <span className="relative z-10">COMMENCER_MAINTENANT</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-orange-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TestimonialsSection
