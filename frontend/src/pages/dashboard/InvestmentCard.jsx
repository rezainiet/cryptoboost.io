"use client"

const InvestmentCard = ({
    investment,
    startingBot,
    onStartBot,
    onExtendOrder,
    onOpenWithdrawModal,
    onCopyToClipboard,
}) => {
    const getStatusColor = (status) => {
        switch (status) {
            case "Bot actif":
                return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20"
            case "Terminé":
                return "bg-green-500/20 text-green-400 border-green-500/30 shadow-green-500/20"
            case "En cours":
                return "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/20"
            case "Expiré":
                return "bg-red-500/20 text-red-400 border-red-500/30 shadow-red-500/20"
            default:
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-yellow-500/20"
        }
    }

    return (
        <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-lg sm:rounded-2xl p-3 sm:p-6 border border-slate-600/30 hover:border-teal-500/40 transition-all duration-500 hover:shadow-xl hover:shadow-teal-500/10">
            {/* Pending Payment Alert */}
            {investment.rawStatus === "pending" && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg sm:rounded-xl">
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
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
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-yellow-400 font-semibold text-sm sm:text-base">
                                Commande en attente de paiement
                            </span>
                            <p className="text-yellow-300/80 text-xs sm:text-sm mt-1">
                                Envoyez le paiement à l'adresse ci-dessous. Cette commande expirera automatiquement après 30 minutes.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Investment Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-lime-400/20 flex-shrink-0">
                        <span className="text-slate-900 font-bold text-sm sm:text-xl">{investment.crypto}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-white font-bold text-lg sm:text-xl truncate">{investment.package}</h3>
                        <p className="text-gray-300 font-medium text-base sm:text-lg">{investment.amount}</p>
                        <p className="text-xs text-gray-500 font-mono bg-slate-800/50 px-2 sm:px-3 py-1 rounded-md sm:rounded-lg mt-1 sm:mt-2 inline-block">
                            ID: {investment.orderId.slice(-8)}
                        </p>
                    </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                    <span
                        className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border shadow-lg inline-block ${getStatusColor(investment.status)}`}
                    >
                        {investment.status}
                    </span>
                    {investment.rawStatus?.includes("started" || "processing") ? (
                        <p className="text-green-400 text-xs sm:text-sm mt-2 font-medium">Payment completed.</p>
                    ) : (
                        <p className="text-gray-400 text-xs sm:text-sm mt-2 font-medium">{investment.timeRemaining}</p>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {investment.showProgress && (
                <div className="mb-4 sm:mb-6">
                    <div className="flex justify-between text-sm mb-3">
                        <span className="text-gray-300 font-medium">Progression du Bot</span>
                        <span className="text-white font-bold">{Math.round(investment.progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-600/50 rounded-full h-4 overflow-hidden shadow-inner">
                        <div
                            className="bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-400 h-4 rounded-full transition-all duration-2000 ease-out shadow-lg relative overflow-hidden"
                            style={{ width: `${investment.progress}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-ping"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Address for Pending Orders */}
            {investment.rawStatus === "pending" && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-600/30">
                    <p className="text-gray-300 mb-2 sm:mb-3 font-medium text-sm sm:text-base">
                        Adresse de paiement {investment.crypto}:
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 bg-slate-900/50 p-3 rounded-lg">
                        <code className="text-lime-400 font-mono text-xs sm:text-sm flex-1 break-all overflow-hidden">
                            {investment.address}
                        </code>
                        <button
                            onClick={() => onCopyToClipboard(investment.address, "Adresse")}
                            className="text-gray-400 hover:text-lime-400 transition-colors p-2 hover:bg-lime-400/10 rounded-lg flex-shrink-0 self-end sm:self-auto"
                            title="Copier l'adresse"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            )}

            {/* Transaction Hash */}
            {investment.txHash && investment.rawStatus !== "pending" && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-600/30">
                    <p className="text-gray-300 mb-2 sm:mb-3 font-medium text-sm sm:text-base">Transaction Hash:</p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 bg-slate-900/50 p-3 rounded-lg">
                        <code className="text-emerald-400 font-mono text-xs sm:text-sm flex-1 break-all overflow-hidden">
                            {investment.txHash || investment.sweepTxHash}
                        </code>
                        <button
                            onClick={() => onCopyToClipboard(investment.txHash, "Hash")}
                            className="text-gray-400 hover:text-emerald-400 transition-colors p-2 hover:bg-emerald-400/10 rounded-lg flex-shrink-0 self-end sm:self-auto"
                            title="Copier le hash"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            )}

            {/* Trading Activity */}
            {investment.rawStatus === "started" && investment.tradingHashes.length > 0 && (
                <div className="mb-4 sm:mb-6">
                    <p className="text-gray-300 mb-2 sm:mb-3 font-medium flex items-center space-x-2 text-sm sm:text-base">
                        <span>Activité de trading en temps réel</span>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    </p>
                    <div className="relative bg-slate-900/50 rounded-lg sm:rounded-xl border border-slate-600/30 overflow-hidden">
                        <div className="max-h-32 sm:max-h-40 overflow-y-auto p-3 sm:p-4 space-y-2">
                            {investment.tradingHashes.slice(-8).map((hashData, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 px-3 bg-slate-800/30 rounded-lg space-y-1 sm:space-y-0"
                                >
                                    <code className="text-emerald-400 font-mono text-xs sm:text-sm truncate flex-1 break-all">
                                        {hashData.hash}
                                    </code>
                                    <span className="text-gray-400 text-xs font-medium flex-shrink-0 self-end sm:self-auto">
                                        {hashData.timestamp}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-8 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none"></div>
                    </div>
                </div>
            )}

            {/* Completed Investment Summary */}
            {investment.rawStatus === "completed" && (
                <div className="mb-4 sm:mb-6">
                    <p className="text-gray-300 mb-2 sm:mb-3 font-medium flex items-center space-x-2 text-sm sm:text-base">
                        <span>Résumé de l'investissement</span>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </p>
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg sm:rounded-xl border border-green-500/30 p-3 sm:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Investissement initial:</span>
                                    <span className="text-white font-semibold">{investment.amount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Retour généré:</span>
                                    <span className="text-green-400 font-semibold">{investment.expectedReturn}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Durée:</span>
                                    <span className="text-white font-semibold">3 heures</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Statut:</span>
                                    <span className="text-green-400 font-semibold">✓ Terminé avec succès</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                {investment.rawStatus === "pending" && !investment.isExpired && (
                    <button
                        onClick={() => onExtendOrder(investment.orderId)}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 rounded-lg sm:rounded-xl hover:from-yellow-500/30 hover:to-orange-500/30 transition-all duration-300 font-medium border border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20 text-sm sm:text-base"
                    >
                        Prolonger (+30min)
                    </button>
                )}

                {investment.rawStatus === "processing" && (
                    <button
                        onClick={() => onStartBot(investment.orderId)}
                        disabled={startingBot[investment.orderId]}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-lg sm:rounded-xl hover:from-emerald-500/30 hover:to-teal-500/30 transition-all duration-300 font-medium border border-emerald-500/30 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/20 text-sm sm:text-base"
                    >
                        {startingBot[investment.orderId] ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                                <span>Démarrage...</span>
                            </div>
                        ) : (
                            "Démarrer le Bot"
                        )}
                    </button>
                )}

                {investment.rawStatus === "completed" && (
                    <button
                        onClick={() => onOpenWithdrawModal(investment)}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 rounded-lg sm:rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 font-medium border border-purple-500/30 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 text-sm sm:text-base"
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                />
                            </svg>
                            <span>Retirer</span>
                        </div>
                    </button>
                )}
            </div>
        </div>
    )
}

export default InvestmentCard
