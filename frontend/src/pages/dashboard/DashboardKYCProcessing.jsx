"use client"
import { Clock } from "lucide-react"

const DashboardKYCProcessing = () => {
    return (
        <div className="space-y-6 px-2 sm:px-0">
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <Clock className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">KYC Vérification en Cours</h3>
                        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                            Votre paiement pour la vérification KYC a bien été reçu. Notre équipe est en train de traiter
                            votre demande. Cette étape peut prendre un peu de temps en fonction du volume de vérifications.
                        </p>
                        <p className="text-gray-400 text-sm italic">
                            🕓 Merci de patienter pendant que nous validons vos informations.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardKYCProcessing
