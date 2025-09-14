import { Outlet } from "react-router-dom"
import "./App.css"
import TelegramSupportButton from "./components/TelegramSupportButton"
import FacebookPixel from "./components/FacebookPixel" // 👈 add this

function App() {
  return (
    <div className="App min-h-screen">
      <FacebookPixel />  {/* 👈 this will track PageView on every navigation */}
      <Outlet />          {/* Renders the matched child route */}
      <TelegramSupportButton />
    </div>
  )
}

export default App
