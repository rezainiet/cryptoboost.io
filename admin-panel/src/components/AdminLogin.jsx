"use client"
import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useAuthState } from "react-firebase-hooks/auth"
import { useEffect } from "react"
import { auth } from "../../firebase"
import { useNavigate } from "react-router-dom"

const AdminLogin = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [user, authLoading] = useAuthState(auth)
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !authLoading) {
            navigate("/admin")
        }
    }, [user, authLoading])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await signInWithEmailAndPassword(auth, email, password)
            navigate("/admin")
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    if (user) {
        return null
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
                        <p className="text-slate-400">Sign in to access the admin dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="admin@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your password"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-400 text-sm">Secure admin access only</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminLogin
