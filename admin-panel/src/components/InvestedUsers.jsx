"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../firebase"
import { Download } from "lucide-react"

const InvestedUsers = () => {
    const [user] = useAuthState(auth)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [usersPerPage, setUsersPerPage] = useState(10)
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrev: false,
    })
    const [isExporting, setIsExporting] = useState(false)

    const fetchInvestedUsers = async (page = 1, search = "", limit = usersPerPage) => {
        setLoading(true)
        try {
            const response = await fetch(
                `http://localhost:9000/api/admin/users/invested?page=${page}&limit=${limit}&search=${search}`,
            )
            const data = await response.json()
            if (data.success) {
                setUsers(data.data.users || [])
                setPagination(data.data.pagination)
                setCurrentPage(data.data.pagination.currentPage)
            }
        } catch (error) {
            console.error("Error fetching invested users:", error)
        } finally {
            setLoading(false)
        }
    }

    const generateCSV = (data, filename) => {
        const headers = ["Name", "Email", "Total Invested", "Investment Count", "Last Investment Date", "Status"]
        const csvContent = [
            headers.join(","),
            ...data.map((user) =>
                [
                    `"${user.name || ""}"`,
                    `"${user.email || ""}"`,
                    `"${user.totalInvested?.toLocaleString() || 0}"`,
                    `"${user.investmentCount || 0}"`,
                    `"${user.lastInvestmentDate ? new Date(user.lastInvestmentDate).toLocaleDateString() : "N/A"}"`,
                    `"Active Investor"`,
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
            const filename = `invested-users-page-${currentPage}-${new Date().toISOString().split("T")[0]}.csv`
            generateCSV(users, filename)
        } catch (error) {
            console.error("Export failed:", error)
            alert("Export failed. Please try again.")
        } finally {
            setIsExporting(false)
        }
    }

    useEffect(() => {
        fetchInvestedUsers(currentPage, searchTerm, usersPerPage)
    }, [currentPage, searchTerm, usersPerPage])

    const handleItemsPerPageChange = (newLimit) => {
        setUsersPerPage(newLimit)
        setCurrentPage(1)
    }

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Invested Users</h1>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Download size={16} />
                        {isExporting ? "Exporting..." : "Export CSV"}
                    </button>

                    <button
                        onClick={() => fetchInvestedUsers(currentPage, searchTerm, usersPerPage)}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />

                <select
                    value={usersPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                    <option value={250}>250 per page</option>
                    <option value={500}>500 per page</option>
                </select>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Total Invested
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Investments Count
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Last Investment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                        €{user.totalInvested?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                        {user.investmentCount || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {user.lastInvestmentDate ? new Date(user.lastInvestmentDate).toLocaleDateString() : "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                                            Active Investor
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing page {pagination.currentPage} of {pagination.totalPages} — {pagination.totalCount} total users
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={!pagination.hasPrev}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-md">
                        {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                        disabled={!pagination.hasNext}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}

export default InvestedUsers
