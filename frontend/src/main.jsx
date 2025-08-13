import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import App from "./App.jsx";

// Define the router with nested routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // App as main layout wrapper
    children: [
      { path: "/", element: <HomePage /> },
      // Add more routes here as the app grows
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
