import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import App from "./App.jsx"
import HomePage from "./pages/HomePage.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import LoginPage from "./pages/LoginPage.jsx"
import RegisterPage from "./pages/RegisterPage.jsx"
import PrivateRoute from "./components/Auth/PrivateRoute.jsx"
import DashboardHome from "./pages/dashboard/DashboardHome.jsx"
import Investments from "./pages/dashboard/Investments.jsx"
import Performance from "./pages/dashboard/Performance.jsx"
import Portfolio from "./pages/dashboard/Portfolio.jsx"
import Transactions from "./pages/dashboard/Transactions.jsx"
import Settings from "./pages/dashboard/Settings.jsx"

// Define the router with nested routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // App as main layout wrapper
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      {
        path: "/dashboard",
        element: (
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        ),
        children: [
          { index: true, element: <DashboardHome /> },
          { path: "investments", element: <Investments /> },
          { path: "performance", element: <Performance /> },
          { path: "portfolio", element: <Portfolio /> },
          { path: "transactions", element: <Transactions /> },
          { path: "settings", element: <Settings /> },
        ],
      },
      // Add more routes here as the app grows
    ],
  },
])

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
