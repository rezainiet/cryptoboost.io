"use client"

import { useState } from "react"
import Sidebar from "./components/sidebar"
import Header from "./components/header"
import DashboardContent from "./components/dashboard-content"

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-900 lg:grid lg:grid-cols-[256px_1fr]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Container */}
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <DashboardContent />
        </main>
      </div>
    </div>
  )
}