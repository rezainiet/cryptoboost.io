"use client"

const Footer = () => {
    const currentYear = new Date().getFullYear()

    const footerLinks = {
        Plateforme: [
            { label: "Packages d'Investissement", href: "#packages-section" },
            { label: "Comment ça Marche", href: "#features" },
            { label: "Témoignages", href: "/testimonials" },
        ],
        Support: [
            { label: "Contact", href: "#contact-form" },
            { label: "FAQ", href: "/frequently-asked-questions" },
            { label: "Chat en Direct", href: "https://t.me/Louis_botcrypto" },
        ],
        Légal: [
            { label: "Conditions d'Utilisation", href: "/terms-conditions" },
            { label: "Politique de Confidentialité", href: "/privacy-policy" },
        ],
        Communauté: [
            { label: "Discord", href: "#" },
            { label: "Telegram", href: "https://t.me/Louis_botcrypto" },
            { label: "Twitter", href: "#" },
            { label: "LinkedIn", href: "#" },
        ],
    }

    return (
        <footer className="bg-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                                <div className="w-5 h-5 bg-teal-600 rounded-sm"></div>
                            </div>
                            <span className="text-white text-2xl font-bold">Cryptoboost.io</span>
                        </div>
                        <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                            La plateforme d'investissement automatisé qui révolutionne le trading crypto. Maximisez vos rendements
                            avec notre IA de trading 24/7.
                        </p>
                        <div className="flex space-x-4">
                            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center hover:bg-teal-500 transition-colors cursor-pointer">
                                <span className="text-sm font-bold">f</span>
                            </div>
                            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center hover:bg-teal-500 transition-colors cursor-pointer">
                                <span className="text-sm font-bold">t</span>
                            </div>
                            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center hover:bg-teal-500 transition-colors cursor-pointer">
                                <span className="text-sm font-bold">in</span>
                            </div>
                            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center hover:bg-teal-500 transition-colors cursor-pointer">
                                <span className="text-sm font-bold">@</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Links */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="text-white font-semibold mb-4">{category}</h4>
                            <ul className="space-y-3">
                                {links.map((link, index) => (
                                    <li key={index}>
                                        <a href={link.href} className="text-gray-300 hover:text-white transition-colors text-sm">
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Trust Indicators */}
                <div className="border-t border-gray-700 pt-8 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-3">
                                <span className="text-white font-bold">🔒</span>
                            </div>
                            <h5 className="font-semibold mb-1">Sécurité Bancaire</h5>
                            <p className="text-gray-400 text-sm">Cryptage SSL 256-bit</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3">
                                <span className="text-white font-bold">⚡</span>
                            </div>
                            <h5 className="font-semibold mb-1">Disponibilité 99.9%</h5>
                            <p className="text-gray-400 text-sm">Uptime garanti</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-3">
                                <span className="text-white font-bold">🛡️</span>
                            </div>
                            <h5 className="font-semibold mb-1">Conformité RGPD</h5>
                            <p className="text-gray-400 text-sm">Protection des données</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-700 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="text-gray-400 text-sm">© {currentYear} Cryptoboost.io. Tous droits réservés.</div>
                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                            <span>🇫🇷 Basé en France</span>
                            <span>•</span>
                            <span>Régulé par l'AMF</span>
                            <span>•</span>
                            <span>Support 24/7</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
