"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../../firebase"
import { apiService } from "../../services/apiService"

const Performance = () => {
    const [user] = useAuthState(auth)
    const [analytics, setAnalytics] = useState(null)
    const [performanceData, setPerformanceData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user?.email) return

            try {
                setLoading(true)
                setError(null)

                const [analyticsResponse, ordersResponse] = await Promise.all([
                    apiService.getUserAnalytics(user.email),
                    apiService.getUserOrders(user.email, 1, 100), // Get more orders for better analytics
                ])

                if (analyticsResponse.success) {
                    const data = analyticsResponse.analytics
                    setAnalytics(data)

                    // Calculate performance periods
                    const now = new Date()
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

                    let todayProfit = 0
                    let weekProfit = 0
                    let monthProfit = 0

                    if (ordersResponse.success) {
                        ordersResponse.orders.forEach((order) => {
                            if (order.status === "completed") {
                                const orderDate = new Date(order.createdAtMs)
                                const profit = order.package.returns - order.amountFiat

                                if (orderDate >= today) todayProfit += profit
                                if (orderDate >= weekStart) weekProfit += profit
                                if (orderDate >= monthStart) monthProfit += profit
                            }
                        })
                    }

                    const totalProfit = data.totalReturns - data.totalInvested

                    setPerformanceData([
                        {
                            period: "Aujourd'hui",
                            profit: `€${todayProfit.toLocaleString()}`,
                            percentage: todayProfit > 0 ? `+${((todayProfit / data.totalInvested) * 100).toFixed(1)}%` : "0%",
                            value: todayProfit,
                        },
                        {
                            period: "Cette semaine",
                            profit: `€${weekProfit.toLocaleString()}`,
                            percentage: weekProfit > 0 ? `+${((weekProfit / data.totalInvested) * 100).toFixed(1)}%` : "0%",
                            value: weekProfit,
                        },
                        {
                            period: "Ce mois",
                            profit: `€${monthProfit.toLocaleString()}`,
                            percentage: monthProfit > 0 ? `+${((monthProfit / data.totalInvested) * 100).toFixed(1)}%` : "0%",
                            value: monthProfit,
                        },
                        {
                            period: "Total",
                            profit: `€${totalProfit.toLocaleString()}`,
                            percentage: `+${data.roi}%`,
                            value: totalProfit,
                        },
                    ])
                }
            } catch (err) {
                console.error("Error fetching analytics:", err)
                setError("Erreur lors du chargement des analyses")
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [user?.email])

    const renderNetworkDistribution = () => {
        if (!analytics?.networkDistribution) return null

        const networks = Object.entries(analytics.networkDistribution)
        const total = networks.reduce((sum, [, amount]) => sum + amount, 0)

        return (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Distribution par Réseau</h2>
                <div className="space-y-4">
                    {networks.map(([network, amount]) => {
                        const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0
                        const networkColors = {
                            BTC: "from-orange-400 to-yellow-400",
                            ETH: "from-blue-400 to-purple-400",
                            TRC20: "from-green-400 to-emerald-400",
                        }

                        return (
                            <div key={network} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className={`w-8 h-8 bg-gradient-to-r ${networkColors[network] || "from-gray-400 to-gray-500"} rounded-full flex items-center justify-center`}
                                    >
                                        <span className="text-white font-bold text-xs">{network}</span>
                                    </div>
                                    <span className="text-white font-medium">{network}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-semibold">€{amount.toLocaleString()}</p>
                                    <p className="text-gray-400 text-sm">{percentage}%</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderMonthlyPerformance = () => {
        if (!analytics?.monthlyPerformance) return null

        return (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Performance Mensuelle</h2>
                <div className="space-y-4">
                    {analytics.monthlyPerformance.map((month, index) => {
                        const profitPercentage = month.invested > 0 ? ((month.profit / month.invested) * 100).toFixed(1) : 0
                        const isPositive = month.profit >= 0

                        return (
                            <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                <div>
                                    <p className="text-white font-medium">{month.month}</p>
                                    <p className="text-gray-400 text-sm">Investi: €{month.invested.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                                        {isPositive ? "+" : ""}€{month.profit.toLocaleString()}
                                    </p>
                                    <p className={`text-sm ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                                        {isPositive ? "+" : ""}
                                        {profitPercentage}%
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
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
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {performanceData.map((data, index) => (
                    <div key={index} className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                        <h3 className="text-gray-400 text-sm font-medium mb-2">{data.period}</h3>
                        <p className="text-2xl font-bold text-white">{data.profit}</p>
                        <p className={`text-sm mt-1 ${data.value >= 0 ? "text-emerald-400" : "text-red-400"}`}>{data.percentage}</p>
                    </div>
                ))}
            </div>

            {/* Portfolio Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Statistiques du Portefeuille</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Total Investi</span>
                            <span className="text-white font-semibold">€{analytics?.totalInvested?.toLocaleString() || "0"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Retours Totaux</span>
                            <span className="text-emerald-400 font-semibold">
                                €{analytics?.totalReturns?.toLocaleString() || "0"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Profit Net</span>
                            <span className="text-lime-400 font-semibold">
                                €{((analytics?.totalReturns || 0) - (analytics?.totalInvested || 0)).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">ROI Moyen</span>
                            <span className="text-cyan-400 font-semibold">{analytics?.roi || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Investissements Actifs</span>
                            <span className="text-yellow-400 font-semibold">{analytics?.activeInvestments || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Investissements Terminés</span>
                            <span className="text-emerald-400 font-semibold">{analytics?.completedInvestments || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Network Distribution */}
                {renderNetworkDistribution()}
            </div>

            {/* Monthly Performance */}
            {renderMonthlyPerformance()}

            {/* Performance Insights */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Insights de Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <span className="text-emerald-400 font-medium">Meilleur Réseau</span>
                        </div>
                        <p className="text-white text-lg font-semibold">
                            {analytics?.networkDistribution
                                ? Object.entries(analytics.networkDistribution).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
                                : "N/A"}
                        </p>
                    </div>

                    <div className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                            <span className="text-lime-400 font-medium">Taux de Réussite</span>
                        </div>
                        <p className="text-white text-lg font-semibold">
                            {analytics?.totalInvested > 0
                                ? (
                                    ((analytics?.completedInvestments || 0) /
                                        ((analytics?.activeInvestments || 0) + (analytics?.completedInvestments || 0))) *
                                    100
                                ).toFixed(1)
                                : 0}
                            %
                        </p>
                    </div>

                    <div className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                            <span className="text-cyan-400 font-medium">Investissement Moyen</span>
                        </div>
                        <p className="text-white text-lg font-semibold">
                            €
                            {analytics?.totalInvested && analytics?.activeInvestments + analytics?.completedInvestments > 0
                                ? (
                                    analytics.totalInvested /
                                    (analytics.activeInvestments + analytics.completedInvestments)
                                ).toLocaleString()
                                : "0"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Performance
