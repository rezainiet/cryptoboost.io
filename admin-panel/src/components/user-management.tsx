"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { Download } from "lucide-react"

import { auth } from "../../firebase"
import { getSourceColor, getSourceFromReferral } from "../utils/sourceMapper"

const UserManagement = () => {
    const [user] = useAuthState(auth)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [searchTerm, setSearchTerm] = useState("")
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [currentPage, searchTerm, itemsPerPage])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await fetch(
                `https://cryptoboost-io.onrender.com/api/admin/users?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "user-email": user?.email || "",
                    },
                    body: JSON.stringify({
                        userEmail: user?.email || "",
                    }),
                },
            )
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

    const handleItemsPerPageChange = (newLimit) => {
        setItemsPerPage(newLimit)
        setCurrentPage(1)
    }

    const generateCSV = (data, filename) => {
        const headers = [
            "Name",
            "Email",
            "Telegram",
            "Phone",
            "Source",
            "Total Invested",
            "Total Orders",
            "Completed Orders",
            "Joined Date",
            "Status",
        ]
        const csvContent = [
            headers.join(","),
            ...data.map((user) =>
                [
                    `"${user.name || "Unknown"}"`,
                    `"${user.email || ""}"`,
                    `"${user.telegram || ""}"`,
                    `"${user.phone || "No phone"}"`,
                    `"${getSourceFromReferral(user.referral)}"`,
                    `"${user.totalInvested?.toLocaleString() || "0"}"`,
                    `"${user.totalOrders || 0}"`,
                    `"${user.completedOrders || 0}"`,
                    `"${formatDate(user.createdAt)}"`,
                    `"${user.lastActive && Date.now() - user.lastActive < 30 * 24 * 60 * 60 * 1000 ? "Active" : "Inactive"}"`,
                ].join(","),
            ),
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleExport = async () => {
        setIsExporting(true)

        try {
            const filename = `users-page-${currentPage}-${new Date().toISOString().split("T")[0]}.csv`
            generateCSV(users, filename)
        } catch (error) {
            console.error("Export failed:", error)
            alert("Export failed. Please try again.")
        } finally {
            setIsExporting(false)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* Search Bar */}
            <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                    </select>

                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export CSV"}</span>
                        <span className="sm:hidden">{isExporting ? "..." : "CSV"}</span>
                    </button>

                    <button
                        onClick={fetchUsers}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-700">
                    <h3 className="text-white text-base sm:text-lg font-semibold">User Management</h3>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">Manage and monitor user accounts</p>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400 text-sm sm:text-base">Loading users...</div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="text-left p-4 text-slate-300 font-medium text-sm">User</th>
                                        <th className="text-left p-4 text-slate-300 font-medium text-sm">Telegram</th>
                                        <th className="text-left p-4 text-slate-300 font-medium text-sm">Email</th>
                                        <th className="text-left p-4 text-slate-300 font-medium text-sm">Source</th>
                                        <th className="text-left p-4 text-slate-300 font-medium text-sm">Role</th>
                                        <th className="text-left p-4 text-slate-300 font-medium text-sm">Total Invested</th>
                                        <th className="text-left p-4 text-slate-300 font-medium text-sm">Orders</th>
                                        <th className="text-left p-4 text-slate-300 font-medium text-sm">Joined</th>
                                        <th className="text-left p-4 text-slate-300 font-medium text-sm">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white text-sm font-medium">
                                                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-white font-medium text-sm truncate">{user.name || "Unknown"}</p>
                                                        <p className="text-slate-400 text-xs truncate">{user.phone || "No phone"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-300 text-sm">
                                                {user.telegram ? (
                                                    <a
                                                        href={`https://t.me/${user.telegram}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:underline truncate"
                                                    >
                                                        {`@${user.telegram}`}
                                                    </a>
                                                ) : (
                                                    "N/A"
                                                )}
                                            </td>

                                            <td className="p-4 text-slate-300 text-sm truncate">{user.email}</td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getSourceColor(
                                                        getSourceFromReferral(user.referral),
                                                    )}`}
                                                >
                                                    {getSourceFromReferral(user.referral)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${user.role === "admin" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                                                        }`}
                                                >
                                                    {user.role || "user"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-300 text-sm">€{user.totalInvested?.toLocaleString() || "0"}</td>
                                            <td className="p-4 text-slate-300 text-sm">
                                                <div>{user.totalOrders || 0} total</div>
                                                <div className="text-green-400 text-xs">{user.completedOrders || 0} completed</div>
                                            </td>
                                            <td className="p-4 text-slate-400 text-sm">{formatDate(user.createdAt)}</td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${user.lastActive && Date.now() - user.lastActive < 30 * 24 * 60 * 60 * 1000
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

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3 p-4">
                            {users.map((user) => (
                                <div key={user._id} className="bg-slate-700 rounded-lg p-4 space-y-3 border border-slate-600">
                                    {/* User Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-medium">{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium text-white truncate">{user.name || "Unknown"}</div>
                                            <div className="text-xs text-slate-400 truncate">{user.email}</div>
                                        </div>
                                    </div>

                                    {/* User Details Grid */}
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <div className="text-slate-400 mb-1">Source</div>
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSourceColor(
                                                    getSourceFromReferral(user.referral),
                                                )}`}
                                            >
                                                {getSourceFromReferral(user.referral)}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-slate-400 mb-1">Status</div>
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === "admin" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                                                    }`}
                                            >
                                                {user.role || "user"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Investment Details */}
                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-600">
                                        <div>
                                            <div className="text-slate-400 text-xs mb-1">Total Invested</div>
                                            <div className="text-sm font-semibold text-white">
                                                €{(user.totalInvested || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-slate-400 text-xs mb-1">Orders</div>
                                            <div className="text-sm font-semibold text-white">
                                                {user.totalOrders || 0} ({user.completedOrders || 0})
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-600 text-xs">
                                        <div>
                                            <div className="text-slate-400 mb-1">Joined</div>
                                            <div className="text-slate-300">{formatDate(user.createdAt)}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-400 mb-1">Activity</div>
                                            <div
                                                className={
                                                    user.lastActive && Date.now() - user.lastActive < 30 * 24 * 60 * 60 * 1000
                                                        ? "text-green-400"
                                                        : "text-gray-400"
                                                }
                                            >
                                                {user.lastActive && Date.now() - user.lastActive < 30 * 24 * 60 * 60 * 1000
                                                    ? "Active"
                                                    : "Inactive"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Telegram Link */}
                                    {user.telegram && (
                                        <div className="pt-2 border-t border-slate-600">
                                            <a
                                                href={`https://t.me/${user.telegram}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:underline text-xs"
                                            >
                                                Telegram: @{user.telegram}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="text-slate-400 text-xs sm:text-sm text-center sm:text-left">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2 justify-center sm:justify-end">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-slate-700 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-slate-700 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
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
