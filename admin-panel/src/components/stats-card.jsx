const StatsCard = ({ title, value, change, trend }) => {
    const isPositive = trend === "up"

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                    <p className="text-white text-2xl font-bold mb-2">{value}</p>
                    {change && (
                        <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={isPositive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}
                                />
                            </svg>
                            <span className="font-medium">{change}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default StatsCard
