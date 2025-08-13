"use client"

import { useState } from "react"

const DashboardHome = () => {
    const [stats, setStats] = useState([
        { title: "Solde Total", value: "€12,450", change: "+15.3%", positive: true },
        { title: "Investissements Actifs", value: "3", change: "+1", positive: true },
        { title: "Gains Aujourd'hui", value: "€245", change: "+8.2%", positive: true },
        { title: "ROI Moyen", value: "18.5%", change: "+2.1%", positive: true },
    ])

    const [activities] = useState([
        { type: "Investissement", amount: "€500", status: "Confirmé", time: "Il y a 2h", crypto: "ETH" },
        { type: "Gain", amount: "€75", status: "Reçu", time: "Il y a 4h", crypto: "BTC" },
        { type: "Investissement", amount: "€250", status: "En cours", time: "Il y a 6h", crypto: "SOL" },
    ])

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
                <h2 className="text-xl font-bold text-white mb-6">Activité Récente</h2>
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
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-semibold">{activity.amount}</p>
                                <p
                                    className={`text-xs ${activity.status === "Confirmé" || activity.status === "Reçu" ? "text-emerald-400" : "text-yellow-400"}`}
                                >
                                    {activity.status}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

export default DashboardHome
