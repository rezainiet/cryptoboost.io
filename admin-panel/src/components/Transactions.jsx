"use client"

import { useState, useEffect } from "react"

const Transactions = () => {
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const transactionsPerPage = 10

    // Fetch transactions from backend with pagination, search, and status filter
    const fetchTransactions = async (page = 1, search = "", status = "all") => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append("page", page)
            params.append("limit", transactionsPerPage)
            if (search) params.append("search", search)
            if (status !== "all") params.append("status", status)

            const response = await fetch(`https://api.cryptoboost.network/api/admin/transactions?${params.toString()}`)
            const data = await response.json()
            if (data.success) {
                setTransactions(data.data.transactions || [])
                setCurrentPage(data.data.pagination.currentPage)
                setTotalPages(data.data.pagination.totalPages)
            }
        } catch (error) {
            console.error("Error fetching transactions:", error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch transactions on load and when filters change
    useEffect(() => {
        fetchTransactions(currentPage, searchTerm, statusFilter)
    }, [currentPage, searchTerm, statusFilter])

    const getStatusColor = (status) => {
        switch (status) {
            case "completed":
                return "bg-green-700 text-green-200"
            case "processing":
                return "bg-blue-700 text-blue-200"
            case "started":
                return "bg-yellow-600 text-yellow-100"
            case "confirmed":
                return "bg-green-900 text-green-200"
            default:
                return "bg-gray-700 text-gray-300"
        }
    }

    const getExplorerUrl = (network, txHash, address) => {
        const hasValidTxHash = txHash && typeof txHash === "string" && txHash.trim() !== ""
        const fallbackToAddress = !hasValidTxHash && address

        switch (network?.toUpperCase()) {
            case "BTC":
                return hasValidTxHash
                    ? `https://www.blockchain.com/btc/tx/${txHash}`
                    : fallbackToAddress
                        ? `https://www.blockchain.com/btc/address/${address}`
                        : null
            case "ETH":
            case "USDT (ERC20)":
            case "USDC (ERC20)":
                return hasValidTxHash
                    ? `https://etherscan.io/tx/${txHash}`
                    : fallbackToAddress
                        ? `https://etherscan.io/address/${address}`
                        : null
            case "SOL":
                return hasValidTxHash
                    ? `https://solscan.io/tx/${txHash}`
                    : fallbackToAddress
                        ? `https://solscan.io/address/${address}`
                        : null
            default:
                return null
        }
    }

    return (
        <div className="p-6 bg-gray-900 min-h-screen text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Transactions</h1>
                <button
                    onClick={() => fetchTransactions(currentPage, searchTerm, statusFilter)}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by email, network, order..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                    <option value="all">All Status</option>
                    <option value="processing">Processing</option>
                    <option value="started">Started</option>
                    <option value="completed">Completed</option>
                    <option value="confirmed">Confirmed</option>
                </select>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Network</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-700">
                        {transactions.map((tx) => {
                            const explorerUrl = getExplorerUrl(tx.network, tx.txHash, tx.address)
                            return (
                                <tr key={tx._id} className="hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{tx.orderId}</td>
                                    <td className="px-6 py-4 text-sm">{tx.userEmail}</td>
                                    <td className="px-6 py-4 text-sm">{tx.network}</td>
                                    <td className="px-6 py-4 text-sm">{tx.amountFiat || tx?.verificationAmount} {tx.fiatCurrency} </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "N/A"}</td>
                                    <td className="px-6 py-4 text-sm">
                                        {explorerUrl ? (
                                            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                View on Explorer
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => currentPage > 1 && fetchTransactions(currentPage - 1, searchTerm, statusFilter)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-700 text-white rounded-md disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => currentPage < totalPages && fetchTransactions(currentPage + 1, searchTerm, statusFilter)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-gray-700 text-white rounded-md disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Transactions
