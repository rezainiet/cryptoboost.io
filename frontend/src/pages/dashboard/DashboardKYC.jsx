"use client"
import { useNavigate } from "react-router-dom"

const DashboardKYC = () => {
    const navigate = useNavigate()

    return (
        <div className="space-y-6 px-2 sm:px-0">
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">Vérification KYC Requise</h3>
                        <p className="text-gray-300 text-sm mb-4">
                            Pour continuer à utiliser nos services et effectuer des retraits, vous devez compléter la vérification KYC
                            (Know Your Customer). Cette étape est obligatoire pour la sécurité de votre compte.
                        </p>
                        <button
                            onClick={() => navigate("/verify-kyc")}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/25"
                        >
                            Commencer la Vérification KYC
                        </button>
                    </div>
                </div>
            </div>

            {/* <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Statut de Vérification</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <span className="text-gray-300">Identité</span>
                        <span className="text-yellow-400 font-medium">En attente</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <span className="text-gray-300">Adresse</span>
                        <span className="text-yellow-400 font-medium">En attente</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <span className="text-gray-300">Paiement de Vérification</span>
                        <span className="text-yellow-400 font-medium">En attente</span>
                    </div>
                </div>
            </div> */}
        </div>
    )
}

export default DashboardKYC
