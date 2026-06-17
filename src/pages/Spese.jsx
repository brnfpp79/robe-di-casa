import { useState, useEffect } from "react"
import { db } from "../firebase"
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore"

const CATEGORIE = [
  { id: "spesa", label: "Spesa", icon: "🛒" },
  { id: "cene", label: "Cene", icon: "🍽️" },
  { id: "casa", label: "Casa", icon: "🏠" },
  { id: "bollette", label: "Bollette", icon: "💡" },
  { id: "abbonamenti", label: "Abbonamenti", icon: "📱" },
  { id: "scuola", label: "Scuola", icon: "🎒" },
  { id: "richi", label: "Richi", icon: "👦" },
  { id: "varie", label: "Varie", icon: "🌀" },
]

function Spese() {
  const [spese, setSpese] = useState([])
  const [pannelloAperto, setPannelloAperto] = useState(false)
  const [categoria, setCategoria] = useState("spesa")
  const [importo, setImporto] = useState("")
  const [data, setData] = useState(new Date().toISOString().split("T")[0])
  const [nota, setNota] = useState("")

  useEffect(() => {
    async function carica() {
      const q = query(collection(db, "spese"), orderBy("data", "desc"))
      const snap = await getDocs(q)
      setSpese(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    carica()
  }, [])

  async function aggiungi() {
    if (!importo || isNaN(parseFloat(importo))) return
    const nuova = {
      categoria,
      importo: parseFloat(importo.replace(",", ".")),
      data,
      nota: nota.trim()
    }
    const docRef = await addDoc(collection(db, "spese"), nuova)
    setSpese([{ id: docRef.id, ...nuova }, ...spese])
    setImporto("")
    setNota("")
    setPannelloAperto(false)
  }

  async function elimina(id) {
    await deleteDoc(doc(db, "spese", id))
    setSpese(spese.filter(s => s.id !== id))
  }

  const cat = (id) => CATEGORIE.find(c => c.id === id) || CATEGORIE[0]

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, paddingBottom: 100 }}>
      <h2 style={{ fontWeight: 400, color: "#999", marginBottom: 24 }}>Spese</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {spese.map(s => (
          <li key={s.id} style={{
            display: "flex", alignItems: "center",
            borderBottom: "1px solid #eee", padding: "12px 8px", gap: 12
          }}>
            <span style={{ fontSize: 22 }}>{cat(s.categoria).icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{cat(s.categoria).label}</div>
              <div style={{ fontSize: 12, color: "#999" }}>
                {s.data}{s.nota ? ` · ${s.nota}` : ""}
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#2d7a4f" }}>
              € {s.importo.toFixed(2)}
            </div>
            <span onClick={() => elimina(s.id)} style={{
              fontSize: 18, color: "#ddd", cursor: "pointer", paddingLeft: 8
            }}>×</span>
          </li>
        ))}
      </ul>

      {pannelloAperto && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "white", borderTop: "1px solid #eee",
          padding: 16, boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
          zIndex: 200
        }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {CATEGORIE.map(c => (
              <button key={c.id} onClick={() => setCategoria(c.id)} style={{
                padding: "6px 12px", borderRadius: 20, border: "1px solid",
                borderColor: categoria === c.id ? "#2d7a4f" : "#eee",
                background: categoria === c.id ? "#e8f5ee" : "white",
                color: categoria === c.id ? "#2d7a4f" : "#666",
                cursor: "pointer", fontSize: 13
              }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              style={{ padding: 10, fontSize: 15, border: "1px solid #ddd", borderRadius: 8, flex: 1 }}
            />
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              placeholder="€ importo"
              value={importo}
              onChange={e => setImporto(e.target.value)}
              onKeyDown={e => e.key === "Enter" && aggiungi()}
              style={{ padding: 10, fontSize: 15, border: "1px solid #ddd", borderRadius: 8, flex: 1 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Nota opzionale..."
              value={nota}
              onChange={e => setNota(e.target.value)}
              style={{ padding: 10, fontSize: 15, border: "1px solid #ddd", borderRadius: 8, flex: 1 }}
            />
            <button onClick={aggiungi} style={{
              padding: "10px 20px", fontSize: 15,
              background: "#2d7a4f", color: "white",
              border: "none", borderRadius: 8, cursor: "pointer"
            }}>
              Aggiungi
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setPannelloAperto(!pannelloAperto)} style={{
        position: "fixed", bottom: 80, right: 24,
        width: 56, height: 56, borderRadius: "50%",
        background: "#2d7a4f", color: "white",
        fontSize: 28, border: "none", cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        +
      </button>
    </div>
  )
}

export default Spese