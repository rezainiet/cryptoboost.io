"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../../firebase"
import AuthManager from "../Auth/AuthManager"

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [user, loading] = useAuthState(auth);

    return (
        <nav className="relative z-50 px-4 sm:px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center">
                        <span className="text-slate-900 font-bold text-lg">C</span>
                    </div>
                    <span className="text-white font-bold text-lg sm:text-xl">Cryptoboost.io</span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
                    <a
                        href="#packages-section"
                        className="text-white/80 hover:text-white transition-colors text-sm xl:text-base"
                    >
                        Forfaits
                    </a>
                    <a
                        href="/privacy-policy"
                        className="text-white/80 hover:text-white transition-colors text-sm xl:text-base"
                    >
                        Politique de Confidentialité
                    </a>
                    <a
                        href="/terms-conditions"
                        className="text-white/80 hover:text-white transition-colors text-sm xl:text-base"
                    >
                        Conditions Générales
                    </a>
                    <a
                        href="/frequently-asked-questions"
                        className="text-white/80 hover:text-white transition-colors text-sm xl:text-base"
                    >
                        FAQ
                    </a>
                    <a
                        href="/testimonials"
                        className="text-white/80 hover:text-white transition-colors text-sm xl:text-base"
                    >
                        Témoignages
                    </a>
                </div>



                {/* AuthManager component - hidden on small screens when user is logged in */}
                <div className={`hidden ${user ? "sm:block" : "md:block"}`}>
                    <AuthManager />
                </div>

                {/* Mobile menu button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className={`${user ? "sm:hidden" : "md:hidden"} text-white p-2 hover:bg-white/10 rounded-lg transition-colors`}
                    aria-label="Toggle mobile menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isMobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {isMobileMenuOpen && (
                <div
                    className={`${user ? "sm:hidden" : "md:hidden"} absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-white/10 shadow-xl`}
                >
                    <div className="px-4 sm:px-6 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
                        {/* Navigation links */}
                        <div className="space-y-2">
                            <a
                                href="/privacy-policy"
                                className="block text-white/80 hover:text-white hover:bg-white/5 transition-colors py-3 px-2 rounded-lg"
                            >
                                Politique de Confidentialité
                            </a>
                            <a
                                href="/terms-conditions"
                                className="block text-white/80 hover:text-white hover:bg-white/5 transition-colors py-3 px-2 rounded-lg"
                            >
                                Conditions Générales
                            </a>
                            <a
                                href="/privacy-policy"
                                className="block text-white/80 hover:text-white hover:bg-white/5 transition-colors py-3 px-2 rounded-lg"
                            >
                                Politique de Confidentialité
                            </a>
                            <a
                                href="/terms-conditions"
                                className="block text-white/80 hover:text-white hover:bg-white/5 transition-colors py-3 px-2 rounded-lg"
                            >
                                Conditions Générales
                            </a>
                            <a
                                href="/frequently-asked-questions"
                                className="block text-white/80 hover:text-white hover:bg-white/5 transition-colors py-3 px-2 rounded-lg"
                            >
                                FAQ
                            </a>
                            <a
                                href="/testimonials"
                                className="block text-white/80 hover:text-white hover:bg-white/5 transition-colors py-3 px-2 rounded-lg"
                            >
                                Témoignages
                            </a>

                        </div>

                        {/* AuthManager for mobile */}
                        <div className="pt-4 border-t border-white/10">
                            <AuthManager />
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
