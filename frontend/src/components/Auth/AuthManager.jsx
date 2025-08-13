"use client"

import { useState } from "react"
import { useAuthState, useSignOut } from "react-firebase-hooks/auth"
import { auth } from "../../../firebase"
import LoginModal from "../Modal/LoginModal"
import RegisterModal from "../Modal/RegisterModal"

export default function AuthManager() {
    const [user, loading] = useAuthState(auth)
    const [signOut] = useSignOut(auth)
    const [activeModal, setActiveModal] = useState(null) // 'login', 'register', or null

    const openLogin = () => setActiveModal("login")
    const openRegister = () => setActiveModal("register")
    const closeModal = () => setActiveModal(null)

    const switchToRegister = () => setActiveModal("register")
    const switchToLogin = () => setActiveModal("login")

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
            <div className="flex items-center space-x-4">
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
                <button className="px-4 py-2 bg-lime-400 text-slate-900 rounded-lg hover:bg-lime-300 transition-colors font-medium text-sm">
                    Tableau de bord
                </button>

                {/* Sign out button */}
                <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-white/90 hover:text-white border border-white/20 rounded-lg hover:border-white/40 transition-colors font-medium text-sm"
                >
                    Déconnexion
                </button>
            </div>
        )
    }

    return (
        <>
            {/* Login/Register trigger buttons */}
            <div className="flex space-x-3">
                <button onClick={openLogin} className="px-6 py-2 text-white/90 hover:text-white transition-colors font-medium">
                    Connexion
                </button>
                <button
                    onClick={openRegister}
                    className="px-6 py-2 bg-lime-400 text-slate-900 rounded-lg hover:bg-lime-300 transition-colors font-medium"
                >
                    S'inscrire
                </button>
            </div>

            {/* Modals */}
            <LoginModal isOpen={activeModal === "login"} onClose={closeModal} onSwitchToRegister={switchToRegister} />
            <RegisterModal isOpen={activeModal === "register"} onClose={closeModal} onSwitchToLogin={switchToLogin} />
        </>
    )
}
