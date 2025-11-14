"use client"
import { useState } from "react"
import { CheckCircle } from "lucide-react"

const DashboardKYCProcessed = () => {
    const [visible, setVisible] = useState(true)

    if (!visible) return null

    return (
        <div className="space-y-6 px-2 sm:px-0">
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-4">

                    <div className="flex-shrink-0">
                        <CheckCircle className="w-7 h-7 text-green-400" />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">
                            Vérification terminée avec succès
                        </h3>

                        <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                            Votre identité a été vérifiée et votre compte est maintenant validé 🔒
                        </p>

                        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                            💸 Votre demande de retrait est en cours de traitement et sera envoyée sur votre
                            compte bancaire dans un délai de <span className="font-semibold text-white">24 à 48 heures ouvrées</span>.
                        </p>

                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Merci pour votre confiance 🙏 <br />
                            L’équipe <span className="text-gray-300 font-medium">CryptoBoost</span> reste à votre disposition si vous avez la moindre question.
                        </p>

                        <button
                            onClick={() => setVisible(false)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 font-medium"
                        >
                            Fermer
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default DashboardKYCProcessed
