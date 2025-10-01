"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import React from "react"
import { Download } from "lucide-react"

const StatusBadge = React.memo(({ status }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-600 text-yellow-100"
            case "contacted":
                return "bg-green-700 text-green-200"
            case "ignored":
                return "bg-red-700 text-red-200"
            default:
                return "bg-gray-700 text-gray-300"
        }
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
            {status}
        </span>
    )
})
StatusBadge.displayName = "StatusBadge"

const SubmissionRow = React.memo(({ submission, updateStatus }) => {
    return (
        <tr key={submission._id} className="hover:bg-gray-800">
            <td className="px-6 py-4 text-sm">
                {submission.firstName} {submission.lastName}
            </td>
            <td className="px-6 py-4 text-sm">{submission.email}</td>
            <td className="px-6 py-4 text-sm">{submission.phone}</td>
            <td className="px-6 py-4 text-sm">{submission.investmentAmount}</td>
            <td className="px-6 py-4 text-sm">{submission.preferredCrypto}</td>
            <td className="px-6 py-4">
                <StatusBadge status={submission.status} />
            </td>
            <td className="px-6 py-4 text-sm">
                {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : "N/A"}
            </td>
            <td className="px-6 py-4 text-sm flex gap-2">
                <button
                    onClick={() => updateStatus(submission._id, "contacted")}
                    className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                >
                    Mark Contacted
                </button>
                <button
                    onClick={() => updateStatus(submission._id, "ignored")}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                >
                    Ignore
                </button>
            </td>
        </tr>
    )
})
SubmissionRow.displayName = "SubmissionRow"

const ContactSupport = () => {
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(false)
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [submissionsPerPage, setSubmissionsPerPage] = useState(10)
    const [exportLoading, setExportLoading] = useState(false)

    const fetchSubmissions = useCallback(
        async (page = 1, status = "all", limit = submissionsPerPage) => {
            setLoading(true)
            const controller = new AbortController()

            try {
                const params = new URLSearchParams()
                params.append("page", page)
                params.append("limit", limit)
                if (status !== "all") params.append("status", status)

                const response = await fetch(
                    `http://localhost:9000/api/contact-form/admin/form-submissions?${params.toString()}`,
                    { signal: controller.signal },
                )
                const data = await response.json()
                if (data.success) {
                    setSubmissions(data.data.submissions || [])
                    setCurrentPage(data.data.pagination.currentPage)
                    setTotalPages(data.data.pagination.totalPages)
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Error fetching submissions:", error)
                }
            } finally {
                setLoading(false)
            }

            return () => controller.abort()
        },
        [submissionsPerPage],
    )

    const updateStatus = useCallback(
        async (id, newStatus) => {
            try {
                const response = await fetch(`http://localhost:9000/api/contact-form/admin/form-submissions/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                })
                const data = await response.json()
                if (data.success) {
                    fetchSubmissions(currentPage, statusFilter) // refresh
                }
            } catch (error) {
                console.error("Error updating status:", error)
            }
        },
        [currentPage, statusFilter, fetchSubmissions],
    )

    const exportToCSV = useCallback(async () => {
        setExportLoading(true)
        try {
            // Convert to CSV
            const headers = ["Name", "Email", "Phone", "Investment Amount", "Preferred Crypto", "Status", "Date"]
            const csvContent = [
                headers.join(","),
                ...submissions.map((submission) =>
                    [
                        `"${submission.firstName} ${submission.lastName}"`,
                        `"${submission.email}"`,
                        `"${submission.phone}"`,
                        `"${submission.investmentAmount}"`,
                        `"${submission.preferredCrypto}"`,
                        `"${submission.status}"`,
                        `"${submission.createdAt ? new Date(submission.createdAt).toLocaleString() : "N/A"}"`,
                    ].join(","),
                ),
            ].join("\n")

            // Download CSV
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const link = document.createElement("a")
            const url = URL.createObjectURL(blob)
            link.setAttribute("href", url)
            link.setAttribute(
                "download",
                `contact-submissions-page-${currentPage}-${new Date().toISOString().split("T")[0]}.csv`,
            )
            link.style.visibility = "hidden"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error("Error exporting CSV:", error)
        } finally {
            setExportLoading(false)
        }
    }, [submissions, currentPage])

    useEffect(() => {
        fetchSubmissions(currentPage, statusFilter, submissionsPerPage)
    }, [currentPage, statusFilter, submissionsPerPage, fetchSubmissions])

    const statusOptions = useMemo(
        () => [
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "contacted", label: "Contacted" },
            { value: "ignored", label: "Ignored" },
        ],
        [],
    )

    const pageSizeOptions = useMemo(
        () => [
            { value: 5, label: "5 per page" },
            { value: 10, label: "10 per page" },
            { value: 25, label: "25 per page" },
            { value: 50, label: "50 per page" },
            { value: 100, label: "100 per page" },
            { value: 250, label: "250 per page" },
            { value: 500, label: "500 per page" },
        ],
        [],
    )

    return (
        <div className="p-6 bg-gray-900 min-h-screen text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Contact Support Requests</h1>
                <button
                    onClick={() => fetchSubmissions(currentPage, statusFilter, submissionsPerPage)}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </div>

            <div className="flex flex-wrap gap-4 mb-4 items-center">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                    {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <select
                    value={submissionsPerPage}
                    onChange={(e) => {
                        setSubmissionsPerPage(Number(e.target.value))
                        setCurrentPage(1) // Reset to first page when changing page size
                    }}
                    className="px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                    {pageSizeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <button
                    onClick={exportToCSV}
                    disabled={exportLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                    <Download size={16} />
                    {exportLoading ? "Exporting..." : "Export CSV"}
                </button>
            </div>

            {exportLoading && <div className="mb-4 p-3 bg-blue-600 text-white rounded-lg">Preparing CSV export...</div>}

            <div className="bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Investment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Preferred Crypto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-700">
                        {submissions.map((s) => (
                            <SubmissionRow key={s._id} submission={s} updateStatus={updateStatus} />
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages} ({submissionsPerPage} items per page)
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-700 text-white rounded-md disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
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

export default ContactSupport
