const DataTable = ({ title, data, columns }) => {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <h3 className="text-white text-lg font-semibold">{title}</h3>
                    <button className="text-slate-400 hover:text-white text-sm font-medium">View All</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-slate-700/50">
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                        Showing 1 to {data.length} of {data.length} results
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 text-sm font-medium text-slate-400 hover:text-white">Previous</button>
                        <button className="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-lg">1</button>
                        <button className="px-3 py-1 text-sm font-medium text-slate-400 hover:text-white">Next</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DataTable
