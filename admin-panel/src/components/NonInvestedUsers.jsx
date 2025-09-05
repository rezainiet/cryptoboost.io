"use client"

import { useState, useEffect } from "react"

const NonInvestedUsers = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [usersPerPage] = useState(10)

    const fetchNonInvestedUsers = async () => {
        setLoading(true)
        try {
            const response = await fetch("https://api.cryptoboost.capital/api/admin/users/non-invested")
            const data = await response.json()
            setUsers(data.data.users || [])
        } catch (error) {
            console.error("Error fetching non-invested users:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNonInvestedUsers()
    }, [])

    const filteredUsers = users.filter(
        (user) =>
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const indexOfLastUser = currentPage * usersPerPage
    const indexOfFirstUser = indexOfLastUser - usersPerPage
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Non-Invested Users</h1>
                <button
                    onClick={fetchNonInvestedUsers}
                    disabled={loading}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Registration Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {currentUsers.map((user) => (
                            <tr key={user._id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                                        Potential Investor
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} results
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 rounded-md">
                        {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}

export default NonInvestedUsers
