"use client"

import React, { useEffect, useState } from "react"

const KYC = () => {
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState([])
    const [updating, setUpdating] = useState(null)

    // ---- Toast System ----
    const [toastVisible, setToastVisible] = useState(false)
    const [toastMessage, setToastMessage] = useState("")

    const showToast = (msg) => {
        setToastMessage(msg)
        setToastVisible(true)

        setTimeout(() => {
            setToastVisible(false)
        }, 2000) // hide after 2s
    }
    // ----------------------

    // Fetch processing KYC orders
    const fetchOrders = async () => {
        try {
            setLoading(true)
            const res = await fetch("http://localhost:9000/kyc/processing-kyc-orders")
            const data = await res.json()

            if (data.success) {
                setOrders(data.orders || [])
            }
        } catch (err) {
            console.error("Error fetching KYC:", err)
        } finally {
            setLoading(false)
        }
    }

    // Confirm KYC
    const confirmKYC = async (orderId) => {
        try {
            setUpdating(orderId)

            const res = await fetch(`http://localhost:9000/kyc/confirm/${orderId}`, {
                method: "PUT"
            })

            const data = await res.json()

            if (data.success) {
                showToast("Order confirmed successfully! 🎉")
                fetchOrders()
            } else {
                showToast(data.message || "Failed to confirm order")
            }

        } catch (error) {
            console.error("Confirm KYC error:", error)
            showToast("Server error")
        } finally {
            setUpdating(null)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    return (
        <div className="p-4 sm:p-6 space-y-6 relative">

            {/* Custom Toast (No Library) */}
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

            <h1 className="text-xl font-bold text-white">KYC Processing</h1>

            {/* Loading */}
            {loading && <div className="text-gray-400">Loading KYC orders...</div>}

            {/* Empty */}
            {!loading && orders.length === 0 && (
                <div className="text-gray-400">No processing KYC orders found.</div>
            )}

            {/* Orders */}
            <div className="space-y-4">
                {orders.map((order) => (
                    <div
                        key={order.orderId}
                        className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                        <div className="space-y-1">
                            <p className="text-white font-semibold">
                                Order ID: <span className="text-cyan-400">{order.orderId}</span>
                            </p>
                            <p className="text-gray-300 text-sm">
                                Email: {order.userEmail || "No email"}
                            </p>
                            <p className="text-gray-400 text-sm">
                                Created: {order.createdAt}
                            </p>
                            <p className="text-gray-300 text-sm">
                                Network: <span className="text-white">{order.network}</span>
                            </p>
                            <p className="text-gray-300 text-sm">
                                Amount: {order.amountFiat} {order.fiatCurrency} → {order.amountCrypto}{" "}
                                {order.cryptoSymbol}
                            </p>
                        </div>

                        <button
                            onClick={() => confirmKYC(order.orderId)}
                            disabled={updating === order.orderId}
                            className={`px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 
                                ${updating === order.orderId ? "bg-green-800 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}
                            `}
                        >
                            {updating === order.orderId ? "Confirming..." : "Confirm"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default KYC
