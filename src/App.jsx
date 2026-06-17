import { useState, useEffect, useRef } from "react"
import { db } from "./firebase"
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore"

function App() {
  const [articoli, setArticoli] = useState([])
  const [nuovo, setNuovo] = useState("")
  const [pannelloAperto, setPannelloAperto] = useState(false)
  const [menuAperto, setMenuAperto] = useState(null)
  const menuRef = useRef(null)
  const [modificando, setModificando] = useState(null)
  const [nomeModificato, setNomeModificato] = useState("")

  useEffect(() => {
    async function carica() {
      const snap = await getDocs(collection(db, "spesa"))
      setArticoli(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    carica()
  }, [])

  async function rinomina(id) {
  if (!nomeModificato.trim()) return
  await updateDoc(doc(db, "spesa", id), { nome: nomeModificato.trim() })
  setArticoli(articoli.map(a => a.id === id ? { ...a, nome: nomeModificato.trim() } : a))
  setModificando(null)
  setMenuAperto(null)
}

  useEffect(() => {
    function chiudiMenu(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAperto(null)
      }
    }
    document.addEventListener("mousedown", chiudiMenu)
    return () => document.removeEventListener("mousedown", chiudiMenu)
  }, [])

  async function aggiungi() {
    if (!nuovo.trim()) return
    const docRef = await addDoc(collection(db, "spesa"), {
      nome: nuovo.trim(),
      comprato: false
    })
    setArticoli([...articoli, { id: docRef.id, nome: nuovo.trim(), comprato: false }])
    setNuovo("")
    setPannelloAperto(false)
  }

  async function toggleComprato(articolo) {
    await updateDoc(doc(db, "spesa", articolo.id), { comprato: !articolo.comprato })
    setArticoli(articoli.map(a => a.id === articolo.id ? { ...a, comprato: !a.comprato } : a))
  }

  async function elimina(id) {
    await deleteDoc(doc(db, "spesa", id))
    setArticoli(articoli.filter(a => a.id !== id))
    setMenuAperto(null)
  }

  const daComprare = articoli.filter(a => !a.comprato)
  const comprati = articoli.filter(a => a.comprato)

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, paddingBottom: 100 }}>
      <h2 style={{ fontWeight: 400, color: "#999", marginBottom: 24 }}>Lista della spesa</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {daComprare.map(a => (
          <li key={a.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #eee" }}>
            {modificando === a.id ? (
              <input
                autoFocus
                value={nomeModificato}
                onChange={e => setNomeModificato(e.target.value)}
                onKeyDown={e => e.key === "Enter" && rinomina(a.id)}
                onBlur={() => rinomina(a.id)}
                style={{ flex: 1, padding: "14px 8px", fontSize: 18, border: "none", outline: "none" }}
              />
            ) : (
              <span onClick={() => toggleComprato(a)} style={{ flex: 1, padding: "14px 8px", cursor: "pointer", fontSize: 18 }}>
                {a.nome}
              </span>
            )}
            <span onClick={() => setMenuAperto(menuAperto === a.id ? null : a.id)}
              style={{ padding: "14px 12px", cursor: "pointer", color: "#999", fontSize: 20 }}>
              ⋯
            </span>
            {menuAperto === a.id && (
              <div ref={menuRef} style={{
                position: "absolute", right: 24,
                background: "white", border: "1px solid #eee",
                borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 10, overflow: "hidden"
              }}>
                <div onClick={() => { setModificando(a.id); setNomeModificato(a.nome); setMenuAperto(null) }} style={{ padding: "12px 24px", cursor: "pointer", borderBottom: "1px solid #eee" }}>
                  Modifica
                </div>
                <div onClick={() => elimina(a.id)} style={{ padding: "12px 24px", cursor: "pointer", color: "#e53e3e" }}>
                  Elimina
                </div>
              </div>
            )}
          </li>
        ))}

        {comprati.length > 0 && (
          <>
            <li style={{ padding: "12px 8px", fontSize: 12, color: "#999" }}>— nel carrello —</li>
            {comprati.map(a => (
              <li key={a.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #eee", opacity: 0.4 }}>
                <span onClick={() => toggleComprato(a)} style={{ flex: 1, padding: "14px 8px", cursor: "pointer", fontSize: 18, textDecoration: "line-through" }}>
                  {a.nome}
                </span>
                <span onClick={() => setMenuAperto(menuAperto === a.id ? null : a.id)}
                  style={{ padding: "14px 12px", cursor: "pointer", fontSize: 20 }}>
                  ⋯
                </span>
                {menuAperto === a.id && (
                  <div ref={menuRef} style={{
                    position: "absolute", right: 24,
                    background: "white", border: "1px solid #eee",
                    borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 10, overflow: "hidden"
                  }}>
                    <div onClick={() => { setModificando(a.id); setNomeModificato(a.nome); setMenuAperto(null) }} style={{ padding: "12px 24px", cursor: "pointer", borderBottom: "1px solid #eee" }}>
                      Modifica
                    </div>
                    <div onClick={() => elimina(a.id)} style={{ padding: "12px 24px", cursor: "pointer", color: "#e53e3e" }}>
                      Elimina
                    </div>
                  </div>
                )}
              </li>
            ))}
          </>
        )}
      </ul>

      {pannelloAperto && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "white", borderTop: "1px solid #eee",
          padding: 16, display: "flex", gap: 8,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.08)"
        }}>
          <input
            autoFocus
            value={nuovo}
            onChange={e => setNuovo(e.target.value)}
            onKeyDown={e => e.key === "Enter" && aggiungi()}
            placeholder="Aggiungi articolo..."
            style={{ flex: 1, padding: 10, fontSize: 16, border: "1px solid #ddd", borderRadius: 8 }}
          />
          <button onClick={aggiungi} style={{
            padding: "10px 20px", fontSize: 16,
            background: "#2d7a4f", color: "white",
            border: "none", borderRadius: 8, cursor: "pointer"
          }}>
            Aggiungi
          </button>
        </div>
      )}

      <button onClick={() => setPannelloAperto(!pannelloAperto)} style={{
        position: "fixed", bottom: 24, right: 24,
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

export default App