"use client"

import { useState } from "react"
import { Link } from "react-router-dom"

export default function FAQPage() {
    const [openAccordion, setOpenAccordion] = useState(null)

    const toggleAccordion = (index) => {
        setOpenAccordion(openAccordion === index ? null : index)
    }

    const generalFAQs = [
        {
            question: "Qu'est-ce que le robot CryptoBoost ?",
            answer:
                "C'est un outil automatisé qui analyse en temps réel les opportunités du marché et prend des décisions rapides à votre place afin d'optimiser vos résultats.",
        },
        {
            question: "Ai-je besoin de connaissances techniques pour l'utiliser ?",
            answer:
                "Non, la solution est pensée pour être accessible à tous, même aux débutants. Tout ce qui vous a demandé c'est d'effectuer le dépôt en crypto monnaie.",
        },
        {
            question: "Le robot fonctionne-t-il 24h/24 et 7j/7 ?",
            answer: "Oui, il ne dort jamais. Il scanne en continu pour ne rater aucune opportunité.",
        },
        {
            question: "Comment effectuer un dépôt ?",
            answer:
                "Vous pouvez déposer directement via votre espace personnel. Les instructions étape par étape sont fournies dans votre tableau de bord.",
        },
        {
            question: "Puis-je retirer mon argent à tout moment ?",
            answer: "Oui, vous pouvez demander un retrait quand vous le souhaitez, sous réserve des frais applicables.",
        },
        {
            question: "Combien de temps prend un retrait ?",
            answer:
                "Les retraits sont traités rapidement, généralement en moins de 24 heures, selon la vitesse du réseau blockchain.",
        },
    ]

    const depositFAQs = [
        {
            question: "Quels moyens de paiement sont acceptés ?",
            answer: "Vous pouvez déposer en Solana (SOL), Ethereum (ETH), Tether (USDT), et USD Coin (USDC).",
        },
        {
            question: "Dois-je choisir un pack avant de déposer ?",
            answer:
                "Oui. Vous devez d'abord sélectionner le pack d'investissement de votre choix. Une fois choisi, une adresse de dépôt unique est générée selon la crypto sélectionnée.",
        },
        {
            question: "Combien de temps mon adresse de dépôt reste-t-elle valide ?",
            answer: "L'adresse générée est valable 30 minutes. Passé ce délai, vous devez en générer une nouvelle.",
        },
        {
            question: "Comment déposer en Solana (SOL) ?",
            answer:
                "Connectez-vous à votre espace client, choisissez votre pack, sélectionnez Solana (SOL), copiez l'adresse générée, envoyez depuis votre portefeuille le montant exact, et votre pack sera activé automatiquement.",
        },
        {
            question: "Que faire si j'ai envoyé après 30 minutes ?",
            answer:
                "L'adresse est expirée. Vous devez régénérer une nouvelle adresse et refaire la transaction. Contactez le support si nécessaire.",
        },
        {
            question: "Puis-je utiliser un autre réseau (BEP-20, TRC-20) ?",
            answer: "Non. Seuls Solana (SOL) et Ethereum (ERC-20) sont acceptés pour les dépôts.",
        },
    ]

    const depositTutorials = [
        {
            question: "Tutoriel : Dépôt avec MetaMask",
            answer:
                "1. Connectez-vous à votre compte CryptoBoost\n2. Sélectionnez votre pack d'investissement\n3. Choisissez Ethereum (ETH) ou USDT/USDC\n4. Copiez l'adresse de dépôt générée\n5. Ouvrez MetaMask et cliquez sur 'Envoyer'\n6. Collez l'adresse de destination\n7. Saisissez le montant exact\n8. Confirmez la transaction\n9. Attendez la confirmation sur la blockchain",
        },
        {
            question: "Tutoriel : Dépôt avec Phantom Wallet (Solana)",
            answer:
                "1. Accédez à votre espace CryptoBoost\n2. Sélectionnez votre pack d'investissement\n3. Choisissez Solana (SOL)\n4. Copiez l'adresse de dépôt\n5. Ouvrez Phantom Wallet\n6. Cliquez sur 'Send'\n7. Collez l'adresse de destination\n8. Entrez le montant exact en SOL\n9. Vérifiez les détails et confirmez\n10. Votre pack sera activé automatiquement",
        },
        {
            question: "Tutoriel : Dépôt depuis un exchange (Binance, Coinbase)",
            answer:
                "1. Connectez-vous à votre exchange\n2. Allez dans 'Retrait' ou 'Withdraw'\n3. Sélectionnez la crypto (SOL, ETH, USDT, USDC)\n4. Collez l'adresse de dépôt CryptoBoost\n5. ATTENTION : Vérifiez le réseau (Solana pour SOL, Ethereum pour ETH/USDT/USDC)\n6. Saisissez le montant exact\n7. Confirmez le retrait\n8. Attendez le traitement (5-30 minutes selon l'exchange)",
        },
    ]

    const commonProblems = [
        {
            question: "Mon dépôt n'apparaît pas dans mon compte",
            answer:
                "Vérifiez d'abord que :\n• Vous avez envoyé sur la bonne adresse\n• Le montant est exact\n• Le réseau utilisé est correct (Solana ou Ethereum)\n• La transaction est confirmée sur la blockchain\n\nSi tout est correct, contactez le support avec votre hash de transaction.",
        },
        {
            question: "J'ai envoyé sur le mauvais réseau",
            answer:
                "Si vous avez envoyé des USDT sur le réseau Binance Smart Chain (BEP-20) ou Tron (TRC-20) au lieu d'Ethereum, vos fonds ne seront pas crédités automatiquement. Contactez immédiatement le support avec votre hash de transaction pour une récupération manuelle.",
        },
        {
            question: "L'adresse de dépôt a expiré",
            answer:
                "Les adresses de dépôt sont valables 30 minutes pour des raisons de sécurité. Si votre adresse a expiré :\n1. Retournez dans votre espace client\n2. Sélectionnez à nouveau votre pack\n3. Générez une nouvelle adresse\n4. Effectuez votre dépôt dans les 30 minutes",
        },
        {
            question: "Frais de transaction trop élevés",
            answer:
                "Les frais de réseau varient selon la congestion :\n• Ethereum : Utilisez des heures creuses (weekend, nuit)\n• Solana : Frais très bas (< 0.01 SOL)\n• Astuce : Surveillez les frais avant d'envoyer sur etherscan.io ou solscan.io",
        },
        {
            question: "Transaction en attente depuis longtemps",
            answer:
                "Si votre transaction est 'pending' :\n• Ethereum : Vérifiez sur etherscan.io, les frais peuvent être insuffisants\n• Solana : Vérifiez sur solscan.io, généralement traité en quelques secondes\n• Contactez le support si la transaction est confirmée mais pas créditée après 1 heure",
        },
    ]

    return (
        <div className="bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 min-h-screen relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-12">
                <div className="mb-12">
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
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">Questions Fréquentes</h1>
                    <p className="text-gray-300 text-lg text-center">CryptoBoost.io - Support & Assistance</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto mb-16">
                    <div className="text-left">
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Nous fournissons des solutions pour les situations les plus courantes. De l'inscription et l'accès à votre
                            compte aux paiements et aux retraits.
                        </p>
                    </div>
                    <div className="text-left">
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Notre équipe support est disponible 24h/24 pour vous accompagner. Utilisez le lien généré dans la fenêtre
                            "Support" pour ouvrir votre conversation.
                        </p>
                    </div>
                </div>

                {/* General Section */}
                <div className="mb-12">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Général</h2>
                        <div className="space-y-4">
                            {generalFAQs.map((faq, index) => (
                                <div key={index} className="border-b border-white/10 last:border-b-0">
                                    <button
                                        onClick={() => toggleAccordion(`general-${index}`)}
                                        className="w-full flex items-center justify-between py-4 text-left hover:bg-white/5 rounded-lg px-4 transition-colors"
                                    >
                                        <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${openAccordion === `general-${index}` ? "rotate-180" : ""
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {openAccordion === `general-${index}` && (
                                        <div className="pb-4 px-4">
                                            <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FAQ - Deposits Section */}
                <div className="mb-12">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">FAQ – Dépôts</h2>
                        <div className="space-y-4">
                            {depositFAQs.map((faq, index) => (
                                <div key={index} className="border-b border-white/10 last:border-b-0">
                                    <button
                                        onClick={() => toggleAccordion(`deposit-${index}`)}
                                        className="w-full flex items-center justify-between py-4 text-left hover:bg-white/5 rounded-lg px-4 transition-colors"
                                    >
                                        <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${openAccordion === `deposit-${index}` ? "rotate-180" : ""
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {openAccordion === `deposit-${index}` && (
                                        <div className="pb-4 px-4">
                                            <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mb-12">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <div className="flex items-center mb-6">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Tutoriels de Dépôt</h2>
                        </div>
                        <div className="space-y-4">
                            {depositTutorials.map((tutorial, index) => (
                                <div key={index} className="border-b border-white/10 last:border-b-0">
                                    <button
                                        onClick={() => toggleAccordion(`tutorial-${index}`)}
                                        className="w-full flex items-center justify-between py-4 text-left hover:bg-white/5 rounded-lg px-4 transition-colors"
                                    >
                                        <h3 className="text-lg font-semibold text-white pr-4">{tutorial.question}</h3>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${openAccordion === `tutorial-${index}` ? "rotate-180" : ""
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {openAccordion === `tutorial-${index}` && (
                                        <div className="pb-4 px-4">
                                            <pre className="text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                                                {tutorial.answer}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mb-12">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <div className="flex items-center mb-6">
                            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Problèmes Courants</h2>
                        </div>
                        <div className="space-y-4">
                            {commonProblems.map((problem, index) => (
                                <div key={index} className="border-b border-white/10 last:border-b-0">
                                    <button
                                        onClick={() => toggleAccordion(`problem-${index}`)}
                                        className="w-full flex items-center justify-between py-4 text-left hover:bg-white/5 rounded-lg px-4 transition-colors"
                                    >
                                        <h3 className="text-lg font-semibold text-white pr-4">{problem.question}</h3>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${openAccordion === `problem-${index}` ? "rotate-180" : ""
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {openAccordion === `problem-${index}` && (
                                        <div className="pb-4 px-4">
                                            <pre className="text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                                                {problem.answer}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <div className="inline-flex items-center space-x-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-8 py-4 mb-6">
                        <Link
                            to="https://t.me/Louis_botcrypto"
                            className="text-lime-400 hover:text-lime-300 font-medium transition-colors"
                        >
                            Support Telegram
                        </Link>
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
                                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z"
                            />
                        </svg>
                        Support disponible 24h/24 - Réponses instantanées
                    </div>
                </div>
            </div>
        </div>
    )
}
