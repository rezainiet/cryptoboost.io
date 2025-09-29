"use client"

const InvestmentOverview = ({ analytics, refreshing }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-teal-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-teal-400/30 transition-all duration-300">
                <h3 className="text-gray-400 text-xs sm:text-sm font-medium mb-2">Total Investi</h3>
                <p className="text-xl sm:text-3xl font-bold text-white mb-1">
                    €{analytics?.totalInvested?.toLocaleString() || "0"}
                </p>
                <p className="text-emerald-400 text-xs sm:text-sm">
                    {analytics?.activeInvestments || 0} investissement{(analytics?.activeInvestments || 0) !== 1 ? "s" : ""} actif
                    {(analytics?.activeInvestments || 0) !== 1 ? "s" : ""}
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
    )
}

export default InvestmentOverview
