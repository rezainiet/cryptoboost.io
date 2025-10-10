"use client"

import { useMemo } from "react"

const WithdrawalModal = ({
    showModal,
    selectedInvestment,
    withdrawalData,
    setWithdrawalData,
    withdrawalStep,
    withdrawalLoading,
    withdrawalError,
    verificationPayment,
    completingPayment,
    onClose,
    onSubmit,
    onPaymentCompleted,
    onCopyToClipboard,
}) => {
    const { withdrawalAmount, verificationAmount, totalAmount, verificationFeeRate } = useMemo(() => {
        if (!selectedInvestment)
            return { withdrawalAmount: 0, verificationAmount: 0, totalAmount: 0, verificationFeeRate: 0 }

        // Remove all non-numeric characters except decimal point, then convert to number
        const cleanAmount = selectedInvestment.expectedReturn
            .replace(/€/g, "") // Remove all € symbols
            .replace(/,/g, "") // Remove ALL commas (not just first one)
            .replace(/\s/g, "") // Remove all whitespace
            .trim()

        // Use Number() constructor for better iOS Safari compatibility
        const withdrawalAmount = Number(cleanAmount) || 0

        // Ensure we have a valid number before calculating
        if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
            console.log("[v0] Invalid withdrawal amount:", selectedInvestment.expectedReturn, "->", cleanAmount)
            return { withdrawalAmount: 0, verificationAmount: 0, totalAmount: 0, verificationFeeRate: 0 }
        }

        const verificationFeeRate = withdrawalData.method === "crypto" ? 0.03 : 0.08

        // Explicit number calculations with proper rounding for iOS Safari
        const verificationAmount = Math.round(withdrawalAmount * verificationFeeRate * 100) / 100
        const totalAmount = Math.round((withdrawalAmount + verificationAmount) * 100) / 100

        console.log("[v0] Calculations:", {
            original: selectedInvestment.expectedReturn,
            cleaned: cleanAmount,
            withdrawalAmount,
            method: withdrawalData.method,
            verificationFeeRate,
            verificationAmount,
            totalAmount,
        })

        return { withdrawalAmount, verificationAmount, totalAmount, verificationFeeRate }
    }, [selectedInvestment, withdrawalData.method])

    if (!showModal) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-teal-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-white">Demande de Retrait</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                    >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Investment Details */}
                {selectedInvestment && (
                    <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4 mb-4">
                        <h4 className="text-white font-semibold mb-2">Détails du Retrait</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Package:</span>
                                <span className="text-white">{selectedInvestment.package}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Montant Investi:</span>
                                <span className="text-white">{selectedInvestment.amount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Montant à Retirer:</span>
                                <span className="text-green-400 font-semibold">{selectedInvestment.expectedReturn}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Statut:</span>
                                <span className="text-white">{selectedInvestment.status}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {withdrawalError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-3">
                            <svg
                                className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <div className="flex-1">
                                <p className="text-red-400 text-sm mb-2">{withdrawalError}</p>
                                <a
                                    href="https://t.me/cryptoboost_support"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                    </svg>
                                    <span>Contacter le Support Telegram</span>
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Step */}
                {withdrawalStep === "form" && (
                    <form onSubmit={onSubmit} className="space-y-4">
                        {/* Method Selection */}
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-3">Méthode de Retrait</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setWithdrawalData((prev) => ({ ...prev, method: "crypto" }))}
                                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${withdrawalData.method === "crypto"
                                        ? "border-teal-500/50 bg-teal-500/10 text-teal-400"
                                        : "border-slate-600/50 bg-slate-700/30 text-gray-300 hover:border-slate-500/50"
                                        }`}
                                >
                                    <div className="text-center">
                                        <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                            />
                                        </svg>
                                        <div className="font-semibold">Crypto</div>
                                        <div className="text-xs mt-1">Frais: 3%</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWithdrawalData((prev) => ({ ...prev, method: "bank" }))}
                                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${withdrawalData.method === "bank"
                                        ? "border-teal-500/50 bg-teal-500/10 text-teal-400"
                                        : "border-slate-600/50 bg-slate-700/30 text-gray-300 hover:border-slate-500/50"
                                        }`}
                                >
                                    <div className="text-center">
                                        <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                            />
                                        </svg>
                                        <div className="font-semibold">Banque</div>
                                        <div className="text-xs mt-1">Frais: 8%</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Verification Network */}
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                                Réseau pour le paiement de vérification
                            </label>
                            <select
                                value={withdrawalData.verificationNetwork}
                                onChange={(e) => setWithdrawalData((prev) => ({ ...prev, verificationNetwork: e.target.value }))}
                                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 focus:outline-none transition-colors"
                            >
                                <option value="SOL">Solana (SOL)</option>
                                <option value="ETH">Ethereum (ETH)</option>
                                <option value="USDT">USDT (ETH)</option>
                                <option value="USDC">USDC (ETH)</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                Choisissez le réseau crypto pour payer les frais de vérification
                            </p>
                        </div>

                        {/* Crypto Fields */}
                        {withdrawalData.method === "crypto" && (
                            <>
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">
                                        Réseau de crypto-monnaie (pour le retrait)
                                    </label>
                                    <select
                                        value={withdrawalData.network}
                                        onChange={(e) => setWithdrawalData((prev) => ({ ...prev, network: e.target.value }))}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 focus:outline-none transition-colors"
                                    >
                                        <option value="SOL">Solana (SOL)</option>
                                        <option value="ETH">Ethereum (ETH)</option>
                                        <option value="USDT">USDT (ETH)</option>
                                        <option value="USDC">USDC (ETH)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Adresse de portefeuille</label>
                                    <input
                                        type="text"
                                        value={withdrawalData.walletAddress}
                                        onChange={(e) => setWithdrawalData((prev) => ({ ...prev, walletAddress: e.target.value }))}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 focus:outline-none transition-colors"
                                        placeholder="Votre adresse de portefeuille"
                                        required
                                    />
                                </div>

                                {selectedInvestment && (
                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">Montant à retirer:</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={selectedInvestment.expectedReturn}
                                            className="w-full bg-slate-900/100 border border-slate-600/50 rounded-xl px-4 py-3 text-gray-400 focus:border-teal-500/50 focus:outline-none transition-colors"
                                            placeholder="Amount"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* Bank Fields */}
                        {withdrawalData.method === "bank" && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">Prénom</label>
                                        <input
                                            type="text"
                                            value={withdrawalData.firstName}
                                            onChange={(e) => setWithdrawalData((prev) => ({ ...prev, firstName: e.target.value }))}
                                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 focus:outline-none transition-colors"
                                            placeholder="Prénom"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">Nom</label>
                                        <input
                                            type="text"
                                            value={withdrawalData.lastName}
                                            onChange={(e) => setWithdrawalData((prev) => ({ ...prev, lastName: e.target.value }))}
                                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 focus:outline-none transition-colors"
                                            placeholder="Nom"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Numéro IBAN</label>
                                    <input
                                        type="text"
                                        value={withdrawalData.iban}
                                        onChange={(e) => setWithdrawalData((prev) => ({ ...prev, iban: e.target.value.toUpperCase() }))}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 focus:outline-none transition-colors font-mono"
                                        placeholder="FR76 1234 5678 9012 3456 7890 123"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {/* Verification Fee Info */}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <svg
                                    className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                                <span className="text-yellow-400 font-semibold text-sm sm:text-base">Frais de vérification</span>
                            </div>
                            <p className="text-yellow-300/80 text-xs sm:text-sm">
                                Vous devez d’abord payer les frais de vérification en crypto ({Math.round(verificationFeeRate * 100)}%). Pour confirmer que l’adresse sur laquelle vous recevez vous appartient.
                            </p>
                        </div>

                        <div className="bg-slate-700/30 rounded-xl p-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Montant à retirer:</span>
                                <span className="text-white">€{withdrawalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Frais de vérification ({Math.round(verificationFeeRate * 100)}%):</span>
                                <span className="text-yellow-400">€{verificationAmount.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-slate-600/50 pt-2 mt-2">
                                <div className="flex justify-between font-semibold">
                                    <span className="text-white">Vous recevrez après vérification:</span>
                                    <span className="text-green-400">
                                        €{totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    * Le montant complet + frais de vérification seront transférés après paiement
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={withdrawalLoading}
                            className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 rounded-lg sm:rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 font-medium border border-purple-500/30 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            {withdrawalLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                                    <span>Traitement...</span>
                                </div>
                            ) : (
                                "Créer la demande de retrait"
                            )}
                        </button>
                    </form>
                )}

                {/* Verification Payment Step */}
                {withdrawalStep === "verification_payment" && verificationPayment && (
                    <div className="space-y-4">
                        <div className="text-center mb-4 sm:mb-6">
                            <h4 className="text-base sm:text-lg font-semibold text-white mb-2">Paiement de Vérification</h4>
                            <p className="text-gray-400 text-xs sm:text-sm">
                                Payez {Math.round(verificationFeeRate * 100)}% pour vérifier votre identité. Après vérification, vous
                                recevrez le montant complet de {selectedInvestment?.expectedReturn}.
                            </p>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span className="text-blue-400 font-semibold">Paiement de vérification anti-bot</span>
                            </div>
                            <p className="text-blue-300/80 text-sm">
                                Ce paiement prouve que vous êtes un utilisateur réel. Après vérification, vous recevrez{" "}
                                <strong>€{totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</strong> via{" "}
                                {withdrawalData.method === "crypto" ? "crypto" : "virement bancaire"}.
                            </p>
                        </div>

                        <div className="bg-slate-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4">
                            <div className="text-center mb-4">
                                <p className="text-gray-300 text-xs sm:text-sm mb-2">
                                    Montant de vérification ({verificationPayment.network})
                                </p>
                                <p className="text-xl sm:text-2xl font-bold text-white">
                                    {verificationPayment.cryptoAmount} {verificationPayment.network}
                                </p>
                                <p className="text-gray-400 text-xs sm:text-sm mt-1">≈ €{verificationAmount.toFixed(2)}</p>
                            </div>

                            <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 flex justify-center">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${verificationPayment.address}`}
                                    alt="QR Code"
                                    className="w-32 h-32 sm:w-48 sm:h-48"
                                />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-gray-400 text-xs sm:text-sm mb-1">Adresse de paiement:</p>
                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 bg-slate-800/50 p-3 rounded-lg">
                                        <code className="text-lime-400 font-mono text-xs sm:text-sm flex-1 break-all">
                                            {verificationPayment?.address || "Génération de l'adresse..."}
                                        </code>
                                        <button
                                            onClick={() => onCopyToClipboard(verificationPayment?.address || "", "Adresse")}
                                            className="text-gray-400 hover:text-lime-400 transition-colors p-2 hover:bg-lime-400/10 rounded-lg flex-shrink-0 self-end sm:self-auto"
                                            disabled={!verificationPayment?.address}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2v8a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                            <p className="text-green-400 text-sm">
                                ✓ Après confirmation du paiement, votre demande de retrait sera créée et traitée dans les 24-48 heures.
                            </p>
                        </div>


                        <button
                            onClick={onPaymentCompleted}
                            disabled={completingPayment}
                            className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-lg sm:rounded-xl hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300 font-medium border border-green-500/30 hover:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            {completingPayment ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></div>
                                    <span>Confirmation...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Payment Completed</span>
                                </div>
                            )}
                        </button>
                    </div>
                )}

                {/* Success Step */}
                {withdrawalStep === "success" && (
                    <div className="space-y-4">
                        <div className="text-center mb-4 sm:mb-6">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Succès du Paiement</h4>
                            <p className="text-gray-400 text-sm">
                                Votre paiement a été confirmé avec succès. Votre demande de retrait sera traitée dans les 24-48 heures.
                            </p>
                        </div>

                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                            <p className="text-green-400 text-sm">
                                Vous recevrez <strong>€{totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</strong> via{" "}
                                {withdrawalData.method === "crypto" ? "crypto" : "virement bancaire"}.
                            </p>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                            <p className="text-yellow-400 text-sm">
                                Afin de valider le retrait et obtenir vos gains, merci d’effectuer la vérification KYC.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-slate-600/20 to-slate-700/20 text-slate-300 rounded-lg sm:rounded-xl hover:from-slate-600/30 hover:to-slate-700/30 transition-all duration-300 font-medium border border-slate-600/30 hover:border-slate-500/50 text-sm sm:text-base"
                        >
                            Fermer
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default WithdrawalModal
