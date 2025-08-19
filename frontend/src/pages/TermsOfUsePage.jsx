
import { useNavigate } from "react-router-dom"


export default function TermsOfUsePage() {

    return (
        <div className="bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 min-h-screen relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <a href="/" className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-8">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Retour à l'accueil
                    </a>

                    <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Conditions d'Utilisation</h1>
                    <p className="text-gray-300 text-lg">Cryptoboost.io - Dernière mise à jour : Janvier 2025</p>
                </div>

                {/* Risk Warning Banner */}
                <div className="mb-12 p-8 bg-gradient-to-r from-red-500/10 to-orange-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl">
                    <div className="flex items-start">
                        <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-3">Avertissement Important sur les Risques</h3>
                            <p className="text-gray-200 leading-relaxed mb-3">
                                <strong>ATTENTION :</strong> Les investissements proposés sur cette plateforme comportent des risques
                                significatifs de perte en capital. Les cryptomonnaies et actifs financiers sont volatils et peuvent
                                perdre de la valeur rapidement.
                            </p>
                            <ul className="text-gray-200 space-y-1 ml-4 list-disc list-inside text-sm">
                                <li>Vous pourriez perdre tout votre investissement</li>
                                <li>Les performances passées ne préjugent pas des performances futures</li>
                                <li>N'investissez que ce que vous pouvez vous permettre de perdre</li>
                                <li>Consultez un conseiller financier indépendant si nécessaire</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Section 1 */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">1. Acceptation des Conditions</h2>
                        <p className="text-gray-300 leading-relaxed">
                            En accédant et en utilisant la plateforme Cryptoboost.io, vous acceptez d'être lié par ces conditions
                            d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
                        </p>
                    </div>

                    {/* Section 2 */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">2. Description des Services</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">Cryptoboost.io propose :</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                            <li>Des packages d'investissement en cryptomonnaies</li>
                            <li>Des outils d'analyse et de suivi de portefeuille</li>
                            <li>Des services de conseil en investissement</li>
                            <li>Une interface de trading et de gestion d'actifs</li>
                        </ul>
                    </div>

                    {/* Section 3 */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">3. Éligibilité et Inscription</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-lime-400 mb-2">3.1 Conditions d'éligibilité</h3>
                                <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                                    <li>Être âgé de 18 ans minimum</li>
                                    <li>Résider dans un pays où nos services sont autorisés</li>
                                    <li>Fournir des informations exactes et complètes</li>
                                    <li>Accepter la vérification d'identité (KYC/AML)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-lime-400 mb-2">3.2 Responsabilités du compte</h3>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    Vous êtes responsable de la sécurité de votre compte et de toutes les activités effectuées.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 4 - Risk Details */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">4. Risques d'Investissement</h2>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Déclaration de Risques Détaillée</h3>
                            <ul className="list-disc list-inside text-gray-300 space-y-1 text-xs">
                                <li>
                                    <strong>Risque de perte totale :</strong> Perte intégrale possible
                                </li>
                                <li>
                                    <strong>Volatilité :</strong> Fluctuations extrêmes des prix
                                </li>
                                <li>
                                    <strong>Risque de liquidité :</strong> Difficultés de vente
                                </li>
                                <li>
                                    <strong>Risque réglementaire :</strong> Changements de lois
                                </li>
                                <li>
                                    <strong>Risque technologique :</strong> Pannes et piratages
                                </li>
                                <li>
                                    <strong>Risque de marché :</strong> Conditions défavorables
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Additional Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">5. Obligations Financières</h2>
                        <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                            <li>Frais clairement indiqués</li>
                            <li>Aucun remboursement garanti</li>
                            <li>Retraits soumis à conditions</li>
                            <li>Responsabilité fiscale</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">6. Utilisation Acceptable</h2>
                        <p className="text-gray-300 text-sm mb-3">Interdictions :</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-1 text-xs">
                            <li>Activités illégales</li>
                            <li>Blanchiment d'argent</li>
                            <li>Manipulation de marché</li>
                            <li>Usurpation d'identité</li>
                            <li>Accès non autorisé</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">7. Limitation de Responsabilité</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Cryptoboost.io ne peut être tenu responsable des pertes financières. Notre responsabilité est limitée aux
                            frais payés pour nos services.
                        </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">8. Propriété Intellectuelle</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Tous les contenus, marques et technologies sont notre propriété. Reproduction interdite sans autorisation.
                        </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">9. Résiliation</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Nous pouvons suspendre votre compte en cas de violation. Vous pouvez fermer votre compte à tout moment.
                        </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">10. Droit Applicable</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Conditions régies par le droit français. Juridiction des tribunaux de Paris, France.
                        </p>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-12">
                    <h2 className="text-2xl font-bold text-white mb-4 text-center">11. Contact</h2>
                    <p className="text-gray-300 text-center leading-relaxed">
                        Pour toute question concernant ces conditions d'utilisation :
                        <br />
                        <span className="text-lime-400 font-medium text-lg">legal@cryptoboost.io</span>
                    </p>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <div className="inline-flex items-center space-x-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-8 py-4 mb-6">
                        <a href="/privacy" className="text-lime-400 hover:text-lime-300 font-medium transition-colors">
                            Politique de confidentialité
                        </a>
                        <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                        <a href="/" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                            Retour à l'accueil
                        </a>
                    </div>

                    <div className="flex items-center justify-center text-gray-400 text-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                        Conditions légalement contraignantes
                    </div>
                </div>
            </div>
        </div>
    )
}
