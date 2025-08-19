"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../firebase"

const PerformanceMonitor = ({ performanceStats }) => {
    const [activityLogs, setActivityLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [user] = useAuthState(auth)

    const fetchActivityLogs = async () => {
        try {
            setLoading(true)
            const response = await fetch(
                `http://localhost:9000/admin/activity-logs?page=1&limit=10&userEmail=${user?.email || ""}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "user-email": user?.email || "",
                    },
                },
            )
            const result = await response.json()

            if (result.success) {
                setActivityLogs(result.data.logs || [])
            }
        } catch (error) {
            console.error("Error fetching activity logs:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchActivityLogs()
    }, [user])

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Performance Monitor</h2>

            {/* Performance Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-medium">Order Completion Rate</h3>
                    <p className="text-2xl font-bold text-white mt-2">{performanceStats?.orderStats?.completionRate || 0}%</p>
                    <p className="text-slate-400 text-sm mt-1">{performanceStats?.orderStats?.completed || 0} completed orders</p>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-medium">Network Performance</h3>
                    <p className="text-2xl font-bold text-white mt-2">{performanceStats?.networkPerformance?.length || 0}</p>
                    <p className="text-slate-400 text-sm mt-1">Active networks</p>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-medium">System Status</h3>
                    <p className="text-2xl font-bold text-green-400 mt-2">Online</p>
                    <p className="text-slate-400 text-sm mt-1">All systems operational</p>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-medium">Activity Logs</h3>
                    <p className="text-2xl font-bold text-white mt-2">{activityLogs.length}</p>
                    <p className="text-slate-400 text-sm mt-1">Recent activities</p>
                </div>
            </div>

            {/* Network Performance Details */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white text-lg font-semibold mb-4">Network Performance Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {performanceStats?.networkPerformance?.map((network, index) => (
                        <div key={index} className="bg-slate-700 rounded-lg p-4">
                            <h4 className="text-white font-medium">{network._id || "Unknown"}</h4>
                            <div className="mt-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Success Rate</span>
                                    <span className="text-white">{network.successRate?.toFixed(1) || 0}%</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-slate-400">Total Orders</span>
                                    <span className="text-white">{network.total || 0}</span>
                                </div>
                            </div>
                        </div>
                    )) || <div className="col-span-3 text-center text-slate-400">No network data available</div>}
                </div>
            </div>

            {/* Activity Logs */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white text-lg font-semibold mb-4">Recent Activity Logs</h3>
                {loading ? (
                    <div className="text-center text-slate-400 py-8">Loading activity logs...</div>
                ) : activityLogs.length > 0 ? (
                    <div className="space-y-3">
                        {activityLogs.map((log, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0"
                            >
                                <div>
                                    <p className="text-white text-sm">{log.action || "Unknown action"}</p>
                                    <p className="text-slate-400 text-xs">{log.details || "No details available"}</p>
                                </div>
                                <div className="text-slate-400 text-xs">
                                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Unknown time"}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-8">No activity logs available</div>
                )}
            </div>
        </div>
    )
}

export default PerformanceMonitor
