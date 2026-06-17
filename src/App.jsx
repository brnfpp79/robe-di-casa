import Home from "./pages/Home"
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom"
import Lista from "./pages/Lista"
import Spese from "./pages/Spese"
import Riepilogo from "./pages/Riepilogo"
import Grafici from "./pages/Grafici"

function App() {
  return (
    <BrowserRouter>
      <div style={{   maxWidth: 390,   margin: "0 auto",   paddingBottom: 70,  minHeight: "100vh",  boxShadow: "0 0 40px rgba(0,0,0,0.08)" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lista" element={<Lista />} />
          <Route path="/spese" element={<Spese />} />
          <Route path="/riepilogo" element={<Riepilogo />} />
          <Route path="/grafici" element={<Grafici />} />
        </Routes>
      </div>

      <nav style={{ position: "fixed", bottom: 0, left: "50%",   transform: "translateX(-50%)",
        width: "100%", maxWidth: 390, background: "white", borderTop: "1px solid #eee",
        display: "flex", justifyContent: "space-around", padding: "8px 0", zIndex: 100 }}>
        {[
          { to: "/lista", label: "Lista", icon: "🛒" },
          { to: "/spese", label: "Spese", icon: "💳" },
          { to: "/riepilogo", label: "Totali", icon: "📊" },
          { to: "/grafici", label: "Grafici", icon: "📈" },
        ].map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end style={({ isActive }) => ({
            display: "flex", flexDirection: "column", alignItems: "center",
            textDecoration: "none", fontSize: 10,
            color: isActive ? "#2d7a4f" : "#999",
            gap: 2
          })}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </BrowserRouter>
  )
}

export default App