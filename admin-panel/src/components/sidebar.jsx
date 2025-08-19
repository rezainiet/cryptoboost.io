"use client"

import { useState } from "react"

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const [activeItem, setActiveItem] = useState("dashboard")

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: "🏠" },
        { id: "analytics", label: "Analytics", icon: "📊" },
        { id: "sites", label: "Sites", icon: "🌐" },
        { id: "domains", label: "Explore Domain", icon: "🔍" },
        { id: "builder", label: "Website Builder", icon: "🛠️" },
        { id: "service", label: "Manage Service", icon: "⚙️" },
        { id: "monitoring", label: "Monitoring", icon: "📈" },
        { id: "activity", label: "Activity Log", icon: "📋" },
    ]

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={toggleSidebar} />}

            {/* Sidebar */}
            <div
                className={`
        fixed top-0 left-0 h-screen bg-slate-900 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:relative lg:z-auto
        w-64 flex flex-col border-r border-slate-800
      `}
            >
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">W4</span>
                        </div>
                        <span className="text-white text-lg font-semibold">Web4</span>
                    </div>
                </div>

                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {menuItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    onClick={() => setActiveItem(item.id)}
                                    className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-left text-sm font-medium
                    ${activeItem === item.id
                                            ? "bg-slate-800 text-white"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                        }
                  `}
                                >
                                    <span className="text-base">{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </>
    )
}

export default Sidebar
