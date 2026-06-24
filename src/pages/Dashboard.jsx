import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { db, auth } from "../firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { useWindowSize } from "../hooks/useWindowSize"
import { useTimer } from "../context/TimerContext"

function Dashboard() {
  const navigate = useNavigate()
  const { isTablet } = useWindowSize()
  const [articoliDaComprare, setArticoliDaComprare] = useState(0)
  const [totaleSpeseMese, setTotaleSpeseMese] = useState(0)
  const [todoInSospeso, setTodoInSospeso] = useState(0)
const { timers } = useTimer()

function formatTimer(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, "0")}`
}

const timersVisibili = Object.entries(timers).filter(([, t]) => t.attivo || t.finito)


  useEffect(() => {
    async function caricaDati() {
      // Articoli da comprare
      const snapLista = await getDocs(collection(db, "spesa"))
      const daComprare = snapLista.docs.filter(d => !d.data().comprato).length
      setArticoliDaComprare(daComprare)

      // Totale spese mese corrente
      const meseCorrente = new Date().toISOString().slice(0, 7)
      const snapSpese = await getDocs(query(collection(db, "spese"), orderBy("data", "desc")))
      const totale = snapSpese.docs
        .filter(d => d.data().data.startsWith(meseCorrente))
        .reduce((sum, d) => sum + d.data().importo, 0)
      setTotaleSpeseMese(totale)

      const snapTodo = await getDocs(collection(db, "todo"))
        const inSospeso = snapTodo.docs.filter(d => !d.data().fatta).length
        setTodoInSospeso(inSospeso)

    }
    caricaDati()
  }, [])

  const sezioni = [
    { path: "/lista", icon: "🛒", label: "Lista spesa", valore: `${articoliDaComprare} da comprare` },
    { path: "/spese", icon: "💳", label: "Spese", valore: `€ ${totaleSpeseMese.toFixed(2)} questo mese` },
    { path: "/riepilogo", icon: "📊", label: "Riepilogo", valore: "" },
    { path: "/grafici", icon: "📈", label: "Grafici", valore: "" },
    { path: "/todo", icon: "✅", label: "To Do", valore: todoInSospeso > 0 ? `${todoInSospeso} in sospeso` : "tutto fatto" },
    { path: "/ricette", icon: "👨‍🍳", label: "Ricette", valore: timersVisibili.length > 0 ? `⏱ ${timersVisibili.length} timer attivi` : ""  },
  ]

  return (
    <div style={{
      width: "100%", height: "100dvh",
      backgroundImage: "url('/famiglia.jpg')",
      backgroundSize: "cover", backgroundPosition: "center center",
      position: "relative"
    }}>
      {/* Sfondo sfocato */}
      <div style={{
        position: "absolute", inset: 0,
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(0,0,0,0.35)"
      }} />

      {/* Contenuto */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 700, margin: "0 auto",
        padding: 24, paddingTop: 60,
        display: "flex", flexDirection: "column", gap: 24,
        minHeight: "100dvh", boxSizing: "border-box"
      }}>

        {/* Intestazione */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "white", fontSize: 22, fontWeight: 600 }}>
            Robe di casa
          </div>

          <button onClick={() => signOut(auth)} style={{
            background: "rgba(255,255,255,0.2)", border: "none",
            color: "white", padding: "6px 14px", borderRadius: 20,
            cursor: "pointer", fontSize: 13
          }}>
            Esci
          </button>
        </div>

        {/* Griglia sezioni */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isTablet ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
          gap: 16
        }}>
          {sezioni.map(s => (
            <div key={s.path} onClick={() => navigate(s.path)} style={{
              background: "rgba(255,255,255,0.85)",
              borderRadius: 16, padding: 20,
              cursor: "pointer",
              display: "flex", flexDirection: "column", gap: 8,
              backdropFilter: "blur(4px)",
              transition: "transform 0.1s",
            }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"}
              onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <span style={{ fontSize: 32 }}>{s.icon}</span>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{s.label}</div>
              {s.valore && <div style={{ fontSize: 13, color: "#2d7a4f", fontWeight: 500 }}>{s.valore}</div>}
            </div>
          ))}
        </div>

        {/* Sezione avvisi — per ora vuota, pronta per To Do e Calendario */}
        <div style={{
  background: "rgba(255,255,255,0.85)",
  borderRadius: 16, padding: 20,
  backdropFilter: "blur(4px)"
}}>
  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Avvisi</div>
  {timersVisibili.length === 0 ? (
    <div style={{ fontSize: 13, color: "#999" }}>Nessun avviso per oggi</div>
  ) : (
    timersVisibili.map(([key, t]) => (
      <div key={key} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 0", borderBottom: "1px solid #f0f0f0"
      }}>
        <div>
          <span style={{ fontWeight: 500 }}>{t.ricettaNome}</span>
          <span style={{ color: "#999", fontSize: 13 }}> · {t.passoLabel}</span>
        </div>
        {t.finito ? (
          <span style={{ color: "#e53e3e", fontWeight: 600, fontSize: 13 }}>⏰ Scaduto!</span>
        ) : (
          <span style={{ color: "#e07b2a", fontWeight: 600 }}>{formatTimer(t.secondi)}</span>
        )}
      </div>
    ))
  )}
</div>

{/* Versione dell'App */}
          <div style={{ color:"#adadad" , fontSize: 12, fontWeight: 600 }}>
            (ver 0.37)
          </div>

      </div>
    </div>
  )
}

export default Dashboard