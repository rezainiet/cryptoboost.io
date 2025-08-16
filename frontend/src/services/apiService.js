const API_BASE_URL = "http://localhost:9000"

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
}

const apiService = new ApiService()
export { apiService }
export default apiService
