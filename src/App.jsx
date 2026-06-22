import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState, useEffect } from "react"
import { auth } from "./firebase"
import { onAuthStateChanged, getRedirectResult } from "firebase/auth"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Lista from "./pages/Lista"
import Spese from "./pages/Spese"
import Riepilogo from "./pages/Riepilogo"
import Grafici from "./pages/Grafici"
import ToDo from "./pages/ToDo"

function Layout() {
  const [utente, setUtente] = useState(undefined)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUtente(u))
  }, [])

  useEffect(() => {
    async function controllaRedirect() {
      try {
        await getRedirectResult(auth)
      } catch (error) {
        console.error("Errore redirect:", error)
      }
    }
    controllaRedirect()
  }, [])

  if (utente === undefined) return null
  if (!utente) return <Login />

  return (
  <div style={{ minHeight: "100dvh" }}>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/lista" element={<Lista />} />
      <Route path="/spese" element={<Spese />} />
      <Route path="/riepilogo" element={<Riepilogo />} />
      <Route path="/grafici" element={<Grafici />} />
      <Route path="/todo" element={<ToDo />} />
    </Routes>
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