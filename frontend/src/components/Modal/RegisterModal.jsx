"use client"

import { useState } from "react"
import { useCreateUserWithEmailAndPassword, useUpdateProfile } from "react-firebase-hooks/auth"
import { auth } from "../../../firebase"

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
        acceptMarketing: false,
    })
    const [errors, setErrors] = useState({})

    const [createUserWithEmailAndPassword, user, loading, error] = useCreateUserWithEmailAndPassword(auth)
    const [updateProfile, updating, updateError] = useUpdateProfile(auth)

    const validateForm = () => {
        const newErrors = {}

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Les mots de passe ne correspondent pas"
        }

        if (formData.password.length < 8) {
            newErrors.password = "Le mot de passe doit contenir au moins 8 caractères"
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

        const result = await createUserWithEmailAndPassword(formData.email, formData.password)

        if (result) {
            await updateProfile({
                displayName: `${formData.firstName} ${formData.lastName}`,
            })

            onClose()
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                password: "",
                confirmPassword: "",
                acceptTerms: false,
                acceptMarketing: false,
            })
        }
    }

    const handleChange = (e) => {
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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"></div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="relative p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Créer un compte</h2>
                        <p className="text-gray-600">Rejoignez Cryptoboost.io et commencez à investir</p>
                    </div>

                    {(error || updateError) && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">
                                {error?.code === "auth/email-already-in-use"
                                    ? "Cette adresse email est déjà utilisée."
                                    : error?.code === "auth/weak-password"
                                        ? "Le mot de passe est trop faible."
                                        : error?.code === "auth/invalid-email"
                                            ? "Adresse email invalide."
                                            : "Erreur lors de la création du compte. Veuillez réessayer."}
                            </p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Prénom
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                                    placeholder="Jean"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                                    placeholder="Dupont"
                                />
                            </div>
                        </div>

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
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                                placeholder="jean.dupont@email.com"
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
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm ${errors.password ? "border-red-300" : "border-gray-200"
                                    }`}
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmer le mot de passe
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm ${errors.confirmPassword ? "border-red-300" : "border-gray-200"
                                    }`}
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-start">
                                <input
                                    type="checkbox"
                                    name="acceptTerms"
                                    checked={formData.acceptTerms}
                                    onChange={handleChange}
                                    className={`w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-1 ${errors.acceptTerms ? "border-red-300" : ""
                                        }`}
                                />
                                <span className="ml-2 text-sm text-gray-600">
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

                            <label className="flex items-start">
                                <input
                                    type="checkbox"
                                    name="acceptMarketing"
                                    checked={formData.acceptMarketing}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-1"
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    Je souhaite recevoir des informations sur les nouveaux packages d'investissement
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || updating}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading || updating ? (
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
                        <p className="text-gray-600">
                            Déjà un compte ?{" "}
                            <button onClick={onSwitchToLogin} className="text-emerald-600 hover:text-emerald-700 font-medium">
                                Se connecter
                            </button>
                        </p>
                    </div>

                    {/* Security badges */}
                    <div className="mt-6 flex items-center justify-center space-x-4 text-xs text-gray-500">
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
