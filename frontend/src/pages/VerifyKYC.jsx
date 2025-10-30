"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useNavigate } from "react-router-dom"
import { auth } from "../../firebase"

const API_BASE = import.meta.env.VITE_API_BASE || "https://cryptoboost-io.onrender.com"

const paymentOptions = [
    {
        id: "SOL",
        name: "Solana",
        symbol: "◎",
        color: "from-green-400 to-purple-500",
        glowColor: "green-400",
        network: "Solana Network",
        coinId: "solana",
    },
    {
        id: "ETH",
        name: "Ethereum",
        symbol: "Ξ",
        color: "from-blue-400 to-purple-500",
        glowColor: "blue-400",
        network: "Ethereum Network",
        coinId: "ethereum",
    },
    {
        id: "USDT",
        name: "USDT (ERC20)",
        symbol: "₮",
        color: "from-green-400 to-teal-500",
        glowColor: "green-400",
        network: "Ethereum Network",
        coinId: "tether",
    },
    {
        id: "USDC",
        name: "USDC (ERC20)",
        symbol: "$",
        color: "from-blue-400 to-sky-500",
        glowColor: "blue-400",
        network: "Ethereum Network",
        coinId: "usd-coin",
    },
]

const VerifyKYC = () => {
    const [user] = useAuthState(auth)
    const navigate = useNavigate()

    const verificationAmount = 500 // Fixed EUR amount

    const [selectedPayment, setSelectedPayment] = useState("SOL")
    const [copied, setCopied] = useState("")
    const [timeLeft, setTimeLeft] = useState(0)
    const [order, setOrder] = useState(null)
    const [paymentAddress, setPaymentAddress] = useState(null)
    const [qrCodeUrl, setQrCodeUrl] = useState(null)
    const [cryptoAmount, setCryptoAmount] = useState(0)
    const [cryptoPrices, setCryptoPrices] = useState({})
    const [loadingPrices, setLoadingPrices] = useState(false)
    const [isCreatingOrder, setIsCreatingOrder] = useState(false)
    const [orderError, setOrderError] = useState(null)

    useEffect(() => {
        fetchCryptoPrices()
    }, [])

    useEffect(() => {
        if (cryptoPrices[selectedPayment] && cryptoPrices[selectedPayment] > 0) {
            const cryptoValue = verificationAmount / cryptoPrices[selectedPayment]
            setCryptoAmount(cryptoValue)
            console.log("[v0] Calculated crypto amount:", cryptoValue, "for", selectedPayment)
        } else {
            setCryptoAmount(0)
        }
    }, [selectedPayment, cryptoPrices])

    useEffect(() => {
        if (!order?.expiresAt) return
        const tick = () => {
            const remaining = Math.max(0, Math.floor((order.expiresAt - Date.now()) / 1000))
            setTimeLeft(remaining)
        }
        tick()
        const timer = setInterval(tick, 1000)
        return () => clearInterval(timer)
    }, [order?.expiresAt])

    const fetchCryptoPrices = async () => {
        if (loadingPrices) return

        setLoadingPrices(true)
        try {
            const response = await fetch(`${API_BASE}/prices/current?fiat=eur`)
            if (response.ok) {
                const data = await response.json()
                setCryptoPrices(data.prices)
                console.log("[v0] Fetched crypto prices:", data.prices)
            } else {
                console.error("[v0] Failed to fetch crypto prices")
            }
        } catch (error) {
            console.error("[v0] Error fetching crypto prices:", error)
        } finally {
            setLoadingPrices(false)
        }
    }

    const handlePayForKYC = async () => {
        if (isCreatingOrder) return

        setIsCreatingOrder(true)
        setOrderError(null)

        try {
            console.log("[v0] Creating KYC order with network:", selectedPayment)

            const res = await fetch(`${API_BASE}/kyc/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: verificationAmount,
                    network: selectedPayment,
                    userEmail: user?.email || null,
                }),
            })

            console.log("[v0] Create order response status:", res.status)

            if (res.ok) {
                const data = await res.json()
                console.log("[v0] Create order response data:", data)

                if (data.success && data.order) {
                    setOrder(data.order)

                    if (data.order.address) {
                        setPaymentAddress(data.order.address)
                        generateQRCode(data.order.address, data.order.amountCrypto || cryptoAmount)
                        console.log("[v0] Payment address received:", data.order.address)
                    } else {
                        throw new Error("No payment address returned from server")
                    }
                } else {
                    throw new Error(data.message || "Failed to create order")
                }
            } else {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.message || `Server error: ${res.status}`)
            }
        } catch (error) {
            console.error("[v0] Error creating KYC order:", error)
            setOrderError(error.message || "Failed to create KYC order")
        } finally {
            setIsCreatingOrder(false)
        }
    }

    const generateQRCode = (address, amount) => {
        if (!address) return

        const cryptoAmt = amount || cryptoAmount

        let qrData = ""
        if (selectedPayment === "USDT" || selectedPayment === "USDC") {
            qrData = `${selectedPayment}:${address}?amount=${cryptoAmt}`
        } else if (selectedPayment === "SOL") {
            qrData = `sol:${address}?amount=${cryptoAmt}`
        } else {
            qrData = `${selectedPayment.toLowerCase()}:${address}?amount=${cryptoAmt}`
        }

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
        setQrCodeUrl(qrUrl)
    }

    const handleNetworkChange = (networkId) => {
        setSelectedPayment(networkId)
        setPaymentAddress(null)
        setQrCodeUrl(null)
        setOrder(null)
        setOrderError(null)

        if (cryptoPrices[networkId] && cryptoPrices[networkId] > 0) {
            const cryptoValue = verificationAmount / cryptoPrices[networkId]
            setCryptoAmount(cryptoValue)
            console.log("[v0] Updated crypto amount for", networkId, ":", cryptoValue)
        } else {
            setCryptoAmount(0)
        }
    }

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 py-8 px-4">
            <div className="relative max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-6"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Retour</span>
                    </button>

                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        Vérification
                        <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                            {" "}
                            KYC
                        </span>
                    </h1>
                    <p className="text-slate-300 text-lg">
                        Complétez votre vérification pour débloquer toutes les fonctionnalités
                    </p>
                </div>

                {order && (
                    <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-4 mb-8 text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                            <span className="text-red-400 font-semibold font-mono">TEMPS RESTANT POUR PAYER</span>
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-3xl font-bold text-white font-mono">{formatTime(timeLeft)}</div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - KYC Info */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-6 font-mono">Informations KYC</h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-lg">
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold mb-1">Sécurité Renforcée</h3>
                                    <p className="text-slate-400 text-sm">Protection complète de votre compte et transactions</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-lg">
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold mb-1">Conformité Réglementaire</h3>
                                    <p className="text-slate-400 text-sm">Respect des normes financières internationales</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-lg">
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold mb-1">Accès Complet</h3>
                                    <p className="text-slate-400 text-sm">Débloquez tous les retraits et fonctionnalités premium</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-600/30 pt-4">
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <svg
                                        className="w-5 h-5 text-amber-400 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <p className="text-amber-200 font-semibold">Frais de Vérification</p>
                                </div>
                                <p className="text-amber-100 text-sm">
                                    Un dépôt de caution de <span className="font-bold text-lg">€{verificationAmount}</span> unique et remboursable est requis pour traiter votre vérification KYC.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Payment */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-6 font-mono">Méthode de Paiement</h2>

                        <div className="space-y-3 mb-6">
                            {paymentOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleNetworkChange(option.id)}
                                    className={`w-full p-4 rounded-xl border transition-all duration-300 ${selectedPayment === option.id
                                        ? `border-${option.glowColor} bg-gradient-to-r ${option.color}/20 shadow-lg shadow-${option.glowColor}/25`
                                        : "border-slate-600/30 bg-slate-700/30 hover:border-slate-500/50"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div
                                                className={`w-12 h-12 bg-gradient-to-r ${option.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                                            >
                                                {option.symbol}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-white font-semibold">{option.name}</div>
                                                <div className="text-slate-400 text-sm">{option.network}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-400 text-sm">Prix Actuel</div>
                                            <div className="text-white font-semibold">
                                                {cryptoPrices[option.id]
                                                    ? `€${cryptoPrices[option.id].toLocaleString()}`
                                                    : loadingPrices
                                                        ? "Chargement..."
                                                        : "Prix indisponible"}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-300 font-mono">Montant (EUR):</span>
                                <span className="text-white font-bold text-xl">€{verificationAmount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 font-mono">Montant en {selectedPayment}:</span>
                                <span className="text-cyan-400 font-bold text-lg">
                                    {loadingPrices
                                        ? "Chargement..."
                                        : !cryptoPrices[selectedPayment]
                                            ? "Prix indisponible"
                                            : cryptoAmount > 0
                                                ? `${cryptoAmount.toFixed(selectedPayment === "BTC" ? 8 : selectedPayment === "ETH" ? 6 : 2)} ${selectedPayment}`
                                                : "Calcul en cours..."}
                                </span>
                            </div>
                        </div>

                        {isCreatingOrder && (
                            <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 mb-6">
                                <div className="animate-pulse">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="h-4 bg-slate-600 rounded w-32"></div>
                                        <div className="h-6 bg-slate-600 rounded w-16"></div>
                                    </div>
                                    <div className="flex justify-center mb-4">
                                        <div className="bg-slate-600 rounded-lg w-48 h-48"></div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                                        <div className="h-4 bg-slate-600 rounded w-full"></div>
                                    </div>
                                    <div className="h-12 bg-slate-600 rounded-xl w-full"></div>
                                </div>
                                <div className="text-center mt-4">
                                    <div className="inline-flex items-center space-x-2 text-cyan-400">
                                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="font-mono">Création de la commande et génération de l'adresse...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {orderError && (
                            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
                                <div className="flex items-center space-x-2 text-red-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span className="font-semibold">Erreur de création de commande</span>
                                </div>
                                <p className="text-red-300 mt-2">{orderError}</p>
                                <button
                                    onClick={handlePayForKYC}
                                    className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 hover:text-red-200 transition-colors"
                                >
                                    Réessayer
                                </button>
                            </div>
                        )}

                        {!order && !isCreatingOrder && (
                            <button
                                onClick={handlePayForKYC}
                                disabled={isCreatingOrder || !cryptoPrices[selectedPayment]}
                                className={`w-full bg-gradient-to-r ${selectedOption?.color} hover:shadow-lg text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 font-mono mb-6 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isCreatingOrder ? "CRÉATION EN COURS..." : `PAYER POUR KYC (${selectedPayment})`}
                            </button>
                        )}

                        {paymentAddress && !isCreatingOrder && order && (
                            <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-semibold font-mono">Adresse de Paiement</h3>
                                    <div
                                        className={`px-3 py-1 bg-gradient-to-r ${selectedOption?.color} rounded-full text-white text-sm font-semibold`}
                                    >
                                        {selectedPayment}
                                    </div>
                                </div>

                                {qrCodeUrl && (
                                    <div className="flex justify-center mb-4">
                                        <div className="bg-white p-4 rounded-lg">
                                            <img src={qrCodeUrl || "/placeholder.svg"} alt="Payment QR Code" className="w-48 h-48" />
                                        </div>
                                    </div>
                                )}

                                <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                                    <div className="text-slate-300 font-mono text-sm break-all">{paymentAddress}</div>
                                </div>

                                <button
                                    onClick={() => copyToClipboard(paymentAddress, selectedPayment)}
                                    className={`w-full bg-gradient-to-r ${selectedOption?.color} hover:shadow-lg text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 font-mono`}
                                >
                                    {copied === selectedPayment ? "✓ COPIÉ!" : "COPIER L'ADRESSE"}
                                </button>
                            </div>
                        )}

                        {paymentAddress && (
                            <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
                                <h4 className="text-cyan-400 font-semibold mb-2 font-mono">INSTRUCTIONS:</h4>
                                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-medium px-3 py-2 rounded-lg mb-3">
                                    ⚠️ Please make sure to send <span className="font-semibold">more than the expected amount </span>
                                    to cover network fees. Underpayment may result in delays or failed processing.
                                </div>

                                <ul className="text-slate-300 text-sm space-y-1">
                                    <li>
                                        • Envoyez exactement{" "}
                                        {order?.amountCrypto
                                            ? `${Number(order.amountCrypto).toFixed(selectedPayment === "BTC" ? 8 : selectedPayment === "ETH" ? 6 : 2)} ${selectedPayment}`
                                            : cryptoAmount > 0
                                                ? `${cryptoAmount.toFixed(selectedPayment === "BTC" ? 8 : selectedPayment === "ETH" ? 6 : 2)} ${selectedPayment}`
                                                : "montant en cours de calcul"}
                                    </li>
                                    <li>• Utilisez uniquement le réseau {selectedOption?.network}</li>
                                    <li>• Scannez le QR code ou copiez l'adresse</li>
                                    <li>• Votre vérification sera traitée après confirmation</li>
                                    <li>• Conservez votre hash de transaction</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VerifyKYC
