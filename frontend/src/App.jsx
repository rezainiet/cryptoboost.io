import { Outlet } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <div className="App min-h-screen">
      {/* Common layout elements like Navbar/Footer can go here */}
      <Outlet /> {/* Renders the matched child route */}
    </div>
  );
}

export default App;
