import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState, useEffect } from "react"
import { auth } from "./firebase"
import { onAuthStateChanged, getRedirectResult, signOut } from "firebase/auth"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Lista from "./pages/Lista"
import Spese from "./pages/Spese"
import Riepilogo from "./pages/Riepilogo"
import Grafici from "./pages/Grafici"
import ToDo from "./pages/ToDo"
import Ricette from "./pages/Ricette"
import { useUserProfile } from "./hooks/useUserProfile";
import Home from "./pages/Home"
import Placeholder from "./pages/Placeholder"
import Giochi from "./pages/Giochi"
import Compiti from "./pages/Compiti"
import Risparmi from "./pages/Risparmi"
import Attivita from "./pages/Attivita"
import { seedNutri } from "./seed/seedFirestore";
import Nutrizione from "./pages/Nutrizione";

function Layout() {
  const [utente, setUtente] = useState(undefined)
  const EMAIL_AUTORIZZATE = ["brnfpp@gmail.com", "shangdiai@gmail.com", "fg.brancato@gmail.com", "riccardogionathan.brancato@gmail.com"]
 
 
  {/* controlle email */}
useEffect(() => {
  return onAuthStateChanged(auth, (u) => {
    if (u && !EMAIL_AUTORIZZATE.includes(u.email)) {
      signOut(auth)
      setUtente(null)
    } else {
      setUtente(u)
    }
  })
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
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/risparmi" element={<Risparmi />} />
      <Route path="/lista" element={<Lista />} />
      <Route path="/spese" element={<Spese />} />
      <Route path="/riepilogo" element={<Riepilogo />} />
      <Route path="/grafici" element={<Grafici />} />
      <Route path="/todo" element={<ToDo />} />
      <Route path="/ricette" element={<Ricette />} />
      <Route path="/ricette/:id" element={<Ricette />} />
      <Route path="/giochi" element={<Giochi />} />
      <Route path="/compiti" element={<Compiti />} />
      <Route path="/attivita" element={<Attivita />} />
      <Route path="/nutrizione" element={<Nutrizione />} />
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