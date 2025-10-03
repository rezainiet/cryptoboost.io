"use client"

import { useState } from "react"
import { motion } from "framer-motion"

export default function ContactForm() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        investmentAmount: "",
        preferredCrypto: "",
        consent: false,
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [errors, setErrors] = useState({})

    const investmentOptions = [
        { value: "500-1000", label: "500€ – 1000€" },
        { value: "1000-2500", label: "1000€ – 2500€" },
        { value: "2500+", label: "Plus de 2500€" },
    ]

    const cryptoOptions = [
        { value: "SOL", label: "Solana (SOL)" },
        { value: "ETH", label: "Ethereum (ETH)" },
        { value: "USDT", label: "Tether (USDT)" },
        { value: "USDC", label: "USD Coin (USDC)" },
    ]

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }))
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.firstName.trim()) newErrors.firstName = "Le prénom est requis"
        if (!formData.lastName.trim()) newErrors.lastName = "Le nom est requis"
        if (!formData.email.trim()) {
            newErrors.email = "L'email est requis"
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Format d'email invalide"
        }
        if (!formData.phone.trim()) newErrors.phone = "Le numéro de téléphone est requis"
        if (!formData.investmentAmount) newErrors.investmentAmount = "Veuillez sélectionner un montant"
        if (!formData.preferredCrypto) newErrors.preferredCrypto = "Veuillez sélectionner une crypto"
        if (!formData.consent) newErrors.consent = "Vous devez accepter d'être contacté"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsSubmitting(true)

        try {
            const response = await fetch("https://cryptoboost-io.onrender.com/api/contact-form/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                setIsSubmitted(true)
            } else {
                throw new Error("Erreur lors de l'envoi")
            }
        } catch (error) {
            console.error("Erreur:", error)
            setErrors({ submit: "Une erreur est survenue. Veuillez réessayer." })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 min-h-screen relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-12">

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Demande Envoyée !</h1>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
                            <p className="text-xl text-gray-300 mb-4">Merci ! Votre demande a bien été enregistrée.</p>
                            <p className="text-lg text-gray-400">
                                Un conseiller vous contactera sous 24h pour vous accompagner dans votre investissement.
                            </p>
                        </div>

                        <div className="text-center text-sm text-gray-400">
                            100% gratuit – Sans engagement – Vos informations sont protégées
                        </div>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div id="contact-form" className="bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 min-h-screen relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Conseiller</h1>
                    <p className="text-gray-300 text-lg">Être accompagné par un expert CryptoBoost</p>
                </div>

                {/* Warning Banner */}
                <div className="mb-8 p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-500/20 rounded-2xl">
                    <div className="flex items-start">
                        <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Être rappelé par un conseiller</h3>
                            <p className="text-gray-200">
                                L'accompagnement par un conseiller nécessite un <strong>dépôt minimum de 500 €</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                                    Prénom *
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Votre prénom"
                                />
                                {errors.firstName && <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>}
                            </div>

                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                                    Nom *
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Votre nom"
                                />
                                {errors.lastName && <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Adresse e-mail *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="votre@email.com"
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                                Numéro de téléphone / WhatsApp *
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="+33 6 12 34 56 78"
                            />
                            {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
                        </div>

                        {/* Investment Amount */}
                        <div>
                            <label htmlFor="investmentAmount" className="block text-sm font-medium text-gray-300 mb-2">
                                Montant envisagé à investir *
                            </label>
                            <select
                                id="investmentAmount"
                                name="investmentAmount"
                                value={formData.investmentAmount}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="" className="bg-slate-800">
                                    Sélectionnez un montant
                                </option>
                                {investmentOptions.map((option) => (
                                    <option key={option.value} value={option.value} className="bg-slate-800">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.investmentAmount && <p className="mt-1 text-sm text-red-400">{errors.investmentAmount}</p>}
                        </div>

                        {/* Preferred Crypto */}
                        <div>
                            <label htmlFor="preferredCrypto" className="block text-sm font-medium text-gray-300 mb-2">
                                Crypto préférée pour le dépôt *
                            </label>
                            <select
                                id="preferredCrypto"
                                name="preferredCrypto"
                                value={formData.preferredCrypto}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="" className="bg-slate-800">
                                    Sélectionnez une crypto
                                </option>
                                {cryptoOptions.map((option) => (
                                    <option key={option.value} value={option.value} className="bg-slate-800">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.preferredCrypto && <p className="mt-1 text-sm text-red-400">{errors.preferredCrypto}</p>}
                        </div>

                        {/* Consent Checkbox */}
                        <div>
                            <label className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    name="consent"
                                    checked={formData.consent}
                                    onChange={handleInputChange}
                                    className="mt-1 w-4 h-4 text-teal-500 bg-white/10 border-white/20 rounded focus:ring-teal-500 focus:ring-2"
                                />
                                <span className="text-sm text-gray-300">
                                    J'accepte d'être contacté par un conseiller CryptoBoost pour en savoir plus sur les packs
                                    d'investissement. *
                                </span>
                            </label>
                            {errors.consent && <p className="mt-1 text-sm text-red-400">{errors.consent}</p>}
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Envoi en cours...
                                    </div>
                                ) : (
                                    "Être rappelé par un conseiller"
                                )}
                            </button>
                            {errors.submit && <p className="mt-2 text-sm text-red-400">{errors.submit}</p>}
                        </div>
                    </form>
                </div>

                {/* Reassuring Text */}
                <div className="text-center mt-8">
                    <p className="text-sm text-gray-400">100% gratuit – Sans engagement – Vos informations sont protégées</p>
                </div>
            </div>
        </div>
    )
}
