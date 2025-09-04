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
            avatar: "MD",
            rating: 5,
            text: "J'ai investi 500€ et récupéré 7,800€ en seulement 3 heures ! L'interface est intuitive et les résultats dépassent mes attentes. Je recommande vivement Cryptoboost.io.",
            package: "Package Premium",
            return: "+1,460%",
            verified: true,
            blockchain: "ETH",
            date: "Il y a 2 jours",
        },
        {
            name: "Jean-Pierre Martin",
            role: "Trader Crypto",
            location: "Lyon, France",
            avatar: "JM",
            rating: 5,
            text: "Après avoir testé plusieurs plateformes, Cryptoboost.io se démarque par sa transparence et ses performances. Le trading automatisé fonctionne parfaitement.",
            package: "Package Elite",
            return: "+1,127%",
            verified: true,
            blockchain: "SOL",
            date: "Il y a 1 semaine",
        },
        {
            name: "Sophie Laurent",
            role: "Analyste Blockchain",
            location: "Marseille, France",
            avatar: "SL",
            rating: 5,
            text: "En tant que professionnelle de la finance, j'apprécie la rigueur technique de cette plateforme. Les algorithmes sont sophistiqués et les résultats constants.",
            package: "Package Starter",
            return: "+1,900%",
            verified: true,
            blockchain: "BTC",
            date: "Il y a 3 jours",
        },
    ]

    return (
        <div
            id="testimonials-section"
            className="relative bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 py-16 md:py-24"
        >
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center">
                                <span className="text-4xl font-bold text-white mr-2">4.9</span>
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className="w-8 h-8 text-green-400 fill-current" viewBox="0 0 20 20">
                                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                        </svg>
                                    ))}
                                </div>
                            </div>
                            <div className="text-left">
                                <div className="text-2xl font-bold text-white">Excellent</div>
                                <div className="text-gray-300">Basé sur 15,247 avis</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-6 h-6 text-green-400 fill-current" viewBox="0 0 20 20">
                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                    </svg>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                    <rect width="24" height="24" rx="4" fill="#00B67A" />
                                    <path
                                        d="M12 2L14.09 8.26L20 8.26L15.45 11.97L17.54 18.23L12 14.52L6.46 18.23L8.55 11.97L4 8.26L9.91 8.26L12 2Z"
                                        fill="white"
                                    />
                                </svg>
                                <span className="text-green-400 font-bold text-lg">Trustpilot</span>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ce que Disent nos Investisseurs</h2>
                    <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Découvrez les témoignages authentiques de nos utilisateurs qui ont transformé leurs investissements grâce à
                        notre plateforme.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                }`}
                            style={{ animationDelay: `${index * 200}ms` }}
                        >
                            <div className="flex items-center mb-4">
                                <div className="flex mr-2">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <svg key={i} className="w-5 h-5 text-green-400 fill-current" viewBox="0 0 20 20">
                                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="text-sm text-gray-300">{testimonial.date}</span>
                            </div>

                            <p className="text-white mb-6 leading-relaxed">{testimonial.text}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/20">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-teal-500/30 border border-teal-400/50 rounded-full flex items-center justify-center text-sm font-semibold text-white mr-3">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                                        <div className="text-gray-300 text-xs">{testimonial.location}</div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-xs text-gray-300">{testimonial.package}</div>
                                    <div className="text-sm font-semibold text-green-400">{testimonial.return}</div>
                                </div>
                            </div>

                            {testimonial.verified && (
                                <div className="flex items-center mt-3 pt-3 border-t border-white/20">
                                    <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-xs text-gray-300">Avis vérifié • {testimonial.blockchain}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center mt-16">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 md:p-12">
                        <div className="flex items-center justify-center mb-6">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-6 h-6 text-green-400 fill-current" viewBox="0 0 20 20">
                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="ml-2 text-green-400 font-semibold">Noté Excellent sur Trustpilot</span>
                        </div>

                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Rejoignez 15,000+ Investisseurs Satisfaits
                        </h3>
                        <p className="text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                            Commencez votre parcours d'investissement dès aujourd'hui et découvrez pourquoi tant d'investisseurs nous
                            font confiance.
                        </p>

                        <button className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
                            Commencer Maintenant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TestimonialsSection
