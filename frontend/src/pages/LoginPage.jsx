"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuthState, useSignInWithEmailAndPassword, useSendPasswordResetEmail } from "react-firebase-hooks/auth"
import { auth } from "../../firebase"
import apiService from "../services/apiService"

export default function LoginPage() {
    const navigate = useNavigate()
    const [user, loading] = useAuthState(auth)
    const [signInWithEmailAndPassword, firebaseUser, firebaseLoading, firebaseError] = useSignInWithEmailAndPassword(auth)
    const [sendPasswordResetEmail, sending, resetError] = useSendPasswordResetEmail(auth)

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    })
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showResetModal, setShowResetModal] = useState(false)
    const [resetEmail, setResetEmail] = useState("")
    const [resetSuccess, setResetSuccess] = useState(false)
    const [resetErrors, setResetErrors] = useState("")

    if (user && !loading) {
        navigate("/dashboard")
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrors({})

        try {
            const firebaseResult = await signInWithEmailAndPassword(formData.email, formData.password)

            if (!firebaseResult?.user) {
                throw new Error("Erreur de connexion Firebase")
            }

            const loginResult = await apiService.loginUser(formData.email, {
                password: formData.password,
                rememberMe: formData.rememberMe,
                userAgent: navigator.userAgent,
                ipAddress: "client-side",
            })

            if (loginResult.success) {
                console.log("User logged in successfully:", formData.email)

                // Clear form
                setFormData({ email: "", password: "", rememberMe: false })

                // Navigate to dashboard
                navigate("/dashboard")
            }
        } catch (error) {
            console.error("Login error:", error)

            if (
                error.message.includes("user-not-found") ||
                error.message.includes("wrong-password") ||
                error.message.includes("invalid-credential")
            ) {
                setErrors({ email: "Email ou mot de passe incorrect." })
            } else if (error.message.includes("too-many-requests")) {
                setErrors({ general: "Trop de tentatives. Veuillez réessayer plus tard." })
            } else {
                setErrors({ general: "Erreur de connexion. Veuillez réessayer." })
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

        // Clear errors when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }))
        }
    }

    const handlePasswordReset = async (e) => {
        e.preventDefault()
        setResetErrors("")

        if (!resetEmail) {
            setResetErrors("Veuillez entrer votre adresse email")
            return
        }

        try {
            await sendPasswordResetEmail(resetEmail)
            setResetSuccess(true)
        } catch (error) {
            console.error("Password reset error:", error)
            setResetErrors("Erreur lors de l'envoi de l'email. Veuillez réessayer.")
        }
    }

    const closeResetModal = () => {
        setShowResetModal(false)
        setResetEmail("")
        setResetSuccess(false)
        setResetErrors("")
    }

    const handleForgotPasswordClick = () => {
        setShowResetModal(true)
        setResetEmail(formData.email) // Pre-fill with login email if available
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50"></div>

                {/* Back button */}
                <Link to="/" className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors z-10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>

                <div className="relative p-6 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Connexion</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Accédez à votre compte Cryptoboost.io</p>
                    </div>

                    {(errors.general || errors.email) && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{errors.general || errors.email}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Adresse email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 sm:py-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-base"
                                placeholder="votre@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 sm:py-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-base"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                />
                                <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleForgotPasswordClick}
                                className="text-sm text-teal-600 hover:text-teal-700 font-medium text-left sm:text-right"
                            >
                                Mot de passe oublié ?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || firebaseLoading}
                            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 sm:py-4 px-4 rounded-lg font-medium hover:from-teal-700 hover:to-emerald-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base"
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
                                    Connexion...
                                </>
                            ) : (
                                "Se connecter"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm sm:text-base">
                            Pas encore de compte ?{" "}
                            <Link to="/register" className="text-teal-600 hover:text-teal-700 font-medium">
                                Créer un compte
                            </Link>
                        </p>
                    </div>

                    {/* Security badge */}
                    <div className="mt-6 flex items-center justify-center text-xs text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                        Connexion sécurisée SSL
                    </div>
                </div>
            </div>

            {/* Password reset modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
                        {/* Background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50"></div>

                        <div className="relative p-6 sm:p-8">
                            {/* Close button */}
                            <button
                                onClick={closeResetModal}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Réinitialiser le mot de passe</h2>
                                <p className="text-gray-600 text-sm">
                                    {resetSuccess
                                        ? "Un email de réinitialisation a été envoyé"
                                        : "Entrez votre email pour recevoir un lien de réinitialisation"}
                                </p>
                            </div>

                            {resetSuccess ? (
                                <div className="text-center">
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-green-600 text-sm">
                                            Un email de réinitialisation a été envoyé à <strong>{resetEmail}</strong>. Vérifiez votre boîte de
                                            réception et suivez les instructions.
                                        </p>
                                    </div>
                                    <button
                                        onClick={closeResetModal}
                                        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-teal-700 hover:to-emerald-700 transition-all duration-200"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {resetErrors && (
                                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-red-600 text-sm">{resetErrors}</p>
                                        </div>
                                    )}

                                    <form onSubmit={handlePasswordReset} className="space-y-6">
                                        <div>
                                            <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                                Adresse email
                                            </label>
                                            <input
                                                type="email"
                                                id="resetEmail"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                required
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                                                placeholder="votre@email.com"
                                            />
                                        </div>

                                        <div className="flex space-x-3">
                                            <button
                                                type="button"
                                                onClick={closeResetModal}
                                                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={sending}
                                                className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                            >
                                                {sending ? (
                                                    <>
                                                        <svg
                                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                                        Envoi...
                                                    </>
                                                ) : (
                                                    "Envoyer"
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
