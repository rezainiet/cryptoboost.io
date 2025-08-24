"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../firebase"

const UserManagement = () => {
    const [user] = useAuthState(auth);
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchUsers()
    }, [currentPage, searchTerm])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await fetch(`http://localhost:9000/api/admin/users?page=${currentPage}&limit=10&search=${searchTerm}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "user-email": user?.email || "",
                },
                body: JSON.stringify({
                    userEmail: user?.email || "",
                }),
            })
            const data = await response.json()

            if (data.success) {
                setUsers(data.data.users)
                setTotalPages(data.data.pagination.totalPages)
            }
        } catch (error) {
            console.error("Error fetching users:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <h3 className="text-white text-lg font-semibold">User Management</h3>
                    <p className="text-slate-400 text-sm mt-1">Manage and monitor user accounts</p>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading users...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th className="text-left p-4 text-slate-300 font-medium">User</th>
                                    <th className="text-left p-4 text-slate-300 font-medium">Email</th>
                                    <th className="text-left p-4 text-slate-300 font-medium">Role</th>
                                    <th className="text-left p-4 text-slate-300 font-medium">Total Invested</th>
                                    <th className="text-left p-4 text-slate-300 font-medium">Orders</th>
                                    <th className="text-left p-4 text-slate-300 font-medium">Joined</th>
                                    <th className="text-left p-4 text-slate-300 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <tr key={user._id} className="border-t border-slate-700 hover:bg-slate-700/30">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-sm font-medium">
                                                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{user.name || "Unknown"}</p>
                                                    <p className="text-slate-400 text-sm">{user.phone || "No phone"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300">{user.email}</td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                                                    }`}
                                            >
                                                {user.role || "user"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-300">€{user.totalInvested?.toLocaleString() || "0"}</td>
                                        <td className="p-4 text-slate-300">
                                            <div className="text-sm">
                                                <div>{user.totalOrders || 0} total</div>
                                                <div className="text-green-400">{user.completedOrders || 0} completed</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400 text-sm">{formatDate(user.createdAt)}</td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${user.lastActive && Date.now() - user.lastActive < 30 * 24 * 60 * 60 * 1000
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-gray-500/20 text-gray-400"
                                                    }`}
                                            >
                                                {user.lastActive && Date.now() - user.lastActive < 30 * 24 * 60 * 60 * 1000
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-700 flex items-center justify-between">
                        <div className="text-slate-400 text-sm">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserManagement
