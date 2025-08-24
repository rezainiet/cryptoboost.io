"use client"

import { useState, useEffect } from "react"

const EnhancedLiveBalanceCard = ({ investment }) => {
    const [currentBalance, setCurrentBalance] = useState(0)
    const [currentProfit, setCurrentProfit] = useState(0)
    const [timeRemaining, setTimeRemaining] = useState(0)
    const [elapsedMinutes, setElapsedMinutes] = useState(0)
    const [progressPercent, setProgressPercent] = useState(0)
    const [minuteHistory, setMinuteHistory] = useState([])
    const [chartData, setChartData] = useState([])

    // Calculate live balance based on elapsed time
    const calculateLiveBalance = () => {
        if (!investment || investment.status !== "started" || !investment.startedAtMs) {
            return {
                balance: investment?.package?.investment || 0,
                profit: 0,
                elapsed: 0,
                remaining: investment?.package?.timeframe * 60 || 0,
                progress: 0,
            }
        }

        const now = Date.now()
        const startTime = investment.startedAtMs
        const totalDurationMs = investment.package.timeframe * 60 * 60 * 1000 // Convert hours to ms
        const elapsedMs = now - startTime
        const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000))

        const investmentAmount = investment.package.investment
        const totalReturns = investment.package.returns
        const totalProfit = totalReturns - investmentAmount
        const totalMinutes = investment.package.timeframe * 60
        const profitPerMinute = totalProfit / totalMinutes

        // Calculate current values
        const progressValue = Math.min(elapsedMs / totalDurationMs, 1)
        const currentProfit = Math.min(totalProfit * progressValue, totalProfit)
        const currentBalance = investmentAmount + currentProfit
        const remainingMinutes = Math.max(totalMinutes - elapsedMinutes, 0)

        return {
            balance: currentBalance,
            profit: currentProfit,
            elapsed: elapsedMinutes,
            remaining: remainingMinutes,
            progress: progressValue * 100,
            profitPerMinute,
        }
    }

    // Generate minute-by-minute history
    const generateMinuteHistory = (elapsedMinutes, profitPerMinute, investmentAmount) => {
        const history = []
        for (let minute = 0; minute <= Math.min(elapsedMinutes, investment.package.timeframe * 60); minute++) {
            const profit = minute * profitPerMinute
            const balance = investmentAmount + profit
            history.push({
                minute: minute + 1,
                balance: balance,
                profit: profit,
            })
        }
        return history
    }

    // Generate chart data points
    const generateChartData = (history) => {
        return history.map((item, index) => ({
            x: (index / Math.max(history.length - 1, 1)) * 300, // Scale to 300px width
            y:
                80 -
                ((item.balance - investment.package.investment) /
                    (investment.package.returns - investment.package.investment)) *
                60, // Scale to chart height
        }))
    }

    // Update live data every minute
    useEffect(() => {
        const updateLiveData = () => {
            const liveData = calculateLiveBalance()
            setCurrentBalance(liveData.balance)
            setCurrentProfit(liveData.profit)
            setElapsedMinutes(liveData.elapsed)
            setTimeRemaining(liveData.remaining)
            setProgressPercent(liveData.progress)

            // Generate history and chart data
            if (liveData.profitPerMinute) {
                const history = generateMinuteHistory(liveData.elapsed, liveData.profitPerMinute, investment.package.investment)
                setMinuteHistory(history)
                setChartData(generateChartData(history))
            }
        }

        updateLiveData()
        const interval = setInterval(updateLiveData, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [investment])

    // Format time remaining
    const formatTimeRemaining = (minutes) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h${mins.toString().padStart(2, "0")}m`
    }

    // Create SVG path for smooth curve
    const createSmoothPath = (points) => {
        if (points.length < 2) return ""

        let path = `M ${points[0].x} ${points[0].y}`

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1]
            const curr = points[i]
            const next = points[i + 1]

            if (next) {
                const cp1x = prev.x + (curr.x - prev.x) * 0.5
                const cp1y = prev.y
                const cp2x = curr.x - (next.x - curr.x) * 0.5
                const cp2y = curr.y
                path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
            } else {
                path += ` L ${curr.x} ${curr.y}`
            }
        }

        return path
    }

    const isGaining = currentProfit > 0
    const profitColor = isGaining ? "#10b981" : "#ef4444"

    return (
        <div
            style={{
                background: "rgba(30, 41, 59, 0.8)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${isGaining ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "16px",
                boxShadow: `0 0 20px ${profitColor}20`,
            }}
        >
            {/* Header with Investment Info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h3 style={{ color: "white", fontSize: "18px", fontWeight: "600", margin: "0 0 4px 0" }}>
                        {investment.package.title}
                    </h3>
                    <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
                        Investissement: €{investment.package.investment} → €{investment.package.returns}
                    </p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <div
                            style={{
                                width: "8px",
                                height: "8px",
                                background: investment.status === "started" ? "#10b981" : "#6b7280",
                                borderRadius: "50%",
                                animation: investment.status === "started" ? "pulse 2s infinite" : "none",
                            }}
                        />
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                            {investment.status === "started" ? "En cours" : "En attente"}
                        </span>
                    </div>
                    <p style={{ color: "white", fontSize: "14px", margin: 0 }}>
                        Temps restant: {formatTimeRemaining(timeRemaining)}
                    </p>
                </div>
            </div>

            {/* Large Capital Display */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <h1
                    style={{
                        fontSize: "42px",
                        fontWeight: "700",
                        color: profitColor,
                        margin: "0 0 8px 0",
                        textShadow: `0 0 20px ${profitColor}40`,
                    }}
                >
                    €{currentBalance.toFixed(2)}
                </h1>
                <p style={{ color: "#9ca3af", fontSize: "16px", margin: 0 }}>
                    Profit:{" "}
                    <span style={{ color: profitColor, fontWeight: "600" }}>
                        {isGaining ? "+" : ""}€{currentProfit.toFixed(2)}
                    </span>
                </p>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#9ca3af", fontSize: "14px" }}>Progression</span>
                    <span style={{ color: "white", fontSize: "14px", fontWeight: "600" }}>{progressPercent.toFixed(1)}%</span>
                </div>
                <div
                    style={{
                        width: "100%",
                        height: "8px",
                        background: "rgba(55, 65, 81, 0.5)",
                        borderRadius: "4px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${progressPercent}%`,
                            height: "100%",
                            background: `linear-gradient(90deg, ${profitColor}, ${profitColor}80)`,
                            borderRadius: "4px",
                            transition: "width 1s ease",
                        }}
                    />
                </div>
            </div>

            {/* Real-time Graph */}
            <div style={{ marginBottom: "24px" }}>
                <h4 style={{ color: "white", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                    Progression en Temps Réel
                </h4>
                <div
                    style={{
                        background: "rgba(17, 24, 39, 0.5)",
                        borderRadius: "8px",
                        padding: "16px",
                        height: "120px",
                        position: "relative",
                    }}
                >
                    <svg width="100%" height="100%" viewBox="0 0 320 100">
                        {/* Grid lines */}
                        <defs>
                            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* Chart line */}
                        {chartData.length > 1 && (
                            <>
                                <path
                                    d={createSmoothPath(chartData)}
                                    fill="none"
                                    stroke={profitColor}
                                    strokeWidth="2"
                                    style={{ filter: `drop-shadow(0 0 4px ${profitColor}40)` }}
                                />
                                {/* Data points */}
                                {chartData.map((point, index) => (
                                    <circle
                                        key={index}
                                        cx={point.x}
                                        cy={point.y}
                                        r="3"
                                        fill={profitColor}
                                        style={{ filter: `drop-shadow(0 0 4px ${profitColor}60)` }}
                                    />
                                ))}
                            </>
                        )}

                        {/* Labels */}
                        <text x="10" y="15" fill="#9ca3af" fontSize="10">
                            €{investment.package.returns}
                        </text>
                        <text x="10" y="90" fill="#9ca3af" fontSize="10">
                            €{investment.package.investment}
                        </text>
                        <text x="280" y="95" fill="#9ca3af" fontSize="10">
                            {investment.package.timeframe}h
                        </text>
                    </svg>
                </div>
            </div>

            {/* Minute-by-Minute History Table */}
            <div>
                <h4 style={{ color: "white", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                    Historique Minute par Minute
                </h4>
                <div
                    style={{
                        background: "rgba(17, 24, 39, 0.5)",
                        borderRadius: "8px",
                        maxHeight: "200px",
                        overflowY: "auto",
                    }}
                >
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid rgba(75, 85, 99, 0.3)" }}>
                                <th style={{ color: "#9ca3af", fontSize: "12px", padding: "8px", textAlign: "left" }}>Minute</th>
                                <th style={{ color: "#9ca3af", fontSize: "12px", padding: "8px", textAlign: "right" }}>Capital</th>
                                <th style={{ color: "#9ca3af", fontSize: "12px", padding: "8px", textAlign: "right" }}>Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {minuteHistory.slice(-10).map((item, index) => (
                                <tr key={index} style={{ borderBottom: "1px solid rgba(75, 85, 99, 0.1)" }}>
                                    <td style={{ color: "white", fontSize: "12px", padding: "6px" }}>{item.minute}</td>
                                    <td style={{ color: "white", fontSize: "12px", padding: "6px", textAlign: "right" }}>
                                        €{item.balance.toFixed(2)}
                                    </td>
                                    <td
                                        style={{
                                            color: item.profit > 0 ? "#10b981" : "#9ca3af",
                                            fontSize: "12px",
                                            padding: "6px",
                                            textAlign: "right",
                                        }}
                                    >
                                        +€{item.profit.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default EnhancedLiveBalanceCard
