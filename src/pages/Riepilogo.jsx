import Intestazione from "../components/Intestazione"
import { useState, useEffect } from "react"
import { db } from "../firebase"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { calcolaSaldo } from "../utils/calcolaSaldo"

const CATEGORIE = [
  { id: "spesa", label: "Spesa", icon: "🛒" },
  { id: "cene", label: "Cene", icon: "🍽️" },
  { id: "casa", label: "Casa", icon: "🏠" },
  { id: "bollette", label: "Bollette", icon: "💡" },
  { id: "abbonamenti", label: "Abbonamenti", icon: "📱" },
  { id: "scuola", label: "Scuola", icon: "🎒" },
  { id: "richi", label: "Richi", icon: "👦" },
  { id: "varie", label: "Varie", icon: "🌀" },
  { id: "mutuo", label: "Mutuo", icon: "🏦" },
]

function nomeMese(stringa) {
  const [anno, mese] = stringa.split("-")
  const nomi = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
    "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"]
  return `${nomi[parseInt(mese) - 1]} ${anno}`
}

function TotaliMese({ spese }) {
  const totaleGenerale = spese.reduce((sum, s) => sum + s.importo, 0)
  const perCategoria = CATEGORIE.map(cat => ({
    ...cat,
    totale: spese.filter(s => s.categoria === cat.id).reduce((sum, s) => sum + s.importo, 0)
  })).filter(c => c.totale > 0)

  return (
    <div>
      {perCategoria.map(cat => (
        <div key={cat.id} style={{
          display: "flex", alignItems: "center",
          padding: "10px 8px", borderBottom: "1px solid #f0f0f0"
        }}>

          <span style={{ fontSize: 20, marginRight: 12 }}>{cat.icon}</span>
          <span style={{ flex: 1, fontSize: 15 }}>{cat.label}</span>
          <span style={{ fontSize: 15, fontWeight: 500, color: "#2d7a4f" }}>
            € {cat.totale.toFixed(2)}
          </span>
        </div>
      ))}
      <div style={{
        display: "flex", justifyContent: "space-between",
        padding: "14px 8px", marginTop: 4,
        borderTop: "2px solid #2d7a4f"
      }}>
        <span style={{ fontWeight: 600 }}>Totale</span>
        <span style={{ fontWeight: 600, color: "#2d7a4f", fontSize: 16 }}>
          € {totaleGenerale.toFixed(2)}
        </span>
      </div>
    </div>
  )
}

function Riepilogo() {
  const [spese, setSpese] = useState([])
  const [storicoAperto, setStoricoAperto] = useState(null)

  useEffect(() => {
    async function carica() {
      const q = query(collection(db, "spese"), orderBy("data", "desc"))
      const snap = await getDocs(q)
      setSpese(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    carica()
  }, [])

  const meseCorriente = new Date().toISOString().slice(0, 7)

  const speseMeseCorrente = spese.filter(s => s.data.startsWith(meseCorriente))

  const mesiPrecedenti = [...new Set(
    spese
      .filter(s => !s.data.startsWith(meseCorriente))
      .map(s => s.data.slice(0, 7))
  )].sort((a, b) => b.localeCompare(a))

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, paddingBottom: 100 }}>
    <Intestazione to="/dashboard" titolo="Riepilogo" />

{(() => {
  const saldo = calcolaSaldo(spese)
  return (
    <div style={{
      background: saldo ? "#fff8f0" : "#f8fdf9",
      border: `1px solid ${saldo ? "#e07b2a" : "#d4ead9"}`,
      borderRadius: 12, padding: 16, marginBottom: 24,
      display: "flex", alignItems: "center", gap: 12
    }}>
      <span style={{ fontSize: 24 }}>{saldo ? "💸" : "✅"}</span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>
          {saldo ? `${saldo.debitore} deve a ${saldo.creditore}` : "Siete pari!"}
        </div>
        {saldo && (
          <div style={{ fontSize: 20, fontWeight: 700, color: "#e07b2a" }}>
            € {saldo.importo.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  )
})()}


      <div style={{
        background: "#f8fdf9", borderRadius: 12,
        border: "1px solid #d4ead9", padding: 16, marginBottom: 32
      }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, color: "#2d7a4f" }}>
          {nomeMese(meseCorriente)}
        </div>
        {speseMeseCorrente.length === 0
          ? <div style={{ color: "#999", fontSize: 14 }}>Nessuna spesa questo mese</div>
          : <TotaliMese spese={speseMeseCorrente} />
        }
      </div>

      {mesiPrecedenti.length > 0 && (
        <div>
          <div style={{ fontWeight: 500, color: "#999", fontSize: 13, marginBottom: 12, letterSpacing: 1 }}>
            STORICO
          </div>
          {mesiPrecedenti.map(mese => (
            <div key={mese} style={{ marginBottom: 8, border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
              <div
                onClick={() => setStoricoAperto(storicoAperto === mese ? null : mese)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px", cursor: "pointer", background: "white"
                }}
              >
                <span style={{ fontWeight: 500 }}>{nomeMese(mese)}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "#2d7a4f", fontWeight: 600 }}>
                    € {spese.filter(s => s.data.startsWith(mese)).reduce((sum, s) => sum + s.importo, 0).toFixed(2)}
                  </span>
                  <span style={{ color: "#ccc", fontSize: 18 }}>
                    {storicoAperto === mese ? "▲" : "▼"}
                  </span>
                </div>
              </div>
              {storicoAperto === mese && (
                <div style={{ padding: "0 16px 16px", background: "#fafafa" }}>
                  <TotaliMese spese={spese.filter(s => s.data.startsWith(mese))} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Riepilogo