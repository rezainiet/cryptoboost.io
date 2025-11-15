"use client"

import React, { useEffect, useState } from "react"

const ManagePackageReturn = () => {
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState([])

    // modal states
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [newReturn, setNewReturn] = useState("")

    // toast system
    const [toastVisible, setToastVisible] = useState(false)
    const [toastMessage, setToastMessage] = useState("")

    const showToast = (msg) => {
        setToastMessage(msg)
        setToastVisible(true)
        setTimeout(() => setToastVisible(false), 2000)
    }

    // Fetch updatable orders
    const fetchOrders = async () => {
        try {
            setLoading(true)
            const res = await fetch("https://cryptoboost-io.onrender.com/kyc/get-updatable-orders")
            const data = await res.json()
            if (data.success) setOrders(data.orders || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Open modal
    const openModal = (order) => {
        setSelectedOrder(order)
        setNewReturn(order?.package?.returns || "")
        setModalOpen(true)
    }

    // Save updated return
    const saveReturn = async () => {
        if (!selectedOrder) return

        try {
            const res = await fetch(`https://cryptoboost-io.onrender.com/kyc/update-return/${selectedOrder.orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ returns: Number(newReturn) })
            })

            const data = await res.json()

            if (data.success) {
                showToast("Return value updated!")
                setModalOpen(false)
                fetchOrders()
            } else {
                showToast("Failed to update return")
            }
        } catch (error) {
            console.error(error)
            showToast("Server error")
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    return (
        <div className="p-4 sm:p-6 space-y-6 relative">

            {/* Toast */}
            {toastVisible && (
                <div className="fixed top-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in">
                    {toastMessage}
                </div>
            )}

            <style jsx>{`
                .animate-slide-in {
                    animation: slideIn 0.3s ease-out;
                }
                @keyframes slideIn {
                    0% { opacity: 0; transform: translateY(-10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <h1 className="text-xl font-bold text-white">Manage Package Returns</h1>

            {loading && <div className="text-gray-400">Loading updatable orders...</div>}

            {!loading && orders.length === 0 && (
                <div className="text-gray-400">No updatable orders found.</div>
            )}

            <div className="space-y-4">
                {orders.map((order) => (
                    <div key={order.orderId} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <p className="text-white font-semibold">
                            User: <span className="text-cyan-400">{order.userEmail}</span>
                        </p>

                        <p className="text-gray-300">
                            Order ID: <span className="text-white">{order.orderId}</span>
                        </p>

                        <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                            <p className="text-white font-semibold">Package Info</p>
                            <p className="text-gray-300 text-sm">Title: {order.package?.title}</p>
                            <p className="text-gray-300 text-sm">Investment: {order.package?.investment} EUR</p>
                            <p className="text-gray-300 text-sm">Returns: {order.package?.returns}</p>
                        </div>

                        <button
                            onClick={() => openModal(order)}
                            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                        >
                            Modify Returns
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/70">
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 w-full max-w-sm space-y-4">
                        <h2 className="text-white text-lg font-semibold">Modify Package Returns</h2>

                        <input
                            type="number"
                            value={newReturn}
                            onChange={(e) => setNewReturn(e.target.value)}
                            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
                            placeholder="Enter new return amount"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={saveReturn}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default ManagePackageReturn
