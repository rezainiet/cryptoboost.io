"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../../firebase"
import { useNavigate } from "react-router-dom"
import apiService from "../../services/apiService"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

const DashboardHome = () => {
    const [user] = useAuthState(auth)
    const navigate = useNavigate()
    const [stats, setStats] = useState([])
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showPackageModal, setShowPackageModal] = useState(false)
    const [currentTime, setCurrentTime] = useState(Date.now())

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now())
        }, 1000) // Update every second

        return () => clearInterval(interval)
    }, [])

    const calculateInvestmentProgress = (investment) => {
        if (investment.status !== "started" || !investment.startedAtMs || !investment.expectedCompletion) {
            return {
                elapsedTime: 0,
                remainingTime: 0,
                progressPercentage: 0,
                currentGains: 0,
                profitPerMinute: 0,
            }
        }

        const startTime = investment.startedAtMs
        const endTime = investment.expectedCompletion
        const totalDuration = endTime - startTime
        const elapsedTime = Math.max(0, currentTime - startTime)
        const remainingTime = Math.max(0, endTime - currentTime)

        const progressPercentage = Math.min(100, (elapsedTime / totalDuration) * 100)

        // Calculate profit details
        const investedAmount = investment.amountFiat
        const totalReturn = investment.package.returns
        const totalProfit = totalReturn - investedAmount
        const profitPerMinute = totalProfit / (totalDuration / (1000 * 60)) // profit per minute
        const currentGains = (elapsedTime / (1000 * 60)) * profitPerMinute

        return {
            elapsedTime,
            remainingTime,
            progressPercentage,
            currentGains: Math.min(currentGains, totalProfit),
            profitPerMinute,
            totalProfit,
            totalReturn,
            investedAmount,
            totalDurationMinutes: Math.ceil(totalDuration / (1000 * 60)),
        }
    }

    const generateMinuteHistory = (progressData) => {
        const history = []
        const { investedAmount, profitPerMinute } = progressData
        const currentMinute = Math.floor(progressData.elapsedTime / (1000 * 60))

        const maxMinute = Math.max(1, currentMinute + 1) // Show at least 1 minute, up to current + 1

        for (let minute = 1; minute <= maxMinute; minute++) {
            const capitalAtMinute = investedAmount + profitPerMinute * minute
            const open = minute === 1 ? investedAmount : investedAmount + profitPerMinute * (minute - 1)
            const close = capitalAtMinute
            const high = close + profitPerMinute * 0.1 // Small variation for realistic look
            const low = open - profitPerMinute * 0.05

            history.push({
                minute,
                capital: capitalAtMinute,
                open,
                high,
                low,
                close,
                isPast: minute <= currentMinute,
                isCurrent: minute === currentMinute + 1,
                fillOpacity: minute <= currentMinute ? 0.8 : 0.6,
            })
        }

        return history
    }

    const formatDuration = (milliseconds) => {
        const totalMinutes = Math.floor(milliseconds / (1000 * 60))
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    }

    const packages = [
        {
            title: "Package Starter",
            subtitle: "Parfait pour débuter dans l'investissement automatisé",
            investment: 150,
            returns: 1200,
            actualReturns: 4800,
            timeframe: "2 heures",
            apy: "800%",
            token: "ETH",
            tokenIcon: "Ξ",
            robotType: "single",
            popular: false,
            cryptoOptions: ["ETH", "SOL", "BTC"],
            accentColor: "from-cyan-400 to-blue-500",
            glowColor: "cyan-400",
        },
        {
            title: "Package Standard",
            subtitle: "Équilibre parfait entre risque et rendement",
            investment: 250,
            returns: 2400,
            actualReturns: 6780,
            timeframe: "3 heures",
            apy: "960%",
            token: "ETH",
            tokenIcon: "Ξ",
            robotType: "single",
            popular: true,
            cryptoOptions: ["ETH", "SOL", "BTC"],
            accentColor: "from-purple-400 to-pink-500",
            glowColor: "purple-400",
        },
        {
            title: "Package Premium",
            subtitle: "Maximisez vos rendements avec notre stratégie avancée",
            investment: 400,
            returns: 3700,
            actualReturns: 9800,
            timeframe: "3 heures",
            apy: "925%",
            token: "SOL",
            tokenIcon: "◎",
            robotType: "double",
            popular: false,
            cryptoOptions: ["ETH", "SOL", "BTC"],
            accentColor: "from-orange-400 to-red-500",
            glowColor: "orange-400",
        },
        {
            title: "Package Elite",
            subtitle: "Pour les investisseurs expérimentés cherchant les meilleurs rendements",
            investment: 750,
            returns: 7100,
            actualReturns: 9600,
            timeframe: "2.5 heures",
            apy: "947%",
            token: "BTC",
            tokenIcon: "₿",
            robotType: "triple",
            popular: false,
            cryptoOptions: ["ETH", "SOL", "BTC"],
            accentColor: "from-emerald-400 to-teal-500",
            glowColor: "emerald-400",
        },
    ]

    const handlePackageSelect = (pkg) => {
        setShowPackageModal(false)
        navigate("/payment", { state: { package: pkg, network: "BTC" } })
    }

    const openPackageSelection = () => {
        setShowPackageModal(true)
    }

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.email) return

            try {
                setLoading(true)
                setError(null)

                // Fetch dashboard stats and active investments in parallel
                const [statsResponse, activeInvestmentsResponse] = await Promise.all([
                    apiService.getDashboardStats(user.email),
                    apiService.getActiveInvestments(user.email),
                ])

                // Update stats cards with real data
                if (statsResponse.success) {
                    const { stats: dashboardStats } = statsResponse
                    setStats([
                        {
                            title: "Solde Total",
                            value: `€${dashboardStats.totalBalance.toLocaleString()}`,
                            change: dashboardStats.totalBalance > 0 ? "+15.3%" : "0%",
                            positive: dashboardStats.totalBalance > 0,
                        },
                        {
                            title: "Investissements Actifs",
                            value: dashboardStats.activeInvestments.toString(),
                            change: dashboardStats.activeInvestments > 0 ? `+${dashboardStats.activeInvestments}` : "0",
                            positive: dashboardStats.activeInvestments > 0,
                        },
                        {
                            title: "Gains Aujourd'hui",
                            value: `€${dashboardStats.todayGains.toLocaleString()}`,
                            change: dashboardStats.todayGains > 0 ? "+8.2%" : "0%",
                            positive: dashboardStats.todayGains > 0,
                        },
                        {
                            title: "ROI Moyen",
                            value: `${dashboardStats.avgROI}%`,
                            change: dashboardStats.avgROI > 0 ? `+${dashboardStats.avgROI}%` : "0%",
                            positive: dashboardStats.avgROI > 0,
                        },
                    ])
                }

                if (activeInvestmentsResponse.success) {
                    const recentActivities = activeInvestmentsResponse.activeInvestments.slice(0, 5).map((order) => ({
                        ...order, // Include all original data
                        type:
                            order.status === "pending" ? "Investissement" : order.status === "started" ? "En cours" : "En traitement",
                        amount: `€${order.amountFiat.toLocaleString()}`,
                        displayStatus:
                            order.status === "pending" ? "En attente" : order.status === "started" ? "Actif" : "Confirmé",
                        time: formatTimeAgo(order.createdAtMs),
                        crypto: order.network,
                        progress: order.progress || 0,
                    }))
                    setActivities(recentActivities)
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err)
                setError("Erreur lors du chargement des données")
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [user?.email])

    const formatTimeAgo = (timestamp) => {
        const now = Date.now()
        const diff = now - timestamp
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor(diff / (1000 * 60))

        if (hours > 0) {
            return `Il y a ${hours}h`
        } else if (minutes > 0) {
            return `Il y a ${minutes}min`
        } else {
            return "À l'instant"
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
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-4 lg:p-6 hover:border-lime-400/30 transition-all duration-300 hover:transform hover:scale-105"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-gray-400 text-xs lg:text-sm font-medium">{stat.title}</h3>
                            <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${stat.positive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                            >
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-xl lg:text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-slate-700/30">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg lg:text-xl font-bold text-white">Investissements Actifs</h2>
                        {activities.length > 0 && (
                            <span className="text-sm text-gray-400 bg-slate-700/30 px-3 py-1 rounded-full">
                                {activities.length} investissement{activities.length > 1 ? "s" : ""} en cours
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-4 lg:p-6">
                    {activities.length === 0 ? (
                        <div className="text-center py-12">
                            <button
                                onClick={openPackageSelection}
                                className="w-20 h-20 bg-gradient-to-r from-lime-400/20 to-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-6 hover:from-lime-400/30 hover:to-emerald-400/30 transition-all duration-300 transform hover:scale-110 group"
                            >
                                <svg
                                    className="w-10 h-10 text-gray-400 group-hover:text-lime-400 transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </button>
                            <p className="text-gray-300 mb-2 text-lg font-medium">Aucun investissement actif</p>
                            <p className="text-sm text-gray-500">Commencez par choisir un package d'investissement</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activities.map((activity, index) => {
                                const progressData = activity.status === "started" ? calculateInvestmentProgress(activity) : null

                                return (
                                    <div
                                        key={index}
                                        className="bg-slate-700/30 rounded-xl p-4 lg:p-6 hover:bg-slate-700/50 transition-all duration-300 border border-slate-600/20"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-slate-900 font-bold text-sm">{activity.crypto}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white font-medium text-lg">{activity.type}</p>
                                                    <p className="text-gray-400 text-sm">{activity.time}</p>
                                                    {activity.orderId && (
                                                        <p className="text-xs text-gray-500 font-mono">ID: {activity.orderId.slice(-8)}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <p className="text-white font-bold text-xl">{activity.amount}</p>
                                                <p
                                                    className={`text-sm font-medium ${activity.displayStatus === "Confirmé" || activity.displayStatus === "Reçu"
                                                        ? "text-emerald-400"
                                                        : activity.displayStatus === "En attente"
                                                            ? "text-yellow-400"
                                                            : activity.displayStatus === "Actif"
                                                                ? "text-lime-400"
                                                                : "text-blue-400"
                                                        }`}
                                                >
                                                    {activity.displayStatus}
                                                </p>
                                            </div>
                                        </div>

                                        {activity.status === "started" && progressData && (
                                            <div className="bg-slate-800/50 rounded-xl p-4 lg:p-6 border border-lime-400/20">
                                                <div className="mb-6">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-sm font-medium text-gray-300">Progression</span>
                                                        <span className="text-lg font-bold text-lime-400 font-mono">
                                                            {progressData.progressPercentage.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-lime-400 to-emerald-400 h-4 rounded-full transition-all duration-1000 relative overflow-hidden"
                                                            style={{ width: `${progressData.progressPercentage}%` }}
                                                        >
                                                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="border-t border-slate-600/30 pt-6">
                                                    <h4 className="text-base font-bold text-white mb-4 flex items-center">
                                                        <svg
                                                            className="w-5 h-5 mr-3 text-lime-400"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                                            />
                                                        </svg>
                                                        Historique Minute par Minute
                                                    </h4>
                                                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-4 lg:p-6">
                                                        <div className="relative">
                                                            <div className="h-[280px] w-full">
                                                                {(() => {
                                                                    const chartData = generateMinuteHistory(progressData)
                                                                    const currentMinute = Math.floor(progressData.elapsedTime / (1000 * 60)) + 1

                                                                    return (
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                                                                <defs>
                                                                                    <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                                                                                        <stop offset="0%" stopColor="#84cc16" stopOpacity={0.8} />
                                                                                        <stop offset="50%" stopColor="#22c55e" stopOpacity={0.4} />
                                                                                        <stop offset="100%" stopColor="#059669" stopOpacity={0.1} />
                                                                                    </linearGradient>
                                                                                    <linearGradient id="futureGradient" x1="0" y1="0" x2="0" y2="1">
                                                                                        <stop offset="0%" stopColor="#64748b" stopOpacity={0.3} />
                                                                                        <stop offset="100%" stopColor="#475569" stopOpacity={0.1} />
                                                                                    </linearGradient>
                                                                                </defs>

                                                                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" strokeOpacity={0.3} />

                                                                                <XAxis
                                                                                    dataKey="minute"
                                                                                    axisLine={false}
                                                                                    tickLine={false}
                                                                                    tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
                                                                                    tickFormatter={(value) => `${value}m`}
                                                                                    interval="preserveStartEnd"
                                                                                />

                                                                                <YAxis
                                                                                    axisLine={false}
                                                                                    tickLine={false}
                                                                                    tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
                                                                                    tickFormatter={(value) => `€${value.toFixed(0)}`}
                                                                                    domain={["dataMin - 10", "dataMax + 10"]}
                                                                                />

                                                                                <Tooltip
                                                                                    contentStyle={{
                                                                                        backgroundColor: "#1e293b",
                                                                                        border: "1px solid #475569",
                                                                                        borderRadius: "8px",
                                                                                        color: "#f1f5f9",
                                                                                        fontSize: "12px",
                                                                                        fontFamily: "monospace",
                                                                                    }}
                                                                                    formatter={(value, name) => [
                                                                                        `€${value.toFixed(2)}`,
                                                                                        name === "capital" ? "Capital" : name,
                                                                                    ]}
                                                                                    labelFormatter={(label) => `Minute ${label}`}
                                                                                />

                                                                                <Area
                                                                                    type="monotone"
                                                                                    dataKey="capital"
                                                                                    stroke="#84cc16"
                                                                                    strokeWidth={3}
                                                                                    fill="url(#capitalGradient)"
                                                                                    fillOpacity={(entry) => (entry?.isPast ? 0.6 : 0.1)}
                                                                                    dot={(props) => {
                                                                                        const { cx, cy, payload } = props
                                                                                        if (!payload) return null

                                                                                        return (
                                                                                            <circle
                                                                                                cx={cx}
                                                                                                cy={cy}
                                                                                                r={payload.isCurrent ? 6 : payload.isPast ? 4 : 2}
                                                                                                fill={
                                                                                                    payload.isCurrent ? "#84cc16" : payload.isPast ? "#22c55e" : "#64748b"
                                                                                                }
                                                                                                stroke={payload.isCurrent ? "#1e293b" : "none"}
                                                                                                strokeWidth={payload.isCurrent ? 2 : 0}
                                                                                                className={payload.isCurrent ? "animate-pulse" : ""}
                                                                                            />
                                                                                        )
                                                                                    }}
                                                                                    activeDot={{
                                                                                        r: 6,
                                                                                        fill: "#84cc16",
                                                                                        stroke: "#1e293b",
                                                                                        strokeWidth: 2,
                                                                                    }}
                                                                                />
                                                                            </AreaChart>
                                                                        </ResponsiveContainer>
                                                                    )
                                                                })()}
                                                            </div>

                                                            <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-lime-400/30">
                                                                <div className="text-xs text-gray-400 mb-1">TEMPS ÉCOULÉ</div>
                                                                <div className="text-lime-400 font-mono font-bold">
                                                                    {formatDuration(progressData.elapsedTime)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-6 pt-4 border-t border-slate-600/30">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                                                    <div className="text-gray-400 text-xs font-medium mb-1">DÉBUT</div>
                                                                    <div className="text-white font-mono font-bold">€{progressData.investedAmount}</div>
                                                                </div>
                                                                <div className="text-center p-3 bg-lime-400/10 rounded-lg border border-lime-400/20">
                                                                    <div className="text-gray-400 text-xs font-medium mb-1">ACTUEL</div>
                                                                    <div className="text-lime-400 font-mono font-bold text-lg">
                                                                        €{(progressData.investedAmount + progressData.currentGains).toFixed(2)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6 pt-4 border-t border-slate-600/30">
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm">
                                                        <span className="text-gray-400">
                                                            Investissement:{" "}
                                                            <span className="text-white font-semibold">€{progressData.investedAmount}</span>
                                                        </span>
                                                        <span className="text-gray-400">
                                                            Gains actuels:{" "}
                                                            <span className="text-lime-400 font-bold">€{progressData.currentGains.toFixed(2)}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activity.status !== "started" && activity.progress > 0 && (
                                            <div className="mt-4">
                                                <div className="w-full bg-gray-700 rounded-full h-3">
                                                    <div
                                                        className="bg-lime-400 h-3 rounded-full transition-all duration-300"
                                                        style={{ width: `${activity.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showPackageModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 lg:p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl lg:text-3xl font-bold text-white">Choisir un Package</h2>
                                <button
                                    onClick={() => setShowPackageModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                {packages.map((pkg, index) => (
                                    <div key={index} className="relative group transform transition-all duration-300 hover:scale-105">
                                        <div className="relative bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-600/30 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                                            {pkg.popular && (
                                                <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold z-20 shadow-lg shadow-purple-500/25 animate-pulse">
                                                    POPULAIRE
                                                </div>
                                            )}

                                            <div className="relative p-6 lg:p-8 z-10">
                                                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 font-mono tracking-wide">
                                                    {pkg.title}
                                                </h3>
                                                <p className="text-slate-400 text-sm lg:text-base mb-6 leading-relaxed">{pkg.subtitle}</p>

                                                <div className="space-y-4 mb-8">
                                                    <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                                                        <span className="text-slate-400 font-mono text-xs lg:text-sm">INVESTISSEMENT</span>
                                                        <span className="font-bold text-white font-mono text-lg">
                                                            €{pkg.investment.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                                                        <span className="text-slate-400 font-mono text-xs lg:text-sm">GAIN ESTIMÉ</span>
                                                        <span className={`font-bold text-${pkg.glowColor} font-mono text-lg`}>
                                                            €{pkg.returns.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                                                        <span className="text-slate-400 font-mono text-xs lg:text-sm">DURÉE</span>
                                                        <span className="font-bold text-white font-mono text-lg">{pkg.timeframe}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handlePackageSelect(pkg)}
                                                    className={`w-full bg-gradient-to-r ${pkg.accentColor} hover:shadow-lg hover:shadow-${pkg.glowColor}/25 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 font-mono tracking-wider text-lg`}
                                                >
                                                    CHOISIR
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DashboardHome
