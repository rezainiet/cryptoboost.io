"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../firebase"
import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import StatsCard from "./stats-card"
import ChartCard from "./chart-card"
import UserManagement from "./user-management"
import PerformanceMonitor from "./performance-monitor"
import InvestedUsers from "./InvestedUsers"
import NonInvestedUsers from "./NonInvestedUsers"
import Transactions from "./Transactions"

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("overview")
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [investmentStats, setInvestmentStats] = useState(null)
    const [userStats, setUserStats] = useState(null)
    const [performanceStats, setPerformanceStats] = useState(null)
    const [loading, setLoading] = useState(false)
    const [user] = useAuthState(auth)
    const navigate = useNavigate()

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "user-email": user?.email || "",
                },
                body: JSON.stringify({
                    userEmail: user?.email || "",
                }),
            }

            // Fetch investment statistics
            const investmentResponse = await fetch("https://api.cryptoboost.capital/api/admin/investments/stats", requestOptions)
            const investmentResult = await investmentResponse.json()

            // Fetch user statistics
            const userResponse = await fetch("https://api.cryptoboost.capital/api/admin/users/stats", requestOptions)
            const userResult = await userResponse.json()

            // Fetch performance statistics
            const performanceResponse = await fetch("https://api.cryptoboost.capital/api/admin/performance/stats", requestOptions)
            const performanceResult = await performanceResponse.json()

            // Fetch daily investment trends
            const trendsResponse = await fetch("https://api.cryptoboost.capital/api/admin/investments/trends?days=7", requestOptions)
            const trendsResult = await trendsResponse.json()

            // Fetch investment by currency breakdown
            const currencyResponse = await fetch("https://api.cryptoboost.capital/api/admin/investments/by-currency", requestOptions)
            const currencyResult = await currencyResponse.json()

            setInvestmentStats({
                totalInvested: investmentResult.data?.totalInvested || 0,
                recentInvestments: investmentResult.data?.recentInvestments || { total: 0 },
                dailyTrends: investmentResult.data?.dailyTrends || [],
                investmentByCurrency: investmentResult.data?.investmentByCurrency || [],
            })

            setUserStats({
                totalUsers: userResult.data?.totalUsers || 0,
                activeUsers: userResult.data?.activeUsers || 0,
                newUsers: userResult.data?.newUsers || 0,
            })

            setPerformanceStats({
                orderStats: {
                    completionRate: performanceResult.data?.orderStats?.completionRate || 0,
                    completed: performanceResult.data?.orderStats?.completed || 0,
                },
                networkPerformance: performanceResult.data?.networkPerformance || [],
            })
        } catch (error) {
            console.error("Error fetching dashboard data:", error)
            setInvestmentStats({
                totalInvested: 0,
                recentInvestments: { total: 0 },
                dailyTrends: [],
                investmentByCurrency: [],
            })
            setUserStats({
                totalUsers: 0,
                activeUsers: 0,
                newUsers: 0,
            })
            setPerformanceStats({
                orderStats: { completionRate: 0, completed: 0 },
                networkPerformance: [],
            })
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            await signOut(auth)
            navigate("/admin/login")
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    const tabs = [
        { id: "overview", label: "Overview", icon: "📊" },
        { id: "users", label: "User Management", icon: "👥" },
        { id: "performance", label: "Performance", icon: "⚡" },
    ]

    useEffect(() => {
        fetchDashboardData()

        // Set up auto-refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 300000)

        return () => clearInterval(interval)
    }, [])

    const handleRefresh = () => {
        fetchDashboardData()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading dashboard...</div>
            </div>
        )
    }

    const renderOverview = () => {
        const statsData = [
            {
                title: "Total Invested",
                value: `€${investmentStats?.totalInvested?.toLocaleString() || "0"}`,
                change:
                    investmentStats?.recentInvestments?.total > 0
                        ? `+${((investmentStats.recentInvestments.total / investmentStats.totalInvested) * 100).toFixed(1)}%`
                        : "0%",
                trend: "up",
            },
            {
                title: "Total Users",
                value: userStats?.totalUsers?.toLocaleString() || "0",
                change: userStats?.newUsers > 0 ? `+${userStats.newUsers}` : "0",
                trend: userStats?.newUsers > 0 ? "up" : "neutral",
            },
            {
                title: "Active Users",
                value: userStats?.activeUsers?.toLocaleString() || "0",
                change:
                    userStats?.totalUsers > 0 ? `${((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(1)}%` : "0%",
                trend: "up",
            },
            {
                title: "Success Rate",
                value: `${performanceStats?.orderStats?.completionRate || "0"}%`,
                change:
                    performanceStats?.orderStats?.completed > 0
                        ? `${performanceStats.orderStats.completed} completed`
                        : "0 completed",
                trend: Number.parseFloat(performanceStats?.orderStats?.completionRate || 0) > 80 ? "up" : "down",
            },
        ]

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsData.map((stat, index) => (
                        <StatsCard key={index} {...stat} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Investment Trends" subtitle="Last 7 days">
                        <div className="h-64 flex items-center justify-center">
                            <div className="text-center">
                                <div className="flex items-end justify-center gap-2 mb-4">
                                    {investmentStats?.dailyTrends?.map((day, index) => (
                                        <div key={index} className="flex flex-col items-center">
                                            <div
                                                className="bg-blue-500 rounded-t-sm opacity-70 mb-1"
                                                style={{
                                                    width: "12px",
                                                    height: `${Math.max(20, (day.total / Math.max(...investmentStats.dailyTrends.map((d) => d.total))) * 100)}px`,
                                                }}
                                            ></div>
                                            <span className="text-xs text-slate-400">{day._id.split("-")[2]}</span>
                                        </div>
                                    )) ||
                                        Array.from({ length: 7 }, (_, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <div className="bg-blue-500 rounded-t-sm opacity-70 mb-1 w-3 h-8"></div>
                                                <span className="text-xs text-slate-400">{i + 1}</span>
                                            </div>
                                        ))}
                                </div>
                                <div className="text-xs text-slate-500">Daily Investment Volume</div>
                            </div>
                        </div>
                    </ChartCard>

                    <div className="space-y-6">
                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white text-lg font-semibold">Investment by Currency</h3>
                            </div>
                            <div className="space-y-3">
                                {investmentStats?.investmentByCurrency?.map((currency, index) => (
                                    <div key={index} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-white font-medium">{currency._id}</p>
                                            <p className="text-slate-400 text-sm">{currency.count} orders</p>
                                        </div>
                                        <p className="text-slate-300 text-sm">€{currency.total.toLocaleString()}</p>
                                    </div>
                                )) || <div className="text-slate-400 text-center py-4">No data available</div>}
                            </div>
                        </div>

                        <ChartCard title="Network Performance" subtitle="Success rates">
                            <div className="h-32 flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {performanceStats?.networkPerformance?.map((network, index) => (
                                        <div key={index} className="text-center">
                                            <div className="text-white font-semibold">{network._id}</div>
                                            <div className="text-2xl font-bold text-blue-400">{network.successRate.toFixed(1)}%</div>
                                            <div className="text-xs text-slate-400">{network.total} orders</div>
                                        </div>
                                    )) || <div className="col-span-2 text-slate-400 text-center">No data available</div>}
                                </div>
                            </div>
                        </ChartCard>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 flex">
            {/* Mobile backdrop */}
            {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={toggleSidebar} />}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700">
                        <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                        <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4">
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${activeTab === "overview"
                                        ? "bg-slate-700 text-white"
                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                        }`}
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                                        />
                                    </svg>
                                    Dashboard
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab("users")}
                                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${activeTab === "users"
                                        ? "bg-slate-700 text-white"
                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                        }`}
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                        />
                                    </svg>
                                    Users
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab("performance")}
                                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${activeTab === "performance"
                                        ? "bg-slate-700 text-white"
                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                        }`}
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 002-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    Analytics
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab("investedUsers")}
                                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${activeTab === "investedUsers"
                                        ? "bg-slate-700 text-white"
                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                        }`}
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 002-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    Invested Users
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab("NonInvestedUsers")}
                                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${activeTab === "NonInvestedUsers"
                                        ? "bg-slate-700 text-white"
                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                        }`}
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 002-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    Non Invested Users
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab("Transactions")}
                                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${activeTab === "Transactions"
                                        ? "bg-slate-700 text-white"
                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                        }`}
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 002-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    Transactions
                                </button>
                            </li>
                        </ul>
                    </nav>

                    {/* User info and logout */}
                    <div className="p-4 border-t border-slate-700">
                        {user && (
                            <div className="mb-4">
                                <p className="text-sm text-slate-400">Signed in as:</p>
                                <p className="text-white font-medium truncate">{user.email}</p>
                            </div>
                        )}

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-2 text-slate-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile header */}
                <div className="lg:hidden bg-slate-800 border-b border-slate-700 p-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                        <button onClick={toggleSidebar} className="text-slate-400 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="flex-1 p-6">
                    {/* Header - hidden on mobile */}
                    <div className="mb-8 hidden lg:block">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                                <p className="text-slate-400">Monitor investments, manage users, and validate performance</p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                            >
                                <svg
                                    className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                {loading ? "Refreshing..." : "Refresh"}
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {activeTab === "overview" && renderOverview()}
                    {activeTab === "users" && <UserManagement />}
                    {activeTab === "performance" && <PerformanceMonitor performanceStats={performanceStats} />}
                    {activeTab === "investedUsers" && <InvestedUsers />}
                    {activeTab === "NonInvestedUsers" && <NonInvestedUsers />}
                    {activeTab === "Transactions" && <Transactions />}

                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
