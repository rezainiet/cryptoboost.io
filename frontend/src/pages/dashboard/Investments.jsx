"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../../firebase"
import { apiService } from "../../services/apiService"
import InvestmentCard from "./InvestmentCard"
import WithdrawalModal from "./WithdrawalModal"
import InvestmentOverview from "./InvestmentOverview"

const Investments = () => {
    const [user] = useAuthState(auth)
    const [investments, setInvestments] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [withdrawalError, setWithdrawalError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [startingBot, setStartingBot] = useState({})
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [selectedInvestment, setSelectedInvestment] = useState(null)
    const [withdrawalData, setWithdrawalData] = useState({
        method: "crypto",
        network: "SOL",
        verificationNetwork: "SOL",
        walletAddress: "",
        firstName: "",
        lastName: "",
        iban: "",
    })
    const [withdrawalLoading, setWithdrawalLoading] = useState(false)
    const [withdrawalStep, setWithdrawalStep] = useState("form")
    const [verificationPayment, setVerificationPayment] = useState(null)
    const [completingPayment, setCompletingPayment] = useState(false)

    const hasStartedInvestments = useMemo(() => {
        return investments.some((investment) => investment.rawStatus === "started")
    }, [investments])

    const isAnyModalOpen = useMemo(() => {
        return showWithdrawModal || withdrawalStep !== "form"
    }, [showWithdrawModal, withdrawalStep])

    const getStatusLabel = useCallback((status, isExpired) => {
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
    }, [])

    const formatTimeRemaining = useCallback((timeRemaining, status, expectedCompletion) => {
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
    }, [])

    const parseTimeframe = useCallback((timeframeStr) => {
        const match = timeframeStr.match(/(\d+)\s*heures?/i)
        return match ? Number.parseInt(match[1], 10) * 60 * 60 * 1000 : 3 * 60 * 60 * 1000
    }, [])

    const transformInvestmentData = useCallback(
        (orders) => {
            return orders.map((order) => {
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
                    const packageDuration = parseTimeframe(order.package.timeframe)
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
        },
        [getStatusLabel, formatTimeRemaining, parseTimeframe],
    )

    const fetchInvestmentData = useCallback(async () => {
        if (!user?.email) return

        try {
            setLoading(true)
            setError(null)

            const [ordersResponse, analyticsResponse] = await Promise.all([
                apiService.getUserOrders(user.email, 1, 20),
                apiService.getUserAnalytics(user.email),
            ])

            if (ordersResponse.success) {
                const transformedInvestments = transformInvestmentData(ordersResponse.orders)
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
    }, [user?.email, transformInvestmentData])

    // Initial data loading
    useEffect(() => {
        fetchInvestmentData()
    }, [fetchInvestmentData])

    useEffect(() => {
        let interval = null

        if (user?.email) {
            interval = setInterval(() => {
                if (hasStartedInvestments && !isAnyModalOpen) {
                    setRefreshing(true)
                    fetchInvestmentData()
                }
            }, 30000)
        }

        return () => {
            if (interval) {
                clearInterval(interval)
            }
        }
    }, [user?.email, hasStartedInvestments, isAnyModalOpen, fetchInvestmentData])

    const openWithdrawModal = useCallback((investment) => {
        setSelectedInvestment(investment)
        setWithdrawalData({
            method: "crypto",
            network: "SOL",
            verificationNetwork: "SOL",
            walletAddress: "",
            firstName: "",
            lastName: "",
            iban: "",
        })
        setWithdrawalStep("form")
        setWithdrawalError(null)
        setShowWithdrawModal(true)
    }, [])

    const closeWithdrawModal = useCallback(() => {
        setShowWithdrawModal(false)
        setSelectedInvestment(null)
        setWithdrawalData({
            method: "crypto",
            network: "SOL",
            verificationNetwork: "SOL",
            walletAddress: "",
            firstName: "",
            lastName: "",
            iban: "",
        })
        setWithdrawalStep("form")
        setVerificationPayment(null)
        setWithdrawalError(null)
    }, [])

    const handleWithdrawalSubmit = useCallback(
        async (e) => {
            e.preventDefault()
            if (!selectedInvestment) return

            if (withdrawalData.method === "crypto" && !withdrawalData.walletAddress) return
            if (
                withdrawalData.method === "bank" &&
                (!withdrawalData.firstName || !withdrawalData.lastName || !withdrawalData.iban)
            )
                return

            try {
                setWithdrawalLoading(true)

                const withdrawalAmount = Number.parseFloat(selectedInvestment.expectedReturn.replace("€", "").replace(",", ""))
                const verificationFeeRate = withdrawalData.method === "crypto" ? 0.03 : 0.08
                const verificationAmount = withdrawalAmount * verificationFeeRate

                const verificationResponse = await apiService.createVerificationPayment({
                    orderId: selectedInvestment.orderId,
                    withdrawalAmount,
                    verificationAmount,
                    verificationFeeRate,
                    withdrawalMethod: withdrawalData.method,
                    network: withdrawalData.network,
                    verificationNetwork: withdrawalData.verificationNetwork,
                    walletAddress: withdrawalData.walletAddress,
                    bankDetails:
                        withdrawalData.method === "bank"
                            ? {
                                firstName: withdrawalData.firstName,
                                lastName: withdrawalData.lastName,
                                iban: withdrawalData.iban,
                            }
                            : null,
                    userEmail: user.email,
                })

                if (verificationResponse.success) {
                    setVerificationPayment(verificationResponse.payment)
                    setWithdrawalStep("verification_payment")
                }
            } catch (err) {
                console.error("Verification payment error:", err)
                setWithdrawalError("Erreur lors de la création du paiement de vérification")
            } finally {
                setWithdrawalLoading(false)
            }
        },
        [selectedInvestment, withdrawalData, user?.email],
    )

    const copyToClipboard = useCallback(async (text, type) => {
        try {
            await navigator.clipboard.writeText(text)
            console.log(`${type} copié dans le presse-papiers`)
        } catch (err) {
            console.error("Erreur lors de la copie:", err)
        }
    }, [])

    const extendOrder = useCallback(async (orderId) => {
        try {
            await apiService.extendOrder(orderId, 30)
            setRefreshing(true)
            window.location.reload()
        } catch (err) {
            console.error("Erreur lors de l'extension:", err)
        }
    }, [])

    const startBot = useCallback(
        async (orderId) => {
            try {
                setStartingBot((prev) => ({ ...prev, [orderId]: true }))
                const response = await apiService.startBot(orderId)

                if (response.success) {
                    setRefreshing(true)
                    await fetchInvestmentData()
                }
            } catch (err) {
                console.error("Erreur lors du démarrage du bot:", err)
                setError("Erreur lors du démarrage du bot de trading")
            } finally {
                setStartingBot((prev) => ({ ...prev, [orderId]: false }))
            }
        },
        [fetchInvestmentData],
    )

    const handlePaymentCompleted = useCallback(async () => {
        if (!selectedInvestment || !verificationPayment) return

        try {
            setCompletingPayment(true)
            setWithdrawalError(null)

            const response = await apiService.updateOrderStatus({
                orderId: selectedInvestment.orderId,
                status: "payment_completed",
                userEmail: user.email,
                verificationPaymentId: verificationPayment.id,
            })

            if (response.success) {
                setWithdrawalStep("success")
                setRefreshing(true)
                await fetchInvestmentData()
            } else {
                setWithdrawalError("Erreur lors de la confirmation du paiement. Veuillez contacter le support.")
            }
        } catch (err) {
            console.error("Payment completion error:", err)
            setWithdrawalError("Erreur lors de la confirmation du paiement. Veuillez contacter le support.")
        } finally {
            setCompletingPayment(false)
        }
    }, [selectedInvestment, verificationPayment, user?.email, fetchInvestmentData])

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
            <InvestmentOverview analytics={analytics} refreshing={refreshing} />

            {/* Active Investments */}
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
                    <div className="space-y-3 sm:space-y-6">
                        {investments.map((investment) => (
                            <InvestmentCard
                                key={investment.id}
                                investment={investment}
                                startingBot={startingBot}
                                onStartBot={startBot}
                                onExtendOrder={extendOrder}
                                onOpenWithdrawModal={openWithdrawModal}
                                onCopyToClipboard={copyToClipboard}
                            />
                        ))}
                    </div>
                )}
            </div>

            <WithdrawalModal
                showModal={showWithdrawModal}
                selectedInvestment={selectedInvestment}
                withdrawalData={withdrawalData}
                setWithdrawalData={setWithdrawalData}
                withdrawalStep={withdrawalStep}
                withdrawalLoading={withdrawalLoading}
                withdrawalError={withdrawalError}
                verificationPayment={verificationPayment}
                completingPayment={completingPayment}
                onClose={closeWithdrawModal}
                onSubmit={handleWithdrawalSubmit}
                onPaymentCompleted={handlePaymentCompleted}
                onCopyToClipboard={copyToClipboard}
            />
        </div>
    )
}

export default Investments
