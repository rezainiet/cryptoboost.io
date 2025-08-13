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
            role: "Investisseuse Particulière",
            location: "Paris, France",
            avatar: "👩‍💼",
            rating: 5,
            text: "J'ai investi 500€ et récupéré 7,800€ en seulement 3 heures ! L'interface est intuitive et les résultats dépassent mes attentes. Je recommande vivement Cryptoboost.io.",
            package: "Package Premium",
            return: "+1,460%",
        },
        {
            name: "Jean-Pierre Martin",
            role: "Entrepreneur",
            location: "Lyon, France",
            avatar: "👨‍💻",
            rating: 5,
            text: "Après avoir testé plusieurs plateformes, Cryptoboost.io se démarque par sa transparence et ses performances. Le trading automatisé fonctionne parfaitement.",
            package: "Package Elite",
            return: "+1,127%",
        },
        {
            name: "Sophie Laurent",
            role: "Consultante Financière",
            location: "Marseille, France",
            avatar: "👩‍🎓",
            rating: 5,
            text: "En tant que professionnelle de la finance, j'apprécie la rigueur technique de cette plateforme. Les algorithmes sont sophistiqués et les résultats constants.",
            package: "Package Starter",
            return: "+1,900%",
        },
    ]

    return (
        <div id="testimonials-section" className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Ce que Disent nos
                        <span className="text-teal-600"> Investisseurs</span>
                    </h2>
                    <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto">
                        Découvrez les témoignages authentiques de nos utilisateurs qui ont transformé leurs investissements grâce à
                        notre technologie de trading automatisé.
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className={`bg-white rounded-2xl shadow-xl p-6 md:p-8 transform transition-all duration-700 hover:scale-105 hover:shadow-2xl ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                }`}
                            style={{ animationDelay: `${index * 200}ms` }}
                        >
                            {/* Header */}
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-2xl mr-4">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                                    <p className="text-gray-500 text-xs">{testimonial.location}</p>
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <span key={i} className="text-yellow-400 text-lg">
                                        ⭐
                                    </span>
                                ))}
                            </div>

                            {/* Testimonial Text */}
                            <blockquote className="text-gray-700 mb-6 leading-relaxed">"{testimonial.text}"</blockquote>

                            {/* Package Info */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600">Package utilisé</p>
                                        <p className="font-semibold text-gray-900">{testimonial.package}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Rendement</p>
                                        <p className="font-bold text-teal-600 text-lg">{testimonial.return}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16">
                    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Rejoignez Plus de 15,000+ Investisseurs</h3>
                        <p className="text-gray-600 mb-6">
                            Commencez votre parcours d'investissement automatisé dès aujourd'hui et découvrez pourquoi tant
                            d'investisseurs nous font confiance.
                        </p>
                        <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300 transform hover:scale-105">
                            Commencer Maintenant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TestimonialsSection
