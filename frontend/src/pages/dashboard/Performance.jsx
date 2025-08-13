const Performance = () => {
    const performanceData = [
        { period: "Aujourd'hui", profit: "€245", percentage: "+8.2%" },
        { period: "Cette semaine", profit: "€1,680", percentage: "+12.5%" },
        { period: "Ce mois", profit: "€6,420", percentage: "+18.7%" },
        { period: "Total", profit: "€15,890", percentage: "+24.3%" },
    ]

    return (
        <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {performanceData.map((data, index) => (
                    <div key={index} className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                        <h3 className="text-gray-400 text-sm font-medium mb-2">{data.period}</h3>
                        <p className="text-2xl font-bold text-white">{data.profit}</p>
                        <p className="text-emerald-400 text-sm mt-1">{data.percentage}</p>
                    </div>
                ))}
            </div>

            {/* Performance Chart Placeholder */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Graphique de Performance</h2>
                <div className="h-64 bg-slate-700/30 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Graphique de performance à venir</p>
                </div>
            </div>
        </div>
    )
}

export default Performance
