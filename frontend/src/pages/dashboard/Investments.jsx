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
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [selectedInvestment, setSelectedInvestment] = useState(null)
    const [withdrawalData, setWithdrawalData] = useState({
        amount: "",
        network: "SOL",
        walletAddress: "",
    })
    const [withdrawalLoading, setWithdrawalLoading] = useState(false)
    const [withdrawalStep, setWithdrawalStep] = useState("form") // 'form', 'verification_payment', 'success'
    const [withdrawalPayment, setWithdrawalPayment] = useState(null)
    const [verificationPayment, setVerificationPayment] = useState(null)
    const [completingPayment, setCompletingPayment] = useState(false)

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
                        const timeRemaining = (() => {
                            if (order.status === "started" && order.startedAt) {
                                const startedTime = order.startedAtMs
                                const packageDuration = parseTimeframe(order.package.timeframe)
                                return startedTime + packageDuration - now
                            } else {
                                return order.expiresAt - now
                            }
                        })()

                        const isExpired = timeRemaining <= 0 && order.status === "pending"

                        let progress = 0
                        let showProgress = false
                        if (order.status === "started" && order.startedAt) {
                            showProgress = true

                            const startedTime = order.startedAtMs
                            const packageDuration = parseTimeframe(order.package.timeframe) // ✅ real duration in ms
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

    const openWithdrawModal = (investment) => {
        setSelectedInvestment(investment)
        setWithdrawalData({
            amount: investment.expectedReturn.replace("€", "").replace(",", ""),
            network: "SOL",
            walletAddress: "",
        })
        setWithdrawalStep("form")
        setShowWithdrawModal(true)
    }

    const closeWithdrawModal = () => {
        setShowWithdrawModal(false)
        setSelectedInvestment(null)
        setWithdrawalData({ amount: "", network: "SOL", walletAddress: "" })
        setWithdrawalStep("form")
        setWithdrawalPayment(null)
        setVerificationPayment(null)
    }

    const handleWithdrawalSubmit = async (e) => {
        e.preventDefault()
        if (!selectedInvestment || !withdrawalData.walletAddress || !withdrawalData.amount) return

        try {
            setWithdrawalLoading(true)

            const verificationAmount = Number.parseFloat(withdrawalData.amount) * 0.03

            const verificationResponse = await apiService.createVerificationPayment({
                orderId: selectedInvestment.orderId,
                withdrawalAmount: Number.parseFloat(withdrawalData.amount),
                verificationAmount,
                network: withdrawalData.network,
                walletAddress: withdrawalData.walletAddress,
                userEmail: user.email,
            })

            if (verificationResponse.success) {
                setVerificationPayment(verificationResponse.payment)
                setWithdrawalStep("verification_payment")
            }
        } catch (err) {
            console.error("Verification payment error:", err)
            setError("Erreur lors de la création du paiement de vérification")
        } finally {
            setWithdrawalLoading(false)
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

    function parseTimeframe(timeframeStr) {
        const match = timeframeStr.match(/(\d+)\s*heures?/i)
        return match ? Number.parseInt(match[1], 10) * 60 * 60 * 1000 : 3 * 60 * 60 * 1000 // fallback to 3h
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

                                const startedTime = order.startedAtMs
                                const packageDuration = parseTimeframe(order.package.timeframe) // ✅
                                const timeElapsed = now - startedTime

                                progress = Math.min(Math.max((timeElapsed / packageDuration) * 100, 0), 100)
                            }

                            let expectedCompletion = null
                            if (order.status === "processing" && order.txHash) {
                                const packageDuration = parseTimeframe(order.package.timeframe)
                                expectedCompletion = order.createdAtMs + packageDuration
                            }

                            return {
                                id: order.orderId,
                                package: order.package.title,
                                amount: `€${order.amountFiat.toLocaleString()}`,
                                expectedReturn: `€${order.package.returns.toLocaleString()}`,
                                progress,
                                showProgress,
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

    const handlePaymentCompleted = async () => {
        if (!selectedInvestment || !verificationPayment) return

        try {
            setCompletingPayment(true)

            const response = await apiService.updateOrderStatus({
                orderId: selectedInvestment.orderId,
                status: "payment_completed",
                userEmail: user.email,
                verificationPaymentId: verificationPayment.id,
            })

            if (response.success) {
                setWithdrawalStep("success")
                // Refresh investments data
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

                                const startedTime = order.startedAtMs
                                const packageDuration = parseTimeframe(order.package.timeframe)
                                const timeElapsed = now - startedTime

                                progress = Math.min(Math.max((timeElapsed / packageDuration) * 100, 0), 100)
                            }

                            let expectedCompletion = null
                            if (order.status === "processing" && order.txHash) {
                                const packageDuration = parseTimeframe(order.package.timeframe)
                                expectedCompletion = order.createdAtMs + packageDuration
                            }

                            return {
                                id: order.orderId,
                                package: order.package.title,
                                amount: `€${order.amountFiat.toLocaleString()}`,
                                expectedReturn: `€${order.package.returns.toLocaleString()}`,
                                progress,
                                showProgress,
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
            } else {
                setError("Erreur lors de la confirmation du paiement")
            }
        } catch (err) {
            console.error("Payment completion error:", err)
            setError("Erreur lors de la confirmation du paiement")
        } finally {
            setCompletingPayment(false)
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
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* Investment Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-teal-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-teal-400/30 transition-all duration-300">
                    <h3 className="text-gray-400 text-xs sm:text-sm font-medium mb-2">Total Investi</h3>
                    <p className="text-xl sm:text-3xl font-bold text-white mb-1">
                        €{analytics?.totalInvested?.toLocaleString() || "0"}
                    </p>
                    <p className="text-emerald-400 text-xs sm:text-sm">
                        {analytics?.activeInvestments || 0} investissement{(analytics?.activeInvestments || 0) !== 1 ? "s" : ""}{" "}
                        actif{(analytics?.activeInvestments || 0) !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-teal-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-teal-400/30 transition-all duration-300">
                    <h3 className="text-gray-400 text-xs sm:text-sm font-medium mb-2">Retour Attendu</h3>
                    <p className="text-xl sm:text-3xl font-bold text-white mb-1">
                        €{analytics?.totalReturns?.toLocaleString() || "0"}
                    </p>
                    <p className="text-lime-400 text-xs sm:text-sm">ROI: {analytics?.roi || 0}%</p>
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-teal-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-teal-400/30 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                    <h3 className="text-gray-400 text-xs sm:text-sm font-medium mb-2">Investissements Terminés</h3>
                    <p className="text-xl sm:text-3xl font-bold text-white mb-1">{analytics?.completedInvestments || 0}</p>
                    <p className="text-yellow-400 text-xs sm:text-sm">{refreshing ? "Mise à jour..." : "Temps réel"}</p>
                </div>
            </div>

            {/* Active Investments with Real-Time Tracking */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-teal-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Mes Investissements</h2>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-lime-400/20 to-emerald-400/20 text-lime-400 rounded-lg sm:rounded-xl hover:from-lime-400/30 hover:to-emerald-400/30 transition-all duration-300 text-sm font-medium border border-lime-400/30 hover:border-lime-400/50 hover:shadow-lg hover:shadow-lime-400/20 w-full sm:w-auto"
                        disabled={refreshing}
                    >
                        {refreshing ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-lime-400/30 border-t-lime-400 rounded-full animate-spin"></div>
                                <span>Actualisation...</span>
                            </div>
                        ) : (
                            "Actualiser"
                        )}
                    </button>
                </div>

                {investments.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-lime-400/20 to-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <svg
                                className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <p className="text-gray-300 mb-2 text-lg sm:text-xl font-medium">Aucun investissement trouvé</p>
                        <p className="text-gray-500 text-sm sm:text-base">Commencez par choisir un package d'investissement</p>
                    </div>
                ) : (
                    <div className="space-y-4 sm:space-y-6">
                        {investments.map((investment) => (
                            <div
                                key={investment.id}
                                className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-600/30 hover:border-teal-500/40 transition-all duration-500 hover:shadow-xl hover:shadow-teal-500/10"
                            >
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
                                                    Envoyez le paiement à l'adresse ci-dessous. Cette commande expirera automatiquement après 30
                                                    minutes.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
                                    <div className="flex items-center space-x-3 sm:space-x-4">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-lime-400/20 flex-shrink-0">
                                            <span className="text-slate-900 font-bold text-sm sm:text-xl">{investment.crypto}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-white font-bold text-lg sm:text-xl truncate">{investment.package}</h3>
                                            <p className="text-gray-300 font-medium text-base sm:text-lg">
                                                {investment.amount}
                                                {/* → {investment.expectedReturn} */}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono bg-slate-800/50 px-2 sm:px-3 py-1 rounded-md sm:rounded-lg mt-1 sm:mt-2 inline-block">
                                                ID: {investment.orderId.slice(-8)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right flex-shrink-0">
                                        <span
                                            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border shadow-lg inline-block ${investment.status === "Bot actif"
                                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20"
                                                : investment.status === "Terminé"
                                                    ? "bg-green-500/20 text-green-400 border-green-500/30 shadow-green-500/20"
                                                    : investment.status === "En cours"
                                                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/20"
                                                        : investment.status === "Expiré"
                                                            ? "bg-red-500/20 text-red-400 border-red-500/30 shadow-red-500/20"
                                                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-yellow-500/20"
                                                }`}
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
                                                onClick={() => copyToClipboard(investment.address, "Adresse")}
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

                                {/* Transaction hash for processing/started orders */}
                                {investment.txHash && investment.rawStatus !== "pending" && (
                                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-600/30">
                                        <p className="text-gray-300 mb-2 sm:mb-3 font-medium text-sm sm:text-base">Transaction Hash:</p>
                                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 bg-slate-900/50 p-3 rounded-lg">
                                            <code className="text-emerald-400 font-mono text-xs sm:text-sm flex-1 break-all overflow-hidden">
                                                {investment.txHash}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(investment.txHash, "Hash")}
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

                                {/* Action buttons */}
                                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                                    {investment.rawStatus === "pending" && !investment.isExpired && (
                                        <button
                                            onClick={() => extendOrder(investment.orderId)}
                                            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 rounded-lg sm:rounded-xl hover:from-yellow-500/30 hover:to-orange-500/30 transition-all duration-300 font-medium border border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20 text-sm sm:text-base"
                                        >
                                            Prolonger (+30min)
                                        </button>
                                    )}

                                    {investment.rawStatus === "processing" && (
                                        <button
                                            onClick={() => startBot(investment.orderId)}
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
                                            onClick={() => openWithdrawModal(investment)}
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
                        ))}
                    </div>
                )}
            </div>

            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-teal-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="text-lg sm:text-xl font-bold text-white">Demande de Retrait</h3>
                            <button
                                onClick={closeWithdrawModal}
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {withdrawalStep === "form" && (
                            <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
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
                                        <span className="text-yellow-400 font-semibold text-sm sm:text-base">Frais de retrait</span>
                                    </div>
                                    <p className="text-yellow-300/80 text-xs sm:text-sm">
                                        Des frais de 3% TVA s'appliquent à tous les retraits. Vous devrez effectuer un paiement pour ces
                                        frais avant que votre retrait soit traité.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Montant à retirer</label>
                                    <input
                                        type="number"
                                        value={withdrawalData.amount}
                                        onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 focus:outline-none transition-colors"
                                        placeholder="Montant en EUR"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Réseau de crypto-monnaie</label>
                                    <select
                                        value={withdrawalData.network}
                                        onChange={(e) => setWithdrawalData({ ...withdrawalData, network: e.target.value })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 focus:outline-none transition-colors"
                                    >
                                        <option value="BTC">Solana (SOL)</option>
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
                                        onChange={(e) => setWithdrawalData({ ...withdrawalData, walletAddress: e.target.value })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 focus:outline-none transition-colors"
                                        placeholder="Votre adresse de portefeuille"
                                        required
                                    />
                                </div>

                                <div className="bg-slate-700/30 rounded-xl p-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">Montant demandé:</span>
                                        <span className="text-white">€{withdrawalData.amount || "0"}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">Frais TVA (3%):</span>
                                        <span className="text-yellow-400">
                                            €{(Number.parseFloat(withdrawalData.amount || 0) * 0.03).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="border-t border-slate-600/50 pt-2 mt-2">
                                        <div className="flex justify-between font-semibold">
                                            <span className="text-white">Vous recevrez:</span>
                                            <span className="text-green-400">
                                                €{(Number.parseFloat(withdrawalData.amount || 0) * 0.97).toFixed(2)}
                                            </span>
                                        </div>
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

                        {withdrawalStep === "verification_payment" && verificationPayment && (
                            <div className="space-y-4">
                                <div className="text-center mb-4 sm:mb-6">
                                    <h4 className="text-base sm:text-lg font-semibold text-white mb-2">Paiement de Vérification</h4>
                                    <p className="text-gray-400 text-xs sm:text-sm">
                                        Payez 3% pour vérifier votre identité. Vous recevrez ce montant avec votre retrait complet.
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
                                        <strong>€{withdrawalData.amount}</strong> +{" "}
                                        <strong>€{(Number.parseFloat(withdrawalData.amount) * 0.03).toFixed(2)}</strong> (remboursement de
                                        vérification) = <strong>€{(Number.parseFloat(withdrawalData.amount) * 1.03).toFixed(2)}</strong> au
                                        total.
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
                                        <p className="text-gray-400 text-xs sm:text-sm mt-1">
                                            ≈ €{(Number.parseFloat(withdrawalData.amount) * 0.03).toFixed(2)}
                                        </p>
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
                                                    {verificationPayment.address}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(verificationPayment.address, "Adresse")}
                                                    className="text-gray-400 hover:text-lime-400 transition-colors p-2 hover:bg-lime-400/10 rounded-lg flex-shrink-0 self-end sm:self-auto"
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
                                        ✓ Après confirmation du paiement, votre demande de retrait sera créée et traitée dans les 24-48
                                        heures.
                                    </p>
                                </div>

                                <button
                                    onClick={handlePaymentCompleted}
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

                        {withdrawalStep === "success" && (
                            <div className="space-y-4">
                                <div className="text-center mb-4 sm:mb-6">
                                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-semibold text-white mb-2">Échec du Paiement</h4>
                                    <p className="text-gray-400 text-sm">
                                        Une erreur est survenue lors du traitement de votre paiement.
                                        Veuillez réessayer ou contacter le support si le problème persiste.
                                    </p>
                                </div>

                                <div className="bg-slate-700/30 rounded-xl p-4">
                                    <h5 className="text-white font-semibold mb-3">Détails du retrait:</h5>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Montant demandé:</span>
                                            <span className="text-white">€{withdrawalData.amount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Réseau:</span>
                                            <span className="text-white">{withdrawalData.network}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Adresse de destination:</span>
                                            <span className="text-white font-mono text-xs">
                                                {withdrawalData.walletAddress.slice(0, 10)}...
                                                {withdrawalData.walletAddress.slice(-6)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                    <p className="text-red-400 text-sm">
                                        Si vous avez besoin d’aide, contactez notre{" "}
                                        <a
                                            href="https://t.me/Louis_botcrypto"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline hover:text-red-300 transition"
                                        >
                                            support Telegram
                                        </a>.
                                    </p>
                                </div>

                                <button
                                    onClick={closeWithdrawModal}
                                    className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-slate-600/20 to-slate-700/20 text-slate-300 rounded-lg sm:rounded-xl hover:from-slate-600/30 hover:to-slate-700/30 transition-all duration-300 font-medium border border-slate-600/30 hover:border-slate-500/50 text-sm sm:text-base"
                                >
                                    Fermer
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Investments
