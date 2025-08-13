"use client"

import { useAuthState } from "react-firebase-hooks/auth"
import { Navigate } from "react-router-dom"
import { auth } from "../../../firebase"

const PrivateRoute = ({ children }) => {
    const [user, loading, error] = useAuthState(auth)

    // Show loading spinner while checking auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
                    <p className="text-white text-lg">Vérification de l'authentification...</p>
                </div>
            </div>
        )
    }

    // Show error if there's an authentication error
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900">
                <div className="text-center">
                    <p className="text-red-400 text-lg mb-4">Erreur d'authentification</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-lime-400 text-slate-900 rounded-lg font-semibold hover:bg-lime-300 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        )
    }

    // Redirect to home if not authenticated
    if (!user) {
        return <Navigate to="/" replace />
    }

    // Render protected component if authenticated
    return children
}

export default PrivateRoute
