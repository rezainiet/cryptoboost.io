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

                        // Calculate progress based on status and time
                        let progress = 0
                        if (order.status === "completed") progress = 100
                        else if (order.status === "processing") progress = 60
                        else if (order.status === "pending" && order.txHash) progress = 30
                        else if (order.status === "pending") progress = 10

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
                        className="px-3 py-1 bg-lime-400/20 text-lime-400 rounded-lg hover:bg-lime-400/30 transition-colors text-sm"
                        disabled={refreshing}
                    >
                        {refreshing ? "Actualisation..." : "Actualiser"}
                    </button>
                </div>

                {investments.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-lime-400/20 to-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <p className="text-gray-400 mb-2">Aucun investissement trouvé</p>
                        <p className="text-sm text-gray-500">Commencez par choisir un package d'investissement</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {investments.map((investment) => (
                            <div
                                key={investment.id}
                                className="bg-slate-700/30 rounded-lg p-6 hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full flex items-center justify-center">
                                            <span className="text-slate-900 font-bold text-sm">{investment.crypto}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold">{investment.package}</h3>
                                            <p className="text-gray-400 text-sm">
                                                {investment.amount} → {investment.expectedReturn}
                                            </p>
                                            <p className="text-xs text-gray-500">ID: {investment.orderId.slice(-8)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${investment.status === "En cours" || investment.status === "Terminé"
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : investment.status === "Expiré"
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "bg-yellow-500/20 text-yellow-400"
                                                }`}
                                        >
                                            {investment.status}
                                        </span>
                                        <p className="text-gray-400 text-sm mt-1">{investment.timeRemaining}</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Progression</span>
                                        <span className="text-white">{investment.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-600 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-lime-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${investment.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Real-time tracking details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-400 mb-1">Adresse de paiement:</p>
                                        <div className="flex items-center space-x-2">
                                            <code className="bg-slate-800 px-2 py-1 rounded text-xs text-lime-400">
                                                {investment.address.slice(0, 20)}...
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(investment.address, "Adresse")}
                                                className="text-gray-400 hover:text-lime-400 transition-colors"
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

                                    {investment.txHash && (
                                        <div>
                                            <p className="text-gray-400 mb-1">Transaction Hash:</p>
                                            <div className="flex items-center space-x-2">
                                                <code className="bg-slate-800 px-2 py-1 rounded text-xs text-emerald-400">
                                                    {investment.txHash.slice(0, 20)}...
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(investment.txHash, "Hash")}
                                                    className="text-gray-400 hover:text-emerald-400 transition-colors"
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
                                    )}
                                </div>

                                {/* Action buttons for pending orders */}
                                {investment.rawStatus === "pending" && !investment.isExpired && (
                                    <div className="mt-4 flex space-x-2">
                                        <button
                                            onClick={() => extendOrder(investment.orderId)}
                                            className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm"
                                        >
                                            Prolonger (+30min)
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Investments
