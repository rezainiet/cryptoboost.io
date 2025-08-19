"use client"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        )
    }

    return user ? children : <Navigate to="/admin/login" replace />
}

export default PrivateRoute
