"use client"

import { useEffect, useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../../firebase"
import { Copy, ChevronDown, ChevronUp, ExternalLink, Wallet, Calendar, Hash, DollarSign } from "lucide-react"
import apiService from "../../services/apiService"

const Transactions = () => {
    const [user] = useAuthState(auth)
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedRows, setExpandedRows] = useState(new Set())
    const [copiedId, setCopiedId] = useState(null);
    const [kycStatus, setKycStatus] = useState({});


    useEffect(() => {
        if (!user?.email) return;

        const fetchKycStatus = async () => {
            try {
                const result = await apiService.getUserKYCStatus(user.email);
                setKycStatus(result);
            } catch (error) {
                console.error("Failed to fetch KYC status:", error);
            }
        };

        fetchKycStatus();
    }, [user?.email]);


    useEffect(() => {
        if (!user?.email) return

        const fetchWithdrawals = async () => {
            try {
                setLoading(true)
                const res = await fetch(`https://cryptoboost-io.onrender.com/withdrawals/get-withdrawals/${user.email}`)
                const data = await res.json()

                if (data.success) {
                    setTransactions(data.withdrawals || [])
                } else {
                    setTransactions([])
                }
            } catch (err) {
                console.error("Error fetching withdrawals:", err)
                setTransactions([])
            } finally {
                setLoading(false)
            }
        }

        fetchWithdrawals()
    }, [user?.email])

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedRows(newExpanded)
    }

    const truncateAddress = (address) => {
        if (!address || address.length < 12) return address
        return `${address.slice(0, 6)}...${address.slice(-6)}`
    }


    console.log(kycStatus);
    const isKYCCompleted = kycStatus?.code === 3205;

    const getStatusBadge = (status) => {
        const statusConfig = {
            completed: "bg-green-500/20 text-green-400 border-green-500/30",
            pending_approval: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            rejected: "bg-red-500/20 text-red-400 border-red-500/30",
            processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        }

        const className = statusConfig[status] || statusConfig.pending_approval
        const displayText = status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${className}`}>
                {displayText}
            </span>
        )
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-teal-500/20 rounded-2xl p-8">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-400 text-lg animate-pulse">Chargement des transactions...</p>
                </div>
            </div>
        )
    }

    if (!transactions.length) {
        return (
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-teal-500/20 rounded-2xl overflow-hidden">
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
                    <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mb-6">
                        <Wallet className="w-10 h-10 text-teal-400" />
                    </div>
                    <h3 className="text-gray-300 text-xl font-semibold mb-2">Aucune Transaction</h3>
                    <p className="text-gray-400 text-center max-w-md">
                        Vous n'avez pas encore effectué de retrait. Vos transactions apparaîtront ici une fois que vous aurez
                        effectué votre premier retrait.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-teal-500/20 rounded-2xl overflow-hidden">
            <div className="border-b border-teal-500/20 pb-6 p-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    Historique des Retraits
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                    {transactions.length} transaction{transactions.length > 1 ? "s" : ""} au total
                </p>
            </div>

            <div className="p-0">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-teal-500/10">
                            <tr className="text-teal-400 text-sm">
                                <th className="py-4 px-6 text-left font-semibold">Réseau</th>
                                <th className="py-4 px-6 text-left font-semibold">Montant</th>
                                <th className="py-4 px-6 text-left font-semibold">Frais</th>
                                <th className="py-4 px-6 text-left font-semibold">Statut</th>
                                <th className="py-4 px-6 text-left font-semibold">Date</th>
                                <th className="py-4 px-6 text-center font-semibold">Détails</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <>
                                    <tr
                                        key={tx._id}
                                        className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-all duration-200"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-teal-500/10 rounded-full flex items-center justify-center">
                                                    <span className="text-teal-400 text-xs font-bold">{tx.network}</span>
                                                </div>
                                                <span className="text-gray-300 font-medium">{tx.network}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-green-400" />
                                                <span className="text-gray-200 font-semibold">
                                                    €
                                                    {tx.requestedAmount.toLocaleString("fr-FR", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-gray-400 text-sm">
                                                €
                                                {tx.verificationAmount.toLocaleString("fr-FR", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </td>
                                        {isKYCCompleted ? (
                                            <td className="py-4 px-6">
                                                {getStatusBadge("completed")}
                                            </td>
                                        ) : (
                                            <td className="py-4 px-6">
                                                {getStatusBadge(tx.status)}
                                            </td>
                                        )}

                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(tx.createdAt)}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => toggleRow(tx._id)}
                                                className="inline-flex items-center justify-center p-2 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-colors"
                                            >
                                                {expandedRows.has(tx._id) ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>

                                    {expandedRows.has(tx._id) && (
                                        <tr className="bg-slate-800/50 border-b border-slate-700/50">
                                            <td colSpan="6" className="py-6 px-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                                                                ID de Retrait
                                                            </label>
                                                            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
                                                                <Hash className="w-4 h-4 text-teal-400 flex-shrink-0" />
                                                                <span className="text-gray-300 text-sm font-mono flex-1 truncate">
                                                                    {tx.withdrawalId}
                                                                </span>
                                                                <button
                                                                    onClick={() => copyToClipboard(tx.withdrawalId, `withdrawal-${tx._id}`)}
                                                                    className="h-8 w-8 p-0 hover:bg-teal-500/10 rounded flex items-center justify-center transition-colors"
                                                                >
                                                                    <Copy
                                                                        className={`w-3 h-3 ${copiedId === `withdrawal-${tx._id}` ? "text-green-400" : "text-gray-400"}`}
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                                                                ID de Commande
                                                            </label>
                                                            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
                                                                <Hash className="w-4 h-4 text-teal-400 flex-shrink-0" />
                                                                <span className="text-gray-300 text-sm font-mono flex-1 truncate">{tx.orderId}</span>
                                                                <button
                                                                    onClick={() => copyToClipboard(tx.orderId, `order-${tx._id}`)}
                                                                    className="h-8 w-8 p-0 hover:bg-teal-500/10 rounded flex items-center justify-center transition-colors"
                                                                >
                                                                    <Copy
                                                                        className={`w-3 h-3 ${copiedId === `order-${tx._id}` ? "text-green-400" : "text-gray-400"}`}
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                                                                ID de Vérification
                                                            </label>
                                                            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
                                                                <Hash className="w-4 h-4 text-teal-400 flex-shrink-0" />
                                                                <span className="text-gray-300 text-sm font-mono flex-1 truncate">
                                                                    {tx.verificationPaymentId}
                                                                </span>
                                                                <button
                                                                    onClick={() => copyToClipboard(tx.verificationPaymentId, `verification-${tx._id}`)}
                                                                    className="h-8 w-8 p-0 hover:bg-teal-500/10 rounded flex items-center justify-center transition-colors"
                                                                >
                                                                    <Copy
                                                                        className={`w-3 h-3 ${copiedId === `verification-${tx._id}` ? "text-green-400" : "text-gray-400"}`}
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                                                                Adresse de Portefeuille
                                                            </label>
                                                            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
                                                                <Wallet className="w-4 h-4 text-teal-400 flex-shrink-0" />
                                                                <span
                                                                    className="text-gray-300 text-sm font-mono flex-1 truncate"
                                                                    title={tx.walletAddress}
                                                                >
                                                                    {truncateAddress(tx.walletAddress)}
                                                                </span>
                                                                <button
                                                                    onClick={() => copyToClipboard(tx.walletAddress, `wallet-${tx._id}`)}
                                                                    className="h-8 w-8 p-0 hover:bg-teal-500/10 rounded flex items-center justify-center transition-colors"
                                                                >
                                                                    <Copy
                                                                        className={`w-3 h-3 ${copiedId === `wallet-${tx._id}` ? "text-green-400" : "text-gray-400"}`}
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {tx.verificationTxHash && (
                                                            <div>
                                                                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                                                                    Hash de Transaction
                                                                </label>
                                                                <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
                                                                    <ExternalLink className="w-4 h-4 text-teal-400 flex-shrink-0" />
                                                                    <span className="text-gray-300 text-sm font-mono flex-1 truncate">
                                                                        {truncateAddress(tx.verificationTxHash)}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => copyToClipboard(tx.verificationTxHash, `txhash-${tx._id}`)}
                                                                        className="h-8 w-8 p-0 hover:bg-teal-500/10 rounded flex items-center justify-center transition-colors"
                                                                    >
                                                                        <Copy
                                                                            className={`w-3 h-3 ${copiedId === `txhash-${tx._id}` ? "text-green-400" : "text-gray-400"}`}
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-400 text-sm">Montant Demandé</span>
                                                                <span className="text-gray-200 font-semibold">
                                                                    €{tx.requestedAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-400 text-sm">Frais de Vérification</span>
                                                                <span className="text-yellow-400 font-semibold">
                                                                    €{tx.verificationAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            <div className="border-t border-slate-700/50 pt-2 mt-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-teal-400 font-semibold">Total à Recevoir</span>
                                                                    <span className="text-teal-400 font-bold text-lg">
                                                                        €
                                                                        {(tx.requestedAmount + tx.verificationAmount).toLocaleString("fr-FR", {
                                                                            minimumFractionDigits: 2,
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden space-y-4 p-4">
                    {transactions.map((tx) => (
                        <div key={tx._id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-teal-500/10 rounded-full flex items-center justify-center">
                                            <span className="text-teal-400 text-sm font-bold">{tx.network}</span>
                                        </div>
                                        <div>
                                            <p className="text-gray-200 font-semibold">
                                                €{tx.requestedAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-gray-500 text-xs">{formatDate(tx.createdAt)}</p>
                                        </div>
                                    </div>
                                    {isKYCCompleted ? getStatusBadge("completed") : getStatusBadge(tx.status)}
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-700/50">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Frais de vérification</span>
                                        <span className="text-yellow-400 font-medium">
                                            €{tx.verificationAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-teal-400 font-semibold">Total à recevoir</span>
                                        <span className="text-teal-400 font-bold">
                                            €
                                            {(tx.requestedAmount + tx.verificationAmount).toLocaleString("fr-FR", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleRow(tx._id)}
                                    className="w-full border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 rounded-lg py-2 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {expandedRows.has(tx._id) ? (
                                        <>
                                            <ChevronUp className="w-4 h-4" />
                                            Masquer les détails
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-4 h-4" />
                                            Voir les détails
                                        </>
                                    )}
                                </button>

                                {expandedRows.has(tx._id) && (
                                    <div className="space-y-3 pt-3 border-t border-slate-700/50">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                                                Adresse de Portefeuille
                                            </label>
                                            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-2">
                                                <span className="text-gray-300 text-xs font-mono flex-1 truncate">
                                                    {truncateAddress(tx.walletAddress)}
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(tx.walletAddress, `wallet-mobile-${tx._id}`)}
                                                    className="h-7 w-7 p-0 hover:bg-teal-500/10 rounded flex items-center justify-center transition-colors"
                                                >
                                                    <Copy
                                                        className={`w-3 h-3 ${copiedId === `wallet-mobile-${tx._id}` ? "text-green-400" : "text-gray-400"}`}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">ID de Retrait</label>
                                            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-2">
                                                <span className="text-gray-300 text-xs font-mono flex-1 truncate">{tx.withdrawalId}</span>
                                                <button
                                                    onClick={() => copyToClipboard(tx.withdrawalId, `withdrawal-mobile-${tx._id}`)}
                                                    className="h-7 w-7 p-0 hover:bg-teal-500/10 rounded flex items-center justify-center transition-colors"
                                                >
                                                    <Copy
                                                        className={`w-3 h-3 ${copiedId === `withdrawal-mobile-${tx._id}` ? "text-green-400" : "text-gray-400"}`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Transactions
