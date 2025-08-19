"use client"

const Header = ({ toggleSidebar }) => {
    return (
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
                aria-label="Toggle sidebar"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <div className="flex-1 lg:flex-none">
                <h2 className="text-xl font-semibold text-white">Dashboard</h2>
            </div>

            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:block relative">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-64 px-4 py-2 pl-10 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg
                        className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>

                {/* Notifications */}
                <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-5 5v-5zM4 12h16m-7-7l7 7-7 7"
                        />
                    </svg>
                </button>

                {/* Profile */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">A</span>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
