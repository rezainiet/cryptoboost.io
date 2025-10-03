"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../../firebase"
import {
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    AreaChart,
    Area,
    Tooltip,
} from "recharts"

const Card = ({ children, className = "" }) => (
    <div className={`bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl ${className}`}>{children}</div>
)

const CardHeader = ({ children, className = "" }) => <div className={`p-6 pb-2 ${className}`}>{children}</div>

const CardTitle = ({ children, className = "" }) => (
    <h3 className={`text-xl font-bold text-white ${className}`}>{children}</h3>
)

const CardDescription = ({ children, className = "" }) => (
    <p className={`text-gray-400 text-sm mt-1 ${className}`}>{children}</p>
)

const CardContent = ({ children, className = "" }) => <div className={`p-6 pt-2 ${className}`}>{children}</div>

const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
                {label && <p className="text-white font-medium mb-2">{label}</p>}
                {formatter
                    ? formatter(payload, label)
                    : payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {typeof entry.value === "number" ? `€${entry.value.toLocaleString()}` : entry.value}
                        </p>
                    ))}
            </div>
        )
    }
    return null
}

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

                const response = await fetch(`https://cryptoboost-io.onrender.com/payments/analytics/${user.email}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        // Add any authentication headers if needed
                        // 'Authorization': `Bearer ${token}`
                    },
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const result = await response.json()

                if (result.success && result.analytics) {
                    const data = result.analytics
                    setAnalytics(data)

                    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format
                    const currentWeek = `${new Date().getFullYear()}-W${String(Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) / 7)).padStart(2, "0")}`
                    const currentMonth = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })

                    const todayData = data.performanceTrends?.daily?.find((d) => d.date === today)
                    const weekData = data.performanceTrends?.weekly?.find((w) => w.week === currentWeek)
                    const monthData = data.performanceTrends?.monthly?.find((m) => m.month === currentMonth)

                    const todayProfit = todayData?.profit || 0
                    const weekProfit = weekData?.profit || 0
                    const monthProfit = monthData?.profit || 0

                    const sevenDayProfit = data.weeklyStats?.profit || 0

                    const totalInvested = data.totalInvested || 0
                    const totalReturns = data.totalReturns || 0
                    const totalProfit = totalReturns - totalInvested

                    const performanceItems = []

                    performanceItems.push({
                        period: "Aujourd'hui",
                        profit: `€${todayProfit.toLocaleString()}`,
                        percentage:
                            totalInvested > 0 && todayProfit !== 0
                                ? `${todayProfit >= 0 ? "+" : ""}${((todayProfit / totalInvested) * 100).toFixed(1)}%`
                                : "0%",
                        value: todayProfit,
                    })

                    performanceItems.push({
                        period: "7 derniers jours",
                        profit: `€${sevenDayProfit.toLocaleString()}`,
                        percentage:
                            totalInvested > 0 && sevenDayProfit !== 0
                                ? `${sevenDayProfit >= 0 ? "+" : ""}${((sevenDayProfit / totalInvested) * 100).toFixed(1)}%`
                                : "0%",
                        value: sevenDayProfit,
                    })

                    performanceItems.push({
                        period: "Ce mois",
                        profit: `€${monthProfit.toLocaleString()}`,
                        percentage:
                            totalInvested > 0 && monthProfit !== 0
                                ? `${monthProfit >= 0 ? "+" : ""}${((monthProfit / totalInvested) * 100).toFixed(1)}%`
                                : "0%",
                        value: monthProfit,
                    })

                    performanceItems.push({
                        period: "Total",
                        profit: `€${totalProfit.toLocaleString()}`,
                        percentage: `${totalProfit >= 0 ? "+" : ""}${data.roi || 0}%`,
                        value: totalProfit,
                    })

                    setPerformanceData(performanceItems)
                } else {
                    throw new Error(result.message || "Failed to fetch analytics")
                }
            } catch (err) {
                console.error("Error fetching analytics:", err)
                setError(`Erreur lors du chargement des analyses: ${err.message}`)
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [user?.email])

    const chartConfig = {
        profit: {
            label: "Profit",
            color: "hsl(var(--chart-1))",
        },
        invested: {
            label: "Investi",
            color: "hsl(var(--chart-2))",
        },
        returns: {
            label: "Retours",
            color: "hsl(var(--chart-3))",
        },
    }

    const networkColors = {
        BTC: "#f7931a",
        ETH: "#627eea",
        TRC20: "#00d4aa",
        SOL: "#9945ff",
        USDT: "#26a17b",
        BNB: "#f3ba2f",
        MATIC: "#8247e5",
        AVAX: "#e84142",
        DOT: "#e6007a",
        ADA: "#0033ad",
        LINK: "#375bd2",
    }

    const renderNetworkDistribution = () => {
        if (!analytics?.networkDistribution) {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>Distribution par Réseau</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <p className="text-gray-400">Aucune donnée de distribution disponible</p>
                            <p className="text-gray-500 text-sm mt-2">Commencez à investir pour voir vos statistiques</p>
                        </div>
                    </CardContent>
                </Card>
            )
        }

        const networks = Object.entries(analytics.networkDistribution)
        if (networks.length === 0) {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>Distribution par Réseau</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <p className="text-gray-400">Aucun investissement trouvé</p>
                            <p className="text-gray-500 text-sm mt-2">Vos investissements apparaîtront ici</p>
                        </div>
                    </CardContent>
                </Card>
            )
        }

        const total = networks.reduce((sum, [, networkData]) => sum + (networkData?.amount || 0), 0)

        const pieData = networks.map(([network, networkData]) => ({
            name: network,
            value: networkData?.amount || 0,
            percentage: networkData?.percentage?.toFixed(1) || "0.0",
        }))

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Distribution par Réseau</CardTitle>
                </CardHeader>
                <CardContent>
                    {total > 0 ? (
                        <>
                            <div className="h-[300px] mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={networkColors[entry.name] || "#8884d8"} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={
                                                <CustomTooltip
                                                    formatter={(payload) => (
                                                        <>
                                                            <p className="text-white font-medium">{payload[0].payload.name}</p>
                                                            <p className="text-emerald-400">€{payload[0].payload.value.toLocaleString()}</p>
                                                            <p className="text-gray-400">{payload[0].payload.percentage}%</p>
                                                        </>
                                                    )}
                                                />
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="space-y-4">
                                {networks.map(([network, networkData]) => {
                                    const safeAmount = networkData?.amount || 0
                                    const percentage = networkData?.percentage?.toFixed(1) || "0.0"
                                    const count = networkData?.count || 0

                                    return (
                                        <div key={network} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: networkColors[network] || "#8884d8" }}
                                                >
                                                    <span className="text-white font-bold text-xs">{network}</span>
                                                </div>
                                                <div>
                                                    <span className="text-white font-medium">{network}</span>
                                                    <p className="text-gray-400 text-xs">
                                                        {count} investissement{count > 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-semibold">€{safeAmount.toLocaleString()}</p>
                                                <p className="text-gray-400 text-sm">{percentage}%</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-400">Aucun investissement actuel</p>
                            <p className="text-gray-500 text-sm mt-2">Commencez à investir pour voir la distribution</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    const renderMonthlyPerformance = () => {
        if (!analytics?.monthlyPerformance || !Array.isArray(analytics.monthlyPerformance)) return null

        const chartData = analytics.monthlyPerformance.map((month, index) => ({
            month: month.month || `Mois ${index + 1}`,
            invested: month.invested || 0,
            returns: month.returns || 0,
            profit: month.profit || 0,
        }))

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Performance Mensuelle</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                                <YAxis stroke="#9CA3AF" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="invested" fill="#3B82F6" name="Investi" />
                                <Bar dataKey="returns" fill="#10B981" name="Retours" />
                                <Bar dataKey="profit" fill="#F59E0B" name="Profit" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                        {analytics.monthlyPerformance.map((month, index) => {
                            const invested = month.invested || 0
                            const returns = month.returns || 0
                            const profit = month.profit || 0
                            const profitPercentage = invested > 0 ? ((profit / invested) * 100).toFixed(1) : 0
                            const isPositive = profit >= 0

                            return (
                                <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                    <div>
                                        <p className="text-white font-medium">{month.month || `Mois ${index + 1}`}</p>
                                        <p className="text-gray-400 text-sm">Investi: €{invested.toLocaleString()}</p>
                                        <p className="text-gray-400 text-sm">Retours: €{returns.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                                            {isPositive ? "+" : ""}€{profit.toLocaleString()}
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
                </CardContent>
            </Card>
        )
    }

    const renderPerformanceTrend = () => {
        if (!analytics?.performanceTrends) {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>Tendance des Performances</CardTitle>
                        <CardDescription>Aucune donnée de tendance disponible</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <p className="text-gray-400">Aucune activité récente</p>
                            <p className="text-gray-500 text-sm mt-2">
                                Les tendances apparaîtront après vos premiers investissements
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )
        }

        const trendData =
            analytics.performanceTrends.daily?.length > 0
                ? analytics.performanceTrends.daily.slice(-7).map((day) => ({
                    period: new Date(day.date).toLocaleDateString("fr-FR", { weekday: "short" }),
                    value: day.profit || 0,
                    percentage: day.invested > 0 ? ((day.profit / day.invested) * 100).toFixed(1) : 0,
                }))
                : performanceData
                    .filter((data) => !data.isEmpty)
                    .map((data, index) => ({
                        period: data.period,
                        value: data.value,
                        percentage: Number.parseFloat(data.percentage.replace(/[+%]/g, "")) || 0,
                    }))

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Tendance des Performances</CardTitle>
                    <CardDescription>
                        {analytics.performanceTrends.daily?.length > 0
                            ? "Évolution des profits sur les 7 derniers jours"
                            : "Évolution des profits sur différentes périodes"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {trendData.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip
                                        content={
                                            <CustomTooltip
                                                formatter={(payload, label) => (
                                                    <>
                                                        <p className="text-white font-medium">{label}</p>
                                                        <p className="text-emerald-400">Profit: €{payload[0].payload.value.toLocaleString()}</p>
                                                        <p className="text-cyan-400">ROI: {payload[0].value}%</p>
                                                    </>
                                                )}
                                            />
                                        }
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="percentage"
                                        stroke="#10B981"
                                        fill="url(#colorGradient)"
                                        strokeWidth={2}
                                    />
                                    <defs>
                                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-400">Aucune donnée de tendance</p>
                            <p className="text-gray-500 text-sm mt-2">Commencez à investir pour voir les tendances</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    const getBestNetwork = () => {
        if (!analytics?.networkDistribution) return "N/A"

        const networks = Object.entries(analytics.networkDistribution)
        if (networks.length === 0) return "N/A"

        const bestNetwork = networks.reduce((best, current) => {
            const bestAmount = best[1]?.amount || 0
            const currentAmount = current[1]?.amount || 0
            return currentAmount > bestAmount ? current : best
        }, networks[0])

        return bestNetwork[0]
    }

    const getSuccessRate = () => {
        const active = analytics?.activeInvestments || 0
        const completed = analytics?.completedInvestments || 0
        const total = active + completed

        if (total === 0) return 0
        return ((completed / total) * 100).toFixed(1)
    }

    const getAverageInvestment = () => {
        const totalInvested = analytics?.totalInvested || 0
        const active = analytics?.activeInvestments || 0
        const completed = analytics?.completedInvestments || 0
        const total = active + completed

        if (total === 0 || totalInvested === 0) return 0
        return (totalInvested / total).toLocaleString()
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {performanceData.map((data, index) => (
                    <div
                        key={index}
                        className={`bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6 ${data.isEmpty ? "opacity-60" : ""}`}
                    >
                        <h3 className="text-gray-400 text-sm font-medium mb-2">{data.period}</h3>
                        <p className="text-2xl font-bold text-white">{data.profit}</p>
                        <p className={`text-sm mt-1 ${data.value >= 0 ? "text-emerald-400" : "text-red-400"}`}>{data.percentage}</p>
                        {data.isEmpty && <p className="text-xs text-gray-500 mt-1">Aucune activité</p>}
                    </div>
                ))}
            </div>

            {renderPerformanceTrend()}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Statistiques du Portefeuille</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Total Investi</span>
                            <span className="text-white font-semibold">€{(analytics?.totalInvested || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Retours Totaux</span>
                            <span className="text-emerald-400 font-semibold">€{(analytics?.totalReturns || 0).toLocaleString()}</span>
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

                {renderNetworkDistribution()}
            </div>

            {renderMonthlyPerformance()}

            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Insights de Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <span className="text-emerald-400 font-medium">Meilleur Réseau</span>
                        </div>
                        <p className="text-white text-lg font-semibold">{getBestNetwork()}</p>
                    </div>

                    <div className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                            <span className="text-lime-400 font-medium">Taux de Réussite</span>
                        </div>
                        <p className="text-white text-lg font-semibold">{getSuccessRate()}%</p>
                    </div>

                    <div className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                            <span className="text-cyan-400 font-medium">Investissement Moyen</span>
                        </div>
                        <p className="text-white text-lg font-semibold">€{getAverageInvestment()}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Performance
