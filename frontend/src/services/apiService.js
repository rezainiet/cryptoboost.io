const API_BASE_URL = "https://cryptoboost-io.onrender.com"

class ApiService {
    // Helper method for making HTTP requests
    async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                },
                ...options,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "API request failed")
            }

            return data
        } catch (error) {
            console.error("API Error:", error)
            throw error
        }
    }

    // User Registration
    async registerUser(userData) {
        const cryptoUserData = {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            // Remove instituteName - not relevant for crypto platform
            userType: "investor", // Default user type for crypto platform
            registrationSource: "web",
        }

        return this.makeRequest("/users/register", {
            method: "POST",
            body: JSON.stringify(cryptoUserData),
        })
    }

    // Get user by email
    async getUserByEmail(email) {
        return this.makeRequest(`/users/${email}`)
    }

    // Get user role
    async getUserRole(email) {
        return this.makeRequest(`/users/role/${email}`)
    }

    // Update user profile
    async updateUserProfile(email, userData) {
        return this.makeRequest(`/users/update/${email}`, {
            method: "PATCH",
            body: JSON.stringify(userData),
        })
    }

    // Get all users (with pagination)
    async getAllUsers(page = 1, limit = 10) {
        return this.makeRequest(`/users/all?page=${page}&limit=${limit}`)
    }

    // Delete user
    async deleteUser(userId) {
        return this.makeRequest(`/users/delete/${userId}`, {
            method: "DELETE",
        })
    }

    // Login user (update lastActive)
    async loginUser(email, loginData = {}) {
        const loginPayload = {
            email,
            loginTime: new Date().toISOString(),
            loginSource: "web",
            ...loginData,
        }

        return this.makeRequest("/users/login", {
            method: "POST",
            body: JSON.stringify(loginPayload),
        })
    }

    // Log user activity
    async logUserActivity(email, activity, additionalData = {}) {
        try {
            const logData = {
                email,
                action: activity, // Changed from 'activity' to 'action' to match backend expectation
                timestamp: new Date().toISOString(),
                source: "web",
                userAgent: navigator.userAgent, // Added userAgent for better tracking
                ...additionalData,
            }

            return this.makeRequest("/users/activity-log", {
                method: "POST",
                body: JSON.stringify(logData),
            })
        } catch (error) {
            console.error("Failed to log user activity:", error)
        }
    }

    async getUserActivityLogs(email) {
        return this.makeRequest(`/users/activity-logs/${email}`)
    }

    // Get user orders with pagination and filtering
    async getUserOrders(email, page = 1, limit = 10, status = null) {
        let endpoint = `/payments/user/${email}?page=${page}&limit=${limit}`
        if (status) {
            endpoint += `&status=${status}`
        }
        return this.makeRequest(endpoint)
    }

    // Get user portfolio analytics
    async getUserAnalytics(email) {
        return this.makeRequest(`/payments/analytics/${email}`)
    }

    // Get active investments for dashboard
    async getActiveInvestments(email) {
        return this.makeRequest(`/payments/active/${email}`)
    }

    // Get dashboard statistics
    async getDashboardStats(email) {
        return this.makeRequest(`/payments/dashboard-stats/${email}`)
    }

    // Extend order expiration time
    async extendOrder(orderId, minutes = 30) {
        return this.makeRequest(`/payments/${orderId}/extend`, {
            method: "POST",
            body: JSON.stringify({ minutes }),
        })
    }

    // Create order (for payment flow)
    async createOrder(packageData, network, userEmail) {
        return this.makeRequest("/payments/create-order", {
            method: "POST",
            body: JSON.stringify({
                pkg: packageData,
                network,
                userEmail,
            }),
        })
    }

    // Get order by ID
    async getOrder(orderId) {
        return this.makeRequest(`/payments/${orderId}`)
    }

    // Submit transaction hash
    async submitTransaction(orderId, txHash) {
        return this.makeRequest(`/payments/${orderId}/submit-tx`, {
            method: "POST",
            body: JSON.stringify({ txHash }),
        })
    }

    // Start bot for processing orders
    async startBot(orderId) {
        return this.makeRequest(`/payments/${orderId}/start-bot`, {
            method: "POST",
        })
    }

    // Add trading hash to order (used by background service)
    async addTradingHash(orderId, hash) {
        return this.makeRequest(`/payments/${orderId}/add-hash`, {
            method: "POST",
            body: JSON.stringify({ hash }),
        })
    }

    // Delete expired orders
    async deleteExpiredOrders() {
        return this.makeRequest("/payments/delete-expired", {
            method: "DELETE",
        })
    }

    // Get real-time order updates (for polling)
    async getOrderUpdates(orderId) {
        return this.makeRequest(`/payments/${orderId}`)
    }

    // async updateOrderNetwork(orderId, network) {
    //   return this.makeRequest(`/payments/${orderId}/update-network`, {
    //     method: "PATCH",
    //     body: JSON.stringify({ network }),
    //   })
    // }

    async getExistingPendingOrder(userEmail, packageTitle) {
        return this.makeRequest(`/payments/user/${userEmail}?status=pending&limit=1`)
    }

    async generatePaymentAddress(orderId, network) {
        return this.makeRequest(`/payments/${orderId}/generate-address`, {
            method: "POST",
            body: JSON.stringify({ network }),
        })
    }

    async createVerificationPayment(verificationData) {
        return this.makeRequest("/withdrawals/create-verification-payment", {
            method: "POST",
            body: JSON.stringify(verificationData),
        })
    }

    async createWithdrawalAfterVerification(verificationPaymentId) {
        return this.makeRequest("/withdrawals/create-after-verification", {
            method: "POST",
            body: JSON.stringify({ verificationPaymentId }),
        })
    }

    // Get user withdrawals
    async getUserWithdrawals(email, page = 1, limit = 10) {
        return this.makeRequest(`/withdrawals/user/${email}?page=${page}&limit=${limit}`)
    }

    // Update withdrawal status
    async updateWithdrawalStatus(withdrawalId, status) {
        return this.makeRequest(`/withdrawals/${withdrawalId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status }),
        })
    }

    // Get current crypto prices
    async getCurrentPrices() {
        return this.makeRequest("/prices/current")
    }

    // Get specific crypto price
    async getCryptoPrice(coinId) {
        return this.makeRequest(`/prices/${coinId}`)
    }

    // Convert fiat to crypto amount
    async convertFiatToCrypto(fiatAmount, cryptoSymbol) {
        return this.makeRequest("/prices/convert", {
            method: "POST",
            body: JSON.stringify({
                fiatAmount,
                cryptoSymbol,
                fiatCurrency: "EUR",
            }),
        })
    }
    async updateOrderStatus(data) {
        try {
            const response = await fetch("https://cryptoboost-io.onrender.com/withdrawals/update-order-status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            const result = await response.json()
            return result
        } catch (error) {
            console.error("Error updating order status:", error)
            return { success: false, error: error.message }
        }
    }
}

const apiService = new ApiService()
export { apiService }
export default apiService
