"use client"
import { signOut } from "firebase/auth"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../firebase"
import { useNavigate } from "react-router-dom"


const Sidebar = ({ isOpen, toggleSidebar }) => {
    const [user] = useAuthState(auth)
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth)
            navigate("/admin/login")
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={toggleSidebar} />}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700">
                        <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                        <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4">
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                                        />
                                    </svg>
                                    Dashboard
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                        />
                                    </svg>
                                    Users
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    Analytics
                                </a>
                            </li>
                        </ul>
                    </nav>

                    {/* User info and logout */}
                    <div className="p-4 border-t border-slate-700">
                        {user && (
                            <div className="mb-4">
                                <p className="text-sm text-slate-400">Signed in as:</p>
                                <p className="text-white font-medium truncate">{user.email}</p>
                            </div>
                        )}

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-2 text-slate-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Sidebar
