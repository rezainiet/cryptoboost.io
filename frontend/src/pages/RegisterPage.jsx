"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuthState, useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth"
import { auth } from "../../firebase"
import apiService from "../services/apiService"

export default function RegisterPage() {
    const navigate = useNavigate()
    const [user, loading] = useAuthState(auth)
    const [createUserWithEmailAndPassword, firebaseUser, firebaseLoading, firebaseError] =
        useCreateUserWithEmailAndPassword(auth)

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
        acceptMarketing: false,
    })
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] })

    if (user && !loading) {
        navigate("/dashboard")
        return null
    }

    const checkPasswordStrength = (password) => {
        const feedback = []
        let score = 0

        if (password.length >= 8) score += 1
        else feedback.push("Au moins 8 caractères")

        if (/[A-Z]/.test(password)) score += 1
        else feedback.push("Une lettre majuscule")

        if (/[a-z]/.test(password)) score += 1
        else feedback.push("Une lettre minuscule")

        if (/\d/.test(password)) score += 1
        else feedback.push("Un chiffre")

        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
        else feedback.push("Un caractère spécial")

        return { score, feedback }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.firstName.trim()) {
            newErrors.firstName = "Le prénom est requis"
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = "Le nom est requis"
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Le numéro de téléphone est requis"
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Les mots de passe ne correspondent pas"
        }

        if (passwordStrength.score < 3) {
            newErrors.password = "Le mot de passe doit être plus fort"
        }

        if (!formData.acceptTerms) {
            newErrors.acceptTerms = "Vous devez accepter les conditions d'utilisation"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsSubmitting(true)

        try {
            const firebaseResult = await createUserWithEmailAndPassword(formData.email, formData.password)

            if (!firebaseResult?.user) {
                throw new Error("Erreur lors de la création du compte Firebase")
            }

            try {
                const userData = {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                }

                const result = await apiService.registerUser(userData)
                await apiService.logUserActivity(formData.email, "registration", {
                    source: "web",
                    userAgent: navigator.userAgent,
                })

                if (result.success) {
                    console.log("User registered successfully:", result)

                    // Clear form
                    setFormData({
                        firstName: "",
                        lastName: "",
                        email: "",
                        phone: "",
                        password: "",
                        confirmPassword: "",
                        acceptTerms: false,
                        acceptMarketing: false,
                    })

                    navigate("/dashboard")
                }
            } catch (backendError) {
                console.error("Backend registration failed, cleaning up Firebase user:", backendError)

                if (firebaseResult?.user) {
                    await firebaseResult.user.delete()
                }

                throw backendError
            }
        } catch (error) {
            console.error("Registration error:", error)

            if (error.message.includes("already exists") || error.message.includes("email-already-in-use")) {
                setErrors({ email: "Un compte existe déjà avec cette adresse email" })
            } else if (error.message.includes("weak-password")) {
                setErrors({ password: "Le mot de passe est trop faible" })
            } else {
                setErrors({ general: "Erreur lors de l'inscription. Veuillez réessayer." })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))

        if (name === "password") {
            setPasswordStrength(checkPasswordStrength(value))
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }))
        }
    }

    const PasswordStrengthIndicator = () => {
        if (!formData.password) return null

        const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"]
        const strengthLabels = ["Très faible", "Faible", "Moyen", "Fort", "Très fort"]

        return (
            <div className="mt-2">
                <div className="flex space-x-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 flex-1 rounded ${i < passwordStrength.score ? strengthColors[passwordStrength.score - 1] : "bg-gray-200"
                                }`}
                        />
                    ))}
                </div>
                <p className="text-xs text-gray-600">Force: {strengthLabels[passwordStrength.score] || "Très faible"}</p>
                {passwordStrength.feedback.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Manque: {passwordStrength.feedback.join(", ")}</p>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"></div>

                {/* Back button */}
                <Link to="/" className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors z-10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>

                <div className="relative p-6 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Rejoignez Cryptoboost.io et commencez à investir</p>
                    </div>

                    {errors.general && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{errors.general}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Prénom *
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-4 py-3 sm:py-4 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-base ${errors.firstName ? "border-red-300" : "border-gray-200"
                                        }`}
                                    placeholder="Jean"
                                />
                                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom *
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-4 py-3 sm:py-4 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-base ${errors.lastName ? "border-red-300" : "border-gray-200"
                                        }`}
                                    placeholder="Dupont"
                                />
                                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Adresse email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 sm:py-4 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-base ${errors.email ? "border-red-300" : "border-gray-200"
                                    }`}
                                placeholder="jean.dupont@email.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Numéro de téléphone *
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 sm:py-4 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-base ${errors.phone ? "border-red-300" : "border-gray-200"
                                    }`}
                                placeholder="+33 6 12 34 56 78"
                            />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Mot de passe *
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 sm:py-4 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-base ${errors.password ? "border-red-300" : "border-gray-200"
                                    }`}
                                placeholder="••••••••"
                            />
                            <PasswordStrengthIndicator />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmer le mot de passe *
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 sm:py-4 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-base ${errors.confirmPassword ? "border-red-300" : "border-gray-200"
                                    }`}
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    name="acceptTerms"
                                    checked={formData.acceptTerms}
                                    onChange={handleChange}
                                    className={`w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5 ${errors.acceptTerms ? "border-red-300" : ""
                                        }`}
                                />
                                <span className="text-sm text-gray-600 leading-relaxed">
                                    J'accepte les{" "}
                                    <button type="button" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                        conditions d'utilisation
                                    </button>{" "}
                                    et la{" "}
                                    <button type="button" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                        politique de confidentialité
                                    </button>
                                </span>
                            </label>
                            {errors.acceptTerms && <p className="text-red-500 text-xs">{errors.acceptTerms}</p>}

                            <label className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    name="acceptMarketing"
                                    checked={formData.acceptMarketing}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5"
                                />
                                <span className="text-sm text-gray-600 leading-relaxed">
                                    Je souhaite recevoir des informations sur les nouveaux packages d'investissement
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || firebaseLoading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 sm:py-4 px-4 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base"
                        >
                            {isSubmitting || firebaseLoading ? (
                                <>
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
                                    Création du compte...
                                </>
                            ) : (
                                "Créer mon compte"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm sm:text-base">
                            Déjà un compte ?{" "}
                            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                Se connecter
                            </Link>
                        </p>
                    </div>

                    {/* Security badges */}
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                            SSL sécurisé
                        </div>
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </svg>
                            Données protégées
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
