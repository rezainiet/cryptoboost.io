"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../../../firebase"
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { apiService } from "../../services/apiService"
import DashboardKYC from "./DashboardKYC"
import DashboardKYCProcessing from "./DashboardKYCProcessing"

const Settings = () => {
    const [activeTab, setActiveTab] = useState("profile")
    const [user] = useAuthState(auth)
    const [connectionHistory, setConnectionHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        phone: "",
        createdAt: "",
        role: "",
    })
    const [profileLoading, setProfileLoading] = useState(false)
    const [profileError, setProfileError] = useState("")
    const [profileSuccess, setProfileSuccess] = useState("")
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [kycStatus, setKycStatus] = useState({});

    useEffect(() => {
        if (!user?.email) return;

        const fetchKycStatus = async () => {
            try {
                const result = await apiService.getUserKYCStatus(user.email);
                setKycStatus(result);
            } catch (error) {
                console.error("Failed to fetch KYC status:", error);
            }
        };

        fetchKycStatus();
    }, [user?.email]);

    const tabs = [
        { id: "profile", label: "Profil", icon: "👤" },
        { id: "security", label: "Sécurité", icon: "🔒" },
    ]

    const fetchUserProfile = async () => {
        if (!user?.email) return

        try {
            setProfileLoading(true)
            setProfileError("")
            const userData = await apiService.getUserByEmail(user.email)
            setProfileData({
                name: userData.name || "",
                email: userData.email || "",
                phone: userData.phone || "",
                createdAt: userData.createdAt || "",
                role: userData.role || "",
            })
        } catch (error) {
            console.error("Error fetching user profile:", error)
            setProfileError("Erreur lors du chargement du profil")
        } finally {
            setProfileLoading(false)
        }
    }

    const handleProfileUpdate = async (e) => {
        e.preventDefault()
        if (!user?.email) return

        try {
            setProfileLoading(true)
            setProfileError("")
            setProfileSuccess("")

            const updateData = {
                name: profileData.name,
                phone: profileData.phone,
            }

            await apiService.updateUserProfile(user.email, updateData)
            setProfileSuccess("Profil mis à jour avec succès")

            // Log activity
            await apiService.logUserActivity(user.email, "profile_updated", {
                timestamp: new Date().toISOString(),
                changes: Object.keys(updateData),
            })

            // Clear success message after 3 seconds
            setTimeout(() => setProfileSuccess(""), 3000)
        } catch (error) {
            console.error("Error updating profile:", error)
            setProfileError("Erreur lors de la mise à jour du profil")
        } finally {
            setProfileLoading(false)
        }
    }

    const fetchConnectionHistory = async () => {
        if (!user?.email) return

        try {
            setLoading(true)
            const activityLogs = await apiService.getUserActivityLogs(user.email)
            setConnectionHistory(activityLogs || [])
        } catch (error) {
            console.error("Error fetching connection history:", error)
            setConnectionHistory([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user?.email) {
            fetchUserProfile()
        }
    }, [user?.email])

    useEffect(() => {
        if (activeTab === "security" && user?.email) {
            fetchConnectionHistory()
        }
    }, [activeTab, user?.email])

    const handlePasswordChange = async (e) => {
        e.preventDefault()

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("Les nouveaux mots de passe ne correspondent pas")
            return
        }

        if (passwordData.newPassword.length < 6) {
            alert("Le nouveau mot de passe doit contenir au moins 6 caractères")
            return
        }

        try {
            setLoading(true)

            // Reauthenticate user
            const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword)
            await reauthenticateWithCredential(user, credential)

            // Update password
            await updatePassword(user, passwordData.newPassword)

            // Log activity
            await apiService.logUserActivity(user.email, "password_changed", {
                timestamp: new Date().toISOString(),
            })

            alert("Mot de passe modifié avec succès")
            setShowPasswordModal(false)
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        } catch (error) {
            console.error("Error changing password:", error)
            alert("Erreur lors du changement de mot de passe: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Paramètres du Compte</h1>
                    <p className="text-gray-300">Gérez vos préférences et paramètres de sécurité</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 mb-8 p-1 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-teal-500/20">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${activeTab === tab.id
                                ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25"
                                : "text-gray-400 hover:text-white hover:bg-slate-700/50"
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {activeTab === "profile" && (
                            <>
                                {/* Profile Information */}
                                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6 hover:border-teal-400/30 transition-all duration-300">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                            {profileData.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Informations Personnelles</h2>
                                            <p className="text-gray-400">Mettez à jour vos informations de profil</p>
                                        </div>
                                    </div>

                                    {profileError && (
                                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                            {profileError}
                                        </div>
                                    )}
                                    {profileSuccess && (
                                        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
                                            {profileSuccess}
                                        </div>
                                    )}

                                    <form onSubmit={handleProfileUpdate}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-300 text-sm font-medium mb-2">Nom Complet</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all"
                                                    placeholder="Votre nom complet"
                                                    value={profileData.name}
                                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                    disabled={profileLoading}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
                                                    value={profileData.email || user?.email || ""}
                                                    disabled
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 text-sm font-medium mb-2">Téléphone</label>
                                                <input
                                                    type="tel"
                                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all"
                                                    placeholder="+33 1 23 45 67 89"
                                                    value={profileData.phone}
                                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                    disabled={profileLoading}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 text-sm font-medium mb-2">Date d'inscription</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
                                                    value={profileData.createdAt ? formatDate(profileData.createdAt) : "N/A"}
                                                    disabled
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end mt-6">
                                            <button
                                                type="submit"
                                                disabled={profileLoading}
                                                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:from-teal-400 hover:to-emerald-400 transition-all duration-300 shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {profileLoading ? "Sauvegarde..." : "Sauvegarder les Modifications"}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* KYC Verification */}
                                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6 hover:border-teal-400/30 transition-all duration-300">
                                    <h3 className="text-xl font-bold text-white mb-4">Vérification KYC</h3>
                                    {
                                        kycStatus?.code === 3203 ?
                                            <DashboardKYC /> : null
                                    }
                                    {
                                        kycStatus?.code === 3204 ?
                                            <DashboardKYCProcessing /> : (
                                                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-lg">✓</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-medium">Compte Vérifié</h4>
                                                            <p className="text-emerald-400 text-sm">Votre identité a été confirmée</p>
                                                        </div>
                                                    </div>
                                                    <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
                                                        Vérifié
                                                    </span>
                                                </div>
                                            )
                                    }
                                </div>
                            </>
                        )}

                        {activeTab === "security" && (
                            <>
                                {/* Security Settings */}
                                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6 hover:border-teal-400/30 transition-all duration-300">
                                    <h2 className="text-xl font-bold text-white mb-6">Paramètres de Sécurité</h2>

                                    <div className="space-y-4">
                                        {/* 2FA - Disabled */}
                                        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 opacity-60">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                                                    <span className="text-gray-400 text-lg">🔐</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-medium">Authentification à Deux Facteurs</h3>
                                                    <p className="text-gray-400 text-sm">Fonctionnalité bientôt disponible</p>
                                                </div>
                                            </div>
                                            <button
                                                disabled
                                                className="bg-gray-600 text-gray-400 px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                                            >
                                                Bientôt
                                            </button>
                                        </div>

                                        {/* Password Change */}
                                        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-teal-500/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                                                    <span className="text-teal-400 text-lg">🔑</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-medium">Changer le Mot de Passe</h3>
                                                    <p className="text-gray-400 text-sm">
                                                        Dernière modification:{" "}
                                                        {user?.metadata?.lastSignInTime ? formatDate(user.metadata.lastSignInTime) : "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowPasswordModal(true)}
                                                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:from-teal-400 hover:to-emerald-400 transition-all duration-300 shadow-lg shadow-teal-500/25"
                                            >
                                                Modifier
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Connection History */}
                                <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6 hover:border-teal-400/30 transition-all duration-300">
                                    <h3 className="text-xl font-bold text-white mb-4">Historique de Connexion</h3>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {connectionHistory.length > 0 ? (
                                                connectionHistory.map((log, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-3 h-3 rounded-full ${log.action === "user_login" || log.action === "login"
                                                                    ? "bg-emerald-400"
                                                                    : log.action === "user_registered" || log.action === "registration"
                                                                        ? "bg-blue-400"
                                                                        : log.action === "password_changed"
                                                                            ? "bg-orange-400"
                                                                            : log.action === "profile_updated"
                                                                                ? "bg-purple-400"
                                                                                : "bg-gray-400"
                                                                    }`}
                                                            ></div>
                                                            <div>
                                                                <p className="text-white text-sm font-medium">
                                                                    {log.action === "user_login" || log.action === "login"
                                                                        ? "Connexion"
                                                                        : log.action === "user_registered" || log.action === "registration"
                                                                            ? "Inscription"
                                                                            : log.action === "password_changed"
                                                                                ? "Mot de passe modifié"
                                                                                : log.action === "profile_updated"
                                                                                    ? "Profil mis à jour"
                                                                                    : log.action}
                                                                </p>
                                                                <p className="text-gray-400 text-xs">
                                                                    {formatDate(log.timestamp)} • IP: {log.ip || "N/A"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs ${log.action === "user_login" || log.action === "login"
                                                                ? "bg-emerald-500/20 text-emerald-400"
                                                                : log.action === "user_registered" || log.action === "registration"
                                                                    ? "bg-blue-500/20 text-blue-400"
                                                                    : log.action === "password_changed"
                                                                        ? "bg-orange-500/20 text-orange-400"
                                                                        : log.action === "profile_updated"
                                                                            ? "bg-purple-500/20 text-purple-400"
                                                                            : "bg-gray-500/20 text-gray-400"
                                                                }`}
                                                        >
                                                            {log.action === "user_login" || log.action === "login"
                                                                ? "Connexion"
                                                                : log.action === "user_registered" || log.action === "registration"
                                                                    ? "Inscription"
                                                                    : log.action === "password_changed"
                                                                        ? "Sécurité"
                                                                        : log.action === "profile_updated"
                                                                            ? "Profil"
                                                                            : "Activité"}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-400 text-center py-4">Aucun historique disponible</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Account Status */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Statut du Compte</h3>
                            {profileLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-400"></div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Niveau</span>
                                        <span className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-2 py-1 rounded text-xs font-medium">
                                            {profileData.role === "admin" ? "Admin" : "Premium"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Membre depuis</span>
                                        <span className="text-white text-sm">
                                            {profileData.createdAt
                                                ? new Date(profileData.createdAt).toLocaleDateString("fr-FR", {
                                                    month: "short",
                                                    year: "numeric",
                                                })
                                                : "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Dernière activité</span>
                                        <span className="text-white text-sm">Maintenant</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Actions Rapides</h3>
                            <div className="space-y-2">
                                <button className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:from-teal-400 hover:to-emerald-400 transition-all duration-300 shadow-lg shadow-teal-500/25">
                                    Télécharger les Données
                                </button>
                                <button className="w-full bg-slate-700/50 text-white py-2 px-4 rounded-lg font-medium hover:bg-slate-600/50 transition-all duration-300 border border-slate-600">
                                    Support Client
                                </button>
                                <button className="w-full bg-red-500/20 text-red-400 py-2 px-4 rounded-lg font-medium hover:bg-red-500/30 transition-all duration-300 border border-red-500/30">
                                    Supprimer le Compte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-teal-500/20 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Changer le Mot de Passe</h3>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Mot de passe actuel</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Nouveau mot de passe</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Confirmer le nouveau mot de passe
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 bg-slate-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-slate-600 transition-all duration-300"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:from-teal-400 hover:to-emerald-400 transition-all duration-300 shadow-lg shadow-teal-500/25 disabled:opacity-50"
                                >
                                    {loading ? "Modification..." : "Modifier"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Settings
