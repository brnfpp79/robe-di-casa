import { useState, useEffect } from "react"
import { auth } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"
import Login from "./pages/Login"
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom"
import Home from "./pages/Home"
import Lista from "./pages/Lista"
import Spese from "./pages/Spese"
import Riepilogo from "./pages/Riepilogo"
import Grafici from "./pages/Grafici"

function Layout() {
  const [utente, setUtente] = useState(undefined)

useEffect(() => {
  return onAuthStateChanged(auth, (u) => setUtente(u))
}, [])

if (utente === undefined) return null
if (!utente) return <Login />
  const location = useLocation()
  const isHome = location.pathname === "/"

  return (
    <div style={{ paddingBottom: 70, minHeight: "100dvh", boxShadow: "0 0 40px rgba(0,0,0,0.08)" }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lista" element={<Lista />} />
        <Route path="/spese" element={<Spese />} />
        <Route path="/riepilogo" element={<Riepilogo />} />
        <Route path="/grafici" element={<Grafici />} />
      </Routes>

      {!isHome && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "white", borderTop: "1px solid #eee",
          display: "flex", justifyContent: "space-around",
          padding: "8px 0", zIndex: 100
        }}>
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
      )}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

export default App