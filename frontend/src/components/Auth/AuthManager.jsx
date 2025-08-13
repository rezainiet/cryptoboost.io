"use client"
import { useAuthState, useSignOut } from "react-firebase-hooks/auth"
import { Link } from "react-router-dom"
import { auth } from "../../../firebase"

export default function AuthManager() {
    const [user, loading] = useAuthState(auth)
    const [signOut] = useSignOut(auth)

    const handleSignOut = async () => {
        await signOut()
    }

    if (loading) {
        return (
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (user) {
        return (
            <div className="flex items-center space-x-2 sm:space-x-4">
                {/* User info */}
                <div className="hidden sm:flex items-center space-x-3">
                    <div className="w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center">
                        <span className="text-slate-900 font-bold text-sm">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="hidden md:block">
                        <p className="text-white text-sm font-medium">{user.displayName || user.email.split("@")[0]}</p>
                        <p className="text-white/60 text-xs">Investisseur</p>
                    </div>
                </div>

                {/* Dashboard button */}
                <Link
                    to="/dashboard"
                    className="px-3 sm:px-4 py-2 bg-lime-400 text-slate-900 rounded-lg hover:bg-lime-300 transition-colors font-medium text-sm"
                >
                    <span className="hidden sm:inline">Tableau de bord</span>
                    <span className="sm:hidden">Dashboard</span>
                </Link>

                {/* Sign out button */}
                <button
                    onClick={handleSignOut}
                    className="px-3 sm:px-4 py-2 text-white/90 hover:text-white border border-white/20 rounded-lg hover:border-white/40 transition-colors font-medium text-sm"
                >
                    <span className="hidden sm:inline">Déconnexion</span>
                    <span className="sm:hidden">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                    </span>
                </button>
            </div>
        )
    }

    return (
        <div className="flex space-x-2 sm:space-x-3">
            <Link
                to="/login"
                className="px-4 sm:px-6 py-2 text-white/90 hover:text-white transition-colors font-medium text-sm sm:text-base"
            >
                Connexion
            </Link>
            <Link
                to="/register"
                className="px-4 sm:px-6 py-2 bg-lime-400 text-slate-900 rounded-lg hover:bg-lime-300 transition-colors font-medium text-sm sm:text-base"
            >
                S'inscrire
            </Link>
        </div>
    )
}
