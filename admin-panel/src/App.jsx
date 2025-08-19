import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import AdminLogin from "./components/AdminLogin"
import AdminDashboard from "./components/AdminDashboard"

import PrivateRoute from "./components/private-route"

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-900">
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
