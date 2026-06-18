import { useState, useEffect, useRef } from "react"
import { db } from "../firebase"
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, orderBy, query } from "firebase/firestore"

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

function nomeMese(data) {
  const [anno, mese] = data.split("-")
  const nomi = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
    "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"]
  return `${nomi[parseInt(mese) - 1]} ${anno}`
}

function Pannello({ titolo, spesa, onSalva, onChiudi }) {
  const [categoria, setCategoria] = useState(spesa?.categoria || "spesa")
  const [importo, setImporto] = useState(spesa?.importo?.toString() || "")
  const [data, setData] = useState(spesa?.data || new Date().toISOString().split("T")[0])
  const [nota, setNota] = useState(spesa?.nota || "")

  function salva() {
    if (!importo || isNaN(parseFloat(importo))) return
    onSalva({ categoria, importo: parseFloat(importo.replace(",", ".")), data, nota: nota.trim() })
  }

  return (
    <div style={{
  position: "fixed", bottom: 0,
  left: "50%", transform: "translateX(-50%)",
  width: "100%", maxWidth: 390,
  background: "white", borderTop: "1px solid #eee",
  padding: 16, paddingBottom: 80,
  boxShadow: "0 -4px 12px rgba(0,0,0,0.08)", zIndex: 200
}}>
      <div style={{ fontWeight: 500, marginBottom: 12, color: "#666" }}>{titolo}</div>
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
          type="date" value={data}
          onChange={e => setData(e.target.value)}
          style={{ padding: 10, fontSize: 15, border: "1px solid #ddd", borderRadius: 8, flex: 1 }}
        />
        <input
          autoFocus type="text" inputMode="decimal"
          placeholder="€ importo" value={importo}
          onChange={e => setImporto(e.target.value)}
          onKeyDown={e => e.key === "Enter" && salva()}
          style={{ padding: 10, fontSize: 15, border: "1px solid #ddd", borderRadius: 8, flex: 1 }}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text" placeholder="Nota opzionale..." value={nota}
          onChange={e => setNota(e.target.value)}
          style={{ padding: 10, fontSize: 15, border: "1px solid #ddd", borderRadius: 8, flex: 1 }}
        />
        <button onClick={onChiudi} style={{
          padding: "10px 16px", fontSize: 15, background: "#f0f0f0",
          color: "#666", border: "none", borderRadius: 8, cursor: "pointer"
        }}>
          ✕
        </button>
        <button onClick={salva} style={{
          padding: "10px 20px", fontSize: 15, background: "#2d7a4f",
          color: "white", border: "none", borderRadius: 8, cursor: "pointer"
        }}>
          {spesa ? "Salva" : "Aggiungi"}
        </button>
      </div>
    </div>
  )
}

function Spese() {
  const [spese, setSpese] = useState([])
  const [pannelloAperto, setPannelloAperto] = useState(false)
  const [modificando, setModificando] = useState(null)
  const [menuAperto, setMenuAperto] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    async function carica() {
      const q = query(collection(db, "spese"), orderBy("data", "desc"))
      const snap = await getDocs(q)
      setSpese(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    carica()
  }, [])

  useEffect(() => {
    function chiudiMenu(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAperto(null)
    }
    document.addEventListener("mousedown", chiudiMenu)
    return () => document.removeEventListener("mousedown", chiudiMenu)
  }, [])

  async function aggiungi(dati) {
    const docRef = await addDoc(collection(db, "spese"), dati)
    setSpese([{ id: docRef.id, ...dati }, ...spese])
    setPannelloAperto(false)
  }

  async function salvaModifica(dati) {
    await updateDoc(doc(db, "spese", modificando.id), dati)
    setSpese(spese.map(s => s.id === modificando.id ? { ...s, ...dati } : s))
    setModificando(null)
  }

  async function elimina(id) {
    await deleteDoc(doc(db, "spese", id))
    setSpese(spese.filter(s => s.id !== id))
    setMenuAperto(null)
  }

  const cat = (id) => CATEGORIE.find(c => c.id === id) || CATEGORIE[0]

  const mesiOrdinati = [...new Set(spese.map(s => s.data.slice(0, 7)))].sort((a, b) => b.localeCompare(a))
  const [mesiAperti, setMesiAperti] = useState([])

useEffect(() => {
  if (mesiOrdinati.length > 0 && mesiAperti.length === 0) {
    setMesiAperti([mesiOrdinati[0]])
  }
}, [spese])

  function toggleMese(mese) {
    setMesiAperti(prev =>
      prev.includes(mese) ? prev.filter(m => m !== mese) : [...prev, mese]
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, paddingBottom: 100 }}>
      
      {mesiOrdinati.map(mese => (
        <div key={mese} style={{ marginBottom: 8, border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
          <div
            onClick={() => toggleMese(mese)}
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
                {mesiAperti.includes(mese) ? "▲" : "▼"}
              </span>
            </div>
          </div>

          {mesiAperti.includes(mese) && (
            <div style={{ background: "#fafafa" }}>
              <ul style={{ listStyle: "none", padding: "0 16px", margin: 0 }}>
                {spese.filter(s => s.data.startsWith(mese)).map(s => (
                  <li key={s.id} style={{
                    display: "flex", alignItems: "center",
                    borderBottom: "1px solid #eee", padding: "12px 0", gap: 12,
                    position: "relative"
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
                    <span onClick={(e) => { e.stopPropagation(); setMenuAperto(menuAperto === s.id ? null : s.id) }}
                      style={{ padding: "4px 8px", cursor: "pointer", color: "#999", fontSize: 20 }}>
                      ⋯
                    </span>
                    {menuAperto === s.id && (
                      <div ref={menuRef} style={{
                        position: "absolute", right: 0, top: 8,
                        background: "white", border: "1px solid #eee",
                        borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        zIndex: 10, overflow: "hidden"
                      }}>
                        <div onClick={() => { setModificando(s); setMenuAperto(null) }}
                          style={{ padding: "12px 24px", cursor: "pointer", borderBottom: "1px solid #eee" }}>
                          Modifica
                        </div>
                        <div onClick={() => elimina(s.id)}
                          style={{ padding: "12px 24px", cursor: "pointer", color: "#e53e3e" }}>
                          Elimina
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      {pannelloAperto && (
        <Pannello titolo="Nuova spesa" onSalva={aggiungi} onChiudi={() => setPannelloAperto(false)} />
      )}

      {modificando && (
        <Pannello titolo="Modifica spesa" spesa={modificando} onSalva={salvaModifica} onChiudi={() => setModificando(null)} />
      )}

      <button onClick={() => setPannelloAperto(true)} style={{
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