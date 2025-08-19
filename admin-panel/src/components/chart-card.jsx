const ChartCard = ({ title, subtitle, children }) => {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-white text-lg font-semibold">{title}</h3>
                    {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
                </div>
            </div>

            <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700">
                {children || (
                    <div className="text-center">
                        {/* Mock chart visualization */}
                        <div className="flex items-end justify-center gap-1 mb-4">
                            {[30, 60, 45, 80, 55, 70, 40, 85, 65, 50, 75, 60].map((height, index) => (
                                <div
                                    key={index}
                                    className="bg-blue-500 rounded-t-sm opacity-70"
                                    style={{
                                        width: "8px",
                                        height: `${height}px`,
                                    }}
                                ></div>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 px-2">
                            <span>Jul 1</span>
                            <span>Jul 7</span>
                            <span>Jul 14</span>
                            <span>Jul 21</span>
                            <span>Jul 28</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChartCard
