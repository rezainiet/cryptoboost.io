"use client"

import { useState, useEffect, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:9000"

const paymentOptions = [
    { id: "BTC", name: "Bitcoin", symbol: "₿", color: "from-orange-400 to-yellow-500", glowColor: "orange-400", network: "Bitcoin Network" },
    { id: "ETH", name: "Ethereum", symbol: "Ξ", color: "from-blue-400 to-purple-500", glowColor: "blue-400", network: "Ethereum Network" },
    { id: "TRC", name: "TRON (TRC20)", symbol: "◎", color: "from-red-400 to-pink-500", glowColor: "red-400", network: "TRON Network" },
]

const PaymentPage = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const initialPkg = location.state?.package || null
    const [selectedPayment, setSelectedPayment] = useState(location.state?.network || "BTC")
    const [copied, setCopied] = useState("")
    const [timeLeft, setTimeLeft] = useState(0)
    const [order, setOrder] = useState(null) // { orderId, address, expiresAt, amountFiat, package, network }

    // Countdown from server-provided expiresAt
    useEffect(() => {
        let timer
        if (order?.expiresAt) {
            const tick = () => {
                const remaining = Math.max(0, Math.floor((order.expiresAt - Date.now()) / 1000))
                setTimeLeft(remaining)
            }
            tick()
            timer = setInterval(tick, 1000)
        }
        return () => timer && clearInterval(timer)
    }, [order?.expiresAt])

    // On first load OR when network changes, create or refetch order
    useEffect(() => {
        async function ensureOrder() {
            // If we already have an order but network selection changed, create a new order
            if (!initialPkg) return

            // Check if there's an existing orderId in navigation state (e.g., after refresh)
            if (location.state?.orderId && !order) {
                const res = await fetch(`${API_BASE}/payments/${location.state.orderId}`)
                if (res.ok) {
                    const data = await res.json()
                    setOrder(data.order)
                    return
                }
            }

            // Create fresh order
            const res = await fetch(`${API_BASE}/payments/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pkg: initialPkg, network: selectedPayment, userEmail: location.state?.userEmail || null }),
            })
            if (res.ok) {
                const data = await res.json()
                setOrder(data.order)
                // Persist orderId to navigation state so refreshes can refetch it
                navigate("/payment", { replace: true, state: { package: data.order.package, network: data.order.network, orderId: data.order.orderId } })
            }
        }
        ensureOrder()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPayment])

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const copyToClipboard = async (text, type) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(type)
            setTimeout(() => setCopied(""), 2000)
        } catch (err) {
            console.error("Failed to copy: ", err)
        }
    }

    const selectedOption = useMemo(() => paymentOptions.find((p) => p.id === selectedPayment), [selectedPayment])

    if (!initialPkg) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="text-center">
                    <p className="mb-4">Aucun package sélectionné.</p>
                    <button className="px-4 py-2 rounded bg-slate-700" onClick={() => navigate(-1)}>Retour</button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 py-8 px-4">
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
            </div>

            <div className="relative max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-6">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Retour aux packages</span>
                    </button>

                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        Finaliser le
                        <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 bg-clip-text text-transparent"> Paiement</span>
                    </h1>
                    <p className="text-slate-300 text-lg">Sélectionnez votre méthode de paiement crypto préférée</p>
                </div>

                {/* Timer */}
                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-4 mb-8 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                        <span className="text-red-400 font-semibold font-mono">TEMPS RESTANT POUR PAYER</span>
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono">{formatTime(timeLeft)}</div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Package Summary */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-6 font-mono">Résumé de la Commande</h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
                                <span className="text-slate-400 font-mono">Package</span>
                                <span className="text-white font-semibold">{initialPkg.title}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
                                <span className="text-slate-400 font-mono">Investissement</span>
                                <span className="text-white font-bold text-lg">€{Number(initialPkg.investment).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
                                <span className="text-slate-400 font-mono">Retour Estimé</span>
                                <span className="text-lime-400 font-bold text-lg">€{Number(initialPkg.returns).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
                                <span className="text-slate-400 font-mono">Durée</span>
                                <span className="text-white font-semibold">{initialPkg.timeframe}</span>
                            </div>
                        </div>

                        <div className="border-t border-slate-600/30 pt-4">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-slate-300 font-mono">Total à Payer:</span>
                                <span className="text-white font-bold text-2xl">€{Number(initialPkg.investment).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-6 font-mono">Méthode de Paiement</h2>

                        {/* Payment Options */}
                        <div className="space-y-3 mb-6">
                            {paymentOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setSelectedPayment(option.id)}
                                    className={`w-full p-4 rounded-xl border transition-all duration-300 ${selectedPayment === option.id
                                        ? `border-${option.glowColor} bg-gradient-to-r ${option.color}/20 shadow-lg shadow-${option.glowColor}/25`
                                        : "border-slate-600/30 bg-slate-700/30 hover:border-slate-500/50"
                                        }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-12 h-12 bg-gradient-to-r ${option.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                                            {option.symbol}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-white font-semibold">{option.name}</div>
                                            <div className="text-slate-400 text-sm">{option.network}</div>
                                        </div>
                                        {selectedPayment === option.id && (
                                            <div className="ml-auto">
                                                <div className={`w-6 h-6 bg-${option.glowColor} rounded-full flex items-center justify-center`}>
                                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Payment Address */}
                        <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-semibold font-mono">Adresse de Paiement</h3>
                                <div className={`px-3 py-1 bg-gradient-to-r ${selectedOption?.color} rounded-full text-white text-sm font-semibold`}>
                                    {selectedPayment}
                                </div>
                            </div>

                            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                                <div className="text-slate-300 font-mono text-sm break-all">
                                    {order?.address || "Génération de l'adresse..."}
                                </div>
                            </div>

                            <button
                                onClick={() => order?.address && copyToClipboard(order.address, selectedPayment)}
                                className={`w-full bg-gradient-to-r ${selectedOption?.color} hover:shadow-lg text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 font-mono`}
                            >
                                {copied === selectedPayment ? "✓ COPIÉ!" : "COPIER L'ADRESSE"}
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
                            <h4 className="text-cyan-400 font-semibold mb-2 font-mono">INSTRUCTIONS:</h4>
                            <ul className="text-slate-300 text-sm space-y-1">
                                <li>• Envoyez exactement €{Number(initialPkg.investment).toLocaleString()} en {selectedPayment}</li>
                                <li>• Utilisez uniquement le réseau {selectedOption?.network}</li>
                                <li>• Votre investissement sera activé après confirmation</li>
                                <li>• Conservez votre hash de transaction</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Support */}
                <div className="text-center mt-8">
                    <p className="text-slate-400 mb-4 font-mono">Besoin d'aide avec votre paiement ?</p>
                    <button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/25 font-mono">
                        CONTACTER LE SUPPORT
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PaymentPage