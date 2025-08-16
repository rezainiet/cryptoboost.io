"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../../firebase"
import { apiService } from "../../services/apiService"

const DashboardHome = () => {
    const [user] = useAuthState(auth)
    const [stats, setStats] = useState([])
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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

                // Update activities with real active investments
                if (activeInvestmentsResponse.success) {
                    const recentActivities = activeInvestmentsResponse.activeInvestments.slice(0, 5).map((order) => ({
                        type: order.status === "pending" ? "Investissement" : "En traitement",
                        amount: `€${order.amountFiat.toLocaleString()}`,
                        status: order.status === "pending" ? "En attente" : "Confirmé",
                        time: formatTimeAgo(order.createdAtMs),
                        crypto: order.network,
                        orderId: order.orderId,
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
        <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6 hover:border-lime-400/30 transition-all duration-300"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-400 text-sm font-medium">{stat.title}</h3>
                            <span
                                className={`text-xs px-2 py-1 rounded-full ${stat.positive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                            >
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent activity */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Investissements Actifs</h2>
                    {activities.length > 0 && (
                        <span className="text-sm text-gray-400">
                            {activities.length} investissement{activities.length > 1 ? "s" : ""} en cours
                        </span>
                    )}
                </div>

                {activities.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-lime-400/20 to-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <p className="text-gray-400 mb-2">Aucun investissement actif</p>
                        <p className="text-sm text-gray-500">Commencez par choisir un package d'investissement</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full flex items-center justify-center">
                                        <span className="text-slate-900 font-bold text-xs">{activity.crypto}</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{activity.type}</p>
                                        <p className="text-gray-400 text-sm">{activity.time}</p>
                                        {activity.orderId && <p className="text-xs text-gray-500">ID: {activity.orderId.slice(-8)}</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-semibold">{activity.amount}</p>
                                    <p
                                        className={`text-xs ${activity.status === "Confirmé" || activity.status === "Reçu"
                                            ? "text-emerald-400"
                                            : activity.status === "En attente"
                                                ? "text-yellow-400"
                                                : "text-blue-400"
                                            }`}
                                    >
                                        {activity.status}
                                    </p>
                                    {activity.progress > 0 && (
                                        <div className="w-16 bg-gray-700 rounded-full h-1 mt-1">
                                            <div
                                                className="bg-lime-400 h-1 rounded-full transition-all duration-300"
                                                style={{ width: `${activity.progress}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}

export default DashboardHome
