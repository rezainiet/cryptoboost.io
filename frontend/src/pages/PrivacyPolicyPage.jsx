import { Link } from "react-router-dom";


export default function PrivacyPolicyPage() {
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

                    <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Politique de Confidentialité</h1>
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
                            <h3 className="text-2xl font-bold text-white mb-3">Avertissement sur les Risques d'Investissement</h3>
                            <p className="text-gray-200 leading-relaxed">
                                <strong>
                                    Les investissements en cryptomonnaies et actifs financiers présentent des risques élevés.
                                </strong>
                                La valeur de vos investissements peut fluctuer considérablement et vous pourriez perdre tout ou partie
                                de votre capital investi. Les performances passées ne garantissent pas les résultats futurs. Investissez
                                uniquement ce que vous pouvez vous permettre de perdre.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Section 1 */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">1. Introduction</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Cryptoboost.io ("nous", "notre", "nos") s'engage à protéger votre vie privée. Cette politique de
                            confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations
                            personnelles lorsque vous utilisez notre plateforme d'investissement.
                        </p>
                    </div>

                    {/* Section 2 */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">2. Informations collectées</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-lime-400 mb-2">2.1 Informations personnelles</h3>
                                <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                                    <li>Nom, prénom, adresse email</li>
                                    <li>Numéro de téléphone</li>
                                    <li>Informations de vérification d'identité (KYC)</li>
                                    <li>Informations bancaires et de paiement</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-lime-400 mb-2">2.2 Informations techniques</h3>
                                <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                                    <li>Adresse IP et géolocalisation</li>
                                    <li>Données d'appareil et navigateur</li>
                                    <li>Cookies et technologies similaires</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section 3 */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">3. Utilisation des données</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">Nous utilisons vos informations pour :</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                            <li>Fournir et améliorer nos services d'investissement</li>
                            <li>Vérifier votre identité et prévenir la fraude</li>
                            <li>Traiter vos transactions et investissements</li>
                            <li>Respecter nos obligations légales</li>
                            <li>Analyser les risques et optimiser notre plateforme</li>
                        </ul>
                    </div>

                    {/* Section 4 */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">4. Partage des données</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Nous ne vendons jamais vos données. Nous pouvons partager avec :
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                            <li>Partenaires de services financiers</li>
                            <li>Autorités réglementaires</li>
                            <li>Prestataires techniques (hébergement, sécurité)</li>
                            <li>Forces de l'ordre (obligation légale)</li>
                        </ul>
                    </div>

                    {/* Section 5 */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">5. Sécurité des données</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Nous mettons en œuvre des mesures de sécurité robustes incluant le chiffrement SSL/TLS, l'authentification
                            à deux facteurs, la surveillance continue et des audits de sécurité réguliers. Vos données financières
                            sont stockées selon les standards bancaires les plus élevés.
                        </p>
                    </div>

                    {/* Section 6 */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">6. Vos droits (RGPD)</h2>
                        <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                            <li>Accéder à vos données personnelles</li>
                            <li>Rectifier des informations inexactes</li>
                            <li>Demander l'effacement de vos données</li>
                            <li>Limiter le traitement de vos données</li>
                            <li>Vous opposer au traitement</li>
                            <li>Demander la portabilité de vos données</li>
                        </ul>
                    </div>
                </div>

                {/* Additional Sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">7. Conservation</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Nous conservons vos données aussi longtemps que nécessaire pour nos services et obligations légales. Les
                            données de transaction sont conservées 10 ans.
                        </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">8. Cookies</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Notre site utilise des cookies essentiels, d'analyse et de préférences. Vous pouvez gérer vos préférences
                            dans les paramètres de votre navigateur.
                        </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">9. Contact</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Pour toute question, contactez notre DPO à :
                            <br />
                            <Link to="https://t.me/Louis_botcrypto" className="text-lime-400 font-medium">Telegram Support</Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <div className="inline-flex items-center space-x-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-8 py-4 mb-6">
                        <a href="/terms-conditions" className="text-lime-400 hover:text-lime-300 font-medium transition-colors">
                            Conditions d'utilisation
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
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                        Données protégées - Conforme RGPD
                    </div>
                </div>
            </div>
        </div>
    )
}
