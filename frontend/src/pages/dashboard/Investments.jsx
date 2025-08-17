"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../../firebase"
import { apiService } from "../../services/apiService"

const Investments = () => {
    const [user] = useAuthState(auth)
    const [investments, setInvestments] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [startingBot, setStartingBot] = useState({})

    useEffect(() => {
        const fetchInvestmentData = async () => {
            if (!user?.email) return

            try {
                setLoading(true)
                setError(null)

                // Fetch user orders and analytics in parallel
                const [ordersResponse, analyticsResponse] = await Promise.all([
                    apiService.getUserOrders(user.email, 1, 20),
                    apiService.getUserAnalytics(user.email),
                ])

                if (ordersResponse.success) {
                    // Transform orders into investment format with real-time tracking
                    const transformedInvestments = ordersResponse.orders.map((order) => {
                        const now = Date.now()
                        const timeRemaining = order.expiresAt - now
                        const isExpired = timeRemaining <= 0 && order.status === "pending"

                        let progress = 0
                        let showProgress = false
                        if (order.status === "started" && order.startedAt) {
                            showProgress = true
                            const startedTime = new Date(order.startedAt).getTime()
                            const packageDuration = 3 * 60 * 60 * 1000 // 3 hours in milliseconds
                            const timeElapsed = now - startedTime
                            progress = Math.min(Math.max((timeElapsed / packageDuration) * 100, 0), 100)
                        }

                        // Calculate expected completion time for processing orders
                        let expectedCompletion = null
                        if (order.status === "processing" && order.txHash) {
                            expectedCompletion = order.createdAtMs + 3 * 60 * 60 * 1000 // 3 hours from creation
                        }

                        return {
                            id: order.orderId,
                            package: order.package.title,
                            amount: `€${order.amountFiat.toLocaleString()}`,
                            expectedReturn: `€${order.package.returns.toLocaleString()}`,
                            progress,
                            showProgress, // Add flag to control progress bar visibility
                            status: getStatusLabel(order.status, isExpired),
                            timeRemaining: formatTimeRemaining(timeRemaining, order.status, expectedCompletion),
                            crypto: order.network,
                            txHash: order.txHash,
                            confirmations: order.confirmations || 0,
                            address: order.address,
                            createdAt: order.createdAt,
                            isExpired,
                            orderId: order.orderId,
                            rawStatus: order.status,
                            tradingHashes: order.tradingHashes || [],
                        }
                    })
                    setInvestments(transformedInvestments)
                }

                if (analyticsResponse.success) {
                    setAnalytics(analyticsResponse.analytics)
                }
            } catch (err) {
                console.error("Error fetching investment data:", err)
                setError("Erreur lors du chargement des investissements")
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        }

        fetchInvestmentData()

        // Set up auto-refresh every 30 seconds for real-time updates
        const interval = setInterval(() => {
            if (user?.email) {
                setRefreshing(true)
                fetchInvestmentData()
            }
        }, 30000)

        return () => clearInterval(interval)
    }, [user?.email])

    const getStatusLabel = (status, isExpired) => {
        if (isExpired) return "Expiré"
        switch (status) {
            case "pending":
                return "En attente"
            case "processing":
                return "En cours"
            case "started":
                return "Bot actif"
            case "completed":
                return "Terminé"
            case "expired":
                return "Expiré"
            default:
                return "Inconnu"
        }
    }

    const formatTimeRemaining = (timeRemaining, status, expectedCompletion) => {
        if (status === "completed") return "Terminé"
        if (status === "expired") return "Expiré"

        if (status === "processing" && expectedCompletion) {
            const completionTime = expectedCompletion - Date.now()
            if (completionTime <= 0) return "Bientôt terminé"

            const hours = Math.floor(completionTime / (1000 * 60 * 60))
            const minutes = Math.floor((completionTime % (1000 * 60 * 60)) / (1000 * 60))
            return `${hours}h ${minutes}min restantes`
        }

        if (timeRemaining <= 0) return "Expiré"

        const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

        if (hours > 0) {
            return `${hours}h ${minutes}min`
        } else {
            return `${minutes}min`
        }
    }

    const copyToClipboard = async (text, type) => {
        try {
            await navigator.clipboard.writeText(text)
            // You could add a toast notification here
            console.log(`${type} copié dans le presse-papiers`)
        } catch (err) {
            console.error("Erreur lors de la copie:", err)
        }
    }

    const extendOrder = async (orderId) => {
        try {
            await apiService.extendOrder(orderId, 30)
            // Refresh data after extending
            setRefreshing(true)
            window.location.reload() // Simple refresh, could be improved with state update
        } catch (err) {
            console.error("Erreur lors de l'extension:", err)
        }
    }

    const startBot = async (orderId) => {
        try {
            setStartingBot((prev) => ({ ...prev, [orderId]: true }))

            const response = await apiService.startBot(orderId)

            if (response.success) {
                // Refresh data to show updated status
                setRefreshing(true)
                const fetchData = async () => {
                    const ordersResponse = await apiService.getUserOrders(user.email, 1, 20)
                    if (ordersResponse.success) {
                        const transformedInvestments = ordersResponse.orders.map((order) => {
                            const now = Date.now()
                            const timeRemaining = order.expiresAt - now
                            const isExpired = timeRemaining <= 0 && order.status === "pending"

                            let progress = 0
                            let showProgress = false
                            if (order.status === "started" && order.startedAt) {
                                showProgress = true
                                const startedTime = new Date(order.startedAt).getTime()
                                const packageDuration = 3 * 60 * 60 * 1000 // 3 hours in milliseconds
                                const timeElapsed = now - startedTime
                                progress = Math.min(Math.max((timeElapsed / packageDuration) * 100, 0), 100)
                            }

                            let expectedCompletion = null
                            if (order.status === "processing" && order.txHash) {
                                expectedCompletion = order.createdAtMs + 3 * 60 * 60 * 1000
                            }

                            return {
                                id: order.orderId,
                                package: order.package.title,
                                amount: `€${order.amountFiat.toLocaleString()}`,
                                expectedReturn: `€${order.package.returns.toLocaleString()}`,
                                progress,
                                showProgress, // Add flag to control progress bar visibility
                                status: getStatusLabel(order.status, isExpired),
                                timeRemaining: formatTimeRemaining(timeRemaining, order.status, expectedCompletion),
                                crypto: order.network,
                                txHash: order.txHash,
                                confirmations: order.confirmations || 0,
                                address: order.address,
                                createdAt: order.createdAt,
                                isExpired,
                                orderId: order.orderId,
                                rawStatus: order.status,
                                tradingHashes: order.tradingHashes || [],
                            }
                        })
                        setInvestments(transformedInvestments)
                    }
                    setRefreshing(false)
                }
                await fetchData()
            }
        } catch (err) {
            console.error("Erreur lors du démarrage du bot:", err)
            setError("Erreur lors du démarrage du bot de trading")
        } finally {
            setStartingBot((prev) => ({ ...prev, [orderId]: false }))
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                    Réessayer
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Investment Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Total Investi</h3>
                    <p className="text-2xl font-bold text-white">€{analytics?.totalInvested?.toLocaleString() || "0"}</p>
                    <p className="text-emerald-400 text-sm mt-1">
                        {analytics?.activeInvestments || 0} investissement{(analytics?.activeInvestments || 0) !== 1 ? "s" : ""}{" "}
                        actif{(analytics?.activeInvestments || 0) !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Retour Attendu</h3>
                    <p className="text-2xl font-bold text-white">€{analytics?.totalReturns?.toLocaleString() || "0"}</p>
                    <p className="text-lime-400 text-sm mt-1">ROI: {analytics?.roi || 0}%</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Investissements Terminés</h3>
                    <p className="text-2xl font-bold text-white">{analytics?.completedInvestments || 0}</p>
                    <p className="text-yellow-400 text-sm mt-1">{refreshing ? "Mise à jour..." : "Temps réel"}</p>
                </div>
            </div>

            {/* Active Investments with Real-Time Tracking */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Mes Investissements</h2>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-lime-400/20 text-lime-400 rounded-lg hover:bg-lime-400/30 transition-all duration-300 text-sm font-medium border border-lime-400/30 hover:border-lime-400/50"
                        disabled={refreshing}
                    >
                        {refreshing ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-lime-400/30 border-t-lime-400 rounded-full animate-spin"></div>
                                <span>Actualisation...</span>
                            </div>
                        ) : (
                            "Actualiser"
                        )}
                    </button>
                </div>

                {investments.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-r from-lime-400/20 to-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <p className="text-gray-300 mb-2 text-lg font-medium">Aucun investissement trouvé</p>
                        <p className="text-gray-500">Commencez par choisir un package d'investissement</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {investments.map((investment) => (
                            <div
                                key={investment.id}
                                className="bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30 hover:border-teal-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10"
                            >
                                {investment.rawStatus === "pending" && (
                                    <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className="text-yellow-400 font-semibold">Commande en attente de paiement</span>
                                                <p className="text-yellow-300/80 text-sm mt-1">
                                                    Envoyez le paiement à l'adresse ci-dessous. Cette commande expirera automatiquement après 30
                                                    minutes.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg">
                                            <span className="text-slate-900 font-bold text-lg">{investment.crypto}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg">{investment.package}</h3>
                                            <p className="text-gray-300 font-medium">
                                                {investment.amount} → {investment.expectedReturn}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono bg-slate-800/50 px-2 py-1 rounded mt-1 inline-block">
                                                ID: {investment.orderId.slice(-8)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold border ${investment.status === "Bot actif"
                                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                : investment.status === "Terminé"
                                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                                    : investment.status === "En cours"
                                                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                                        : investment.status === "Expiré"
                                                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                                                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                }`}
                                        >
                                            {investment.status}
                                        </span>
                                        <p className="text-gray-400 text-sm mt-2 font-medium">{investment.timeRemaining}</p>
                                    </div>
                                </div>

                                {/* Progress bar - only for started orders */}
                                {investment.showProgress && (
                                    <div className="mb-6">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-300 font-medium">Progression du Bot</span>
                                            <span className="text-white font-bold">{Math.round(investment.progress)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-600/50 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-400 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                                                style={{ width: `${investment.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {investment.rawStatus === "pending" && (
                                    <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-600/30">
                                        <p className="text-gray-300 mb-3 font-medium">Adresse de paiement {investment.crypto}:</p>
                                        <div className="flex items-center space-x-3 bg-slate-900/50 p-3 rounded-lg">
                                            <code className="text-lime-400 font-mono text-sm flex-1 break-all">{investment.address}</code>
                                            <button
                                                onClick={() => copyToClipboard(investment.address, "Adresse")}
                                                className="text-gray-400 hover:text-lime-400 transition-colors p-2 hover:bg-lime-400/10 rounded-lg"
                                                title="Copier l'adresse"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                                {/* Transaction hash for processing/started orders */}
                                {investment.txHash && investment.rawStatus !== "pending" && (
                                    <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-600/30">
                                        <p className="text-gray-300 mb-3 font-medium">Transaction Hash:</p>
                                        <div className="flex items-center space-x-3 bg-slate-900/50 p-3 rounded-lg">
                                            <code className="text-emerald-400 font-mono text-sm flex-1 break-all">{investment.txHash}</code>
                                            <button
                                                onClick={() => copyToClipboard(investment.txHash, "Hash")}
                                                className="text-gray-400 hover:text-emerald-400 transition-colors p-2 hover:bg-emerald-400/10 rounded-lg"
                                                title="Copier le hash"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                                {investment.rawStatus === "started" && investment.tradingHashes.length > 0 && (
                                    <div className="mb-6">
                                        <p className="text-gray-300 mb-3 font-medium flex items-center space-x-2">
                                            <span>Activité de trading en temps réel</span>
                                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                        </p>
                                        <div className="relative bg-slate-900/50 rounded-xl border border-slate-600/30 overflow-hidden">
                                            <div className="max-h-40 overflow-y-auto p-4 space-y-2">
                                                {investment.tradingHashes.slice(-8).map((hashData, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded-lg"
                                                    >
                                                        <code className="text-emerald-400 font-mono text-sm">{hashData.hash.slice(0, 24)}...</code>
                                                        <span className="text-gray-400 text-xs font-medium">{hashData.timestamp}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none"></div>
                                        </div>
                                    </div>
                                )}

                                {investment.rawStatus === "completed" && (
                                    <div className="mb-6">
                                        <p className="text-gray-300 mb-3 font-medium flex items-center space-x-2">
                                            <span>Résumé de l'investissement</span>
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        </p>
                                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30 p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-3">
                                    {investment.rawStatus === "pending" && !investment.isExpired && (
                                        <button
                                            onClick={() => extendOrder(investment.orderId)}
                                            className="px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 rounded-xl hover:from-yellow-500/30 hover:to-orange-500/30 transition-all duration-300 font-medium border border-yellow-500/30 hover:border-yellow-500/50"
                                        >
                                            Prolonger (+30min)
                                        </button>
                                    )}

                                    {investment.rawStatus === "processing" && (
                                        <button
                                            onClick={() => startBot(investment.orderId)}
                                            disabled={startingBot[investment.orderId]}
                                            className="px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-xl hover:from-emerald-500/30 hover:to-teal-500/30 transition-all duration-300 font-medium border border-emerald-500/30 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {startingBot[investment.orderId] ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                                                    <span>Démarrage...</span>
                                                </div>
                                            ) : (
                                                "Démarrer le Bot"
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Investments
