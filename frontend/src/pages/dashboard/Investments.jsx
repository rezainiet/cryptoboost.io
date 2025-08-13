"use client"

import { useState } from "react"

const Investments = () => {
    const [investments] = useState([
        {
            id: 1,
            package: "Package Premium",
            amount: "€500",
            expectedReturn: "€7,800",
            progress: 75,
            status: "Actif",
            timeRemaining: "45 minutes",
            crypto: "ETH",
        },
        {
            id: 2,
            package: "Package Starter",
            amount: "€250",
            expectedReturn: "€5,000",
            progress: 100,
            status: "Terminé",
            timeRemaining: "Terminé",
            crypto: "BTC",
        },
        {
            id: 3,
            package: "Package Elite",
            amount: "€750",
            expectedReturn: "€9,200",
            progress: 25,
            status: "Actif",
            timeRemaining: "2h 15min",
            crypto: "SOL",
        },
    ])

    return (
        <div className="space-y-6">
            {/* Investment Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Total Investi</h3>
                    <p className="text-2xl font-bold text-white">€1,500</p>
                    <p className="text-emerald-400 text-sm mt-1">+€500 ce mois</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Retour Attendu</h3>
                    <p className="text-2xl font-bold text-white">€22,000</p>
                    <p className="text-lime-400 text-sm mt-1">ROI: 1,367%</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Investissements Actifs</h3>
                    <p className="text-2xl font-bold text-white">2</p>
                    <p className="text-yellow-400 text-sm mt-1">En cours</p>
                </div>
            </div>

            {/* Active Investments */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Mes Investissements</h2>
                <div className="space-y-4">
                    {investments.map((investment) => (
                        <div key={investment.id} className="bg-slate-700/30 rounded-lg p-6 hover:bg-slate-700/50 transition-colors">
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
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${investment.status === "Actif"
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-lime-500/20 text-lime-400"
                                            }`}
                                    >
                                        {investment.status}
                                    </span>
                                    <p className="text-gray-400 text-sm mt-1">{investment.timeRemaining}</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-2">
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
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Investments
