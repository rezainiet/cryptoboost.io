const Portfolio = () => {
    const portfolioData = [
        { crypto: "ETH", amount: "2.45", value: "€4,890", change: "+12.5%", positive: true },
        { crypto: "BTC", amount: "0.15", value: "€6,750", change: "+8.2%", positive: true },
        { crypto: "SOL", amount: "45.2", value: "€2,260", change: "-3.1%", positive: false },
    ]

    return (
        <div className="space-y-6">
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Valeur Totale</h3>
                    <p className="text-2xl font-bold text-white">€13,900</p>
                    <p className="text-emerald-400 text-sm mt-1">+€1,240 (9.8%)</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Cryptomonnaies</h3>
                    <p className="text-2xl font-bold text-white">3</p>
                    <p className="text-gray-400 text-sm mt-1">ETH, BTC, SOL</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Performance 24h</h3>
                    <p className="text-2xl font-bold text-white">+7.2%</p>
                    <p className="text-emerald-400 text-sm mt-1">+€920</p>
                </div>
            </div>

            {/* Portfolio Holdings */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Mes Avoirs</h2>
                <div className="space-y-4">
                    {portfolioData.map((asset, index) => (
                        <div key={index} className="bg-slate-700/30 rounded-lg p-6 hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full flex items-center justify-center">
                                        <span className="text-slate-900 font-bold text-sm">{asset.crypto}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">{asset.crypto}</h3>
                                        <p className="text-gray-400 text-sm">
                                            {asset.amount} {asset.crypto}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-semibold">{asset.value}</p>
                                    <p className={`text-sm ${asset.positive ? "text-emerald-400" : "text-red-400"}`}>{asset.change}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Portfolio
