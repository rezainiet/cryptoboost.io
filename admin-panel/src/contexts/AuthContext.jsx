"use client"

import { createContext, useContext } from "react"
import { useAuthState, useSignInWithEmailAndPassword, useSignOut } from "react-firebase-hooks/auth"
import { auth } from "../../firebase"

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, loading, error] = useAuthState(auth)
    const [signInWithEmailAndPassword, signInUser, signInLoading, signInError] = useSignInWithEmailAndPassword(auth)
    const [signOut, signOutLoading, signOutError] = useSignOut(auth)

    const login = async (email, password) => {
        return await signInWithEmailAndPassword(email, password)
    }

    const logout = async () => {
        return await signOut()
    }

    const value = {
        user,
        loading,
        error: error || signInError || signOutError,
        login,
        logout,
        signInLoading,
        signOutLoading,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
