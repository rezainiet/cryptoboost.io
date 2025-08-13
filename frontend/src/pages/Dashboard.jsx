"use client"

import { useState } from "react"
import { useAuthState, useSignOut } from "react-firebase-hooks/auth"
import { useNavigate, useLocation, Outlet } from "react-router-dom"
import { auth } from "../../firebase"

const Dashboard = () => {
    const [user] = useAuthState(auth)
    const [signOut] = useSignOut(auth)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const handleSignOut = async () => {
        await signOut()
        navigate("/")
    }

    const menuItems = [
        {
            icon: "📊",
            label: "Tableau de bord",
            route: "/dashboard",
            iconSvg: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586l-2 2V5H5v14h14v-1.586l2-2V19a1 1 0 01-1 1H4a1 1 0 01-1-1V4z",
        },
        {
            icon: "💼",
            label: "Mes Investissements",
            route: "/dashboard/investments",
            iconSvg: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        },
        {
            icon: "📈",
            label: "Performances",
            route: "/dashboard/performance",
            iconSvg: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",
        },
        {
            icon: "💰",
            label: "Portefeuille",
            route: "/dashboard/portfolio",
            iconSvg: "M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v13z",
        },
        {
            icon: "🔄",
            label: "Transactions",
            route: "/dashboard/transactions",
            iconSvg: "M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3",
        },
        { icon: "⚙️", label: "Paramètres", route: "/dashboard/settings", iconSvg: "M12 15a3 3 0 100-6 3 3 0 000 6z" },
    ]

    const handleMenuClick = (route) => {
        navigate(route)
        setSidebarOpen(false)
    }

    const isActiveRoute = (route) => {
        if (route === "/dashboard") {
            return location.pathname === "/dashboard"
        }
        return location.pathname.startsWith(route)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800/90 backdrop-blur-xl border-r border-teal-500/20 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-6 border-b border-teal-500/20">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-lg flex items-center justify-center">
                                <span className="text-slate-900 font-bold text-sm">CB</span>
                            </div>
                            <span className="text-white font-bold text-lg">Cryptoboost.io</span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
                            ✕
                        </button>
                    </div>

                    {/* User info */}
                    <div className="p-6 border-b border-teal-500/20">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full flex items-center justify-center">
                                <span className="text-slate-900 font-semibold text-sm">
                                    {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm">{user?.displayName || "Utilisateur"}</p>
                                <p className="text-gray-400 text-xs">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4">
                        <ul className="space-y-2">
                            {menuItems.map((item, index) => (
                                <li key={index}>
                                    <button
                                        onClick={() => handleMenuClick(item.route)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActiveRoute(item.route)
                                            ? "bg-lime-400/20 text-lime-400 border border-lime-400/30 shadow-lg shadow-lime-400/10"
                                            : "text-gray-300 hover:bg-teal-500/20 hover:text-white hover:shadow-md"
                                            }`}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        <span className="font-medium">{item.label}</span>
                                        {isActiveRoute(item.route) && <div className="ml-auto w-2 h-2 bg-lime-400 rounded-full"></div>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Sign out */}
                    <div className="p-4 border-t border-teal-500/20">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                            <span className="text-lg">🚪</span>
                            <span className="font-medium">Déconnexion</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:ml-64">
                {/* Top bar */}
                <header className="bg-slate-800/50 backdrop-blur-xl border-b border-teal-500/20 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden text-white hover:text-lime-400 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold text-white">
                                {menuItems.find((item) => isActiveRoute(item.route))?.label || "Tableau de bord"}
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex items-center space-x-2 bg-emerald-500/20 px-3 py-1 rounded-full">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                <span className="text-emerald-400 text-sm font-medium">En ligne</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Dashboard
