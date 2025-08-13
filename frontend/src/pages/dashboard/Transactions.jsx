const Transactions = () => {
    const transactions = [
        { id: "TX001", type: "Dépôt", amount: "€500", crypto: "ETH", status: "Confirmé", date: "2024-01-15 14:30" },
        { id: "TX002", type: "Gain", amount: "€75", crypto: "BTC", status: "Reçu", date: "2024-01-15 12:15" },
        { id: "TX003", type: "Dépôt", amount: "€250", crypto: "SOL", status: "En cours", date: "2024-01-15 10:45" },
        { id: "TX004", type: "Retrait", amount: "€1,200", crypto: "ETH", status: "Traité", date: "2024-01-14 16:20" },
    ]

    return (
        <div className="space-y-6">
            {/* Transaction Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Total Dépôts</h3>
                    <p className="text-2xl font-bold text-white">€2,450</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Total Gains</h3>
                    <p className="text-2xl font-bold text-white">€1,890</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Total Retraits</h3>
                    <p className="text-2xl font-bold text-white">€1,200</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Solde Net</h3>
                    <p className="text-2xl font-bold text-white">€3,140</p>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Historique des Transactions</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-600">
                                <th className="text-left text-gray-400 font-medium py-3">ID Transaction</th>
                                <th className="text-left text-gray-400 font-medium py-3">Type</th>
                                <th className="text-left text-gray-400 font-medium py-3">Montant</th>
                                <th className="text-left text-gray-400 font-medium py-3">Crypto</th>
                                <th className="text-left text-gray-400 font-medium py-3">Statut</th>
                                <th className="text-left text-gray-400 font-medium py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                                    <td className="py-4 text-white font-mono text-sm">{tx.id}</td>
                                    <td className="py-4 text-white">{tx.type}</td>
                                    <td className="py-4 text-white font-semibold">{tx.amount}</td>
                                    <td className="py-4">
                                        <span className="bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-900 px-2 py-1 rounded text-xs font-bold">
                                            {tx.crypto}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === "Confirmé" || tx.status === "Reçu" || tx.status === "Traité"
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : "bg-yellow-500/20 text-yellow-400"
                                                }`}
                                        >
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="py-4 text-gray-400 text-sm">{tx.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Transactions
