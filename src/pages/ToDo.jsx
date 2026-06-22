import { useState, useEffect, useRef } from "react"
import { db } from "../firebase"
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, orderBy, query } from "firebase/firestore"
import Intestazione from "../components/Intestazione"

function ToDo() {
  const [tasks, setTasks] = useState([])
  const [nuova, setNuova] = useState("")
  const [pannelloAperto, setPannelloAperto] = useState(false)
  const [menuAperto, setMenuAperto] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    async function carica() {
      const q = query(collection(db, "todo"), orderBy("creata", "desc"))
      const snap = await getDocs(q)
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
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

  async function aggiungi() {
    if (!nuova.trim()) return
    const task = { testo: nuova.trim(), fatta: false, creata: new Date().toISOString() }
    const docRef = await addDoc(collection(db, "todo"), task)
    setTasks([{ id: docRef.id, ...task }, ...tasks])
    setNuova("")
    setPannelloAperto(false)
  }

  async function toggleFatta(task) {
    await updateDoc(doc(db, "todo", task.id), { fatta: !task.fatta })
    setTasks(tasks.map(t => t.id === task.id ? { ...t, fatta: !t.fatta } : t))
  }

  async function elimina(id) {
    await deleteDoc(doc(db, "todo", id))
    setTasks(tasks.filter(t => t.id !== id))
    setMenuAperto(null)
  }

  const daFare = tasks.filter(t => !t.fatta)
  const fatte = tasks.filter(t => t.fatta)

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, paddingBottom: 100 }}>
      <Intestazione titolo="To Do" />

      <ul style={{ listStyle: "none", padding: 0 }}>
        {daFare.map(t => (
          <li key={t.id} style={{
            display: "flex", alignItems: "center",
            borderBottom: "1px solid #eee", padding: "12px 0", gap: 12,
            position: "relative"
          }}>
            <span onClick={() => toggleFatta(t)} style={{
              width: 24, height: 24, borderRadius: "50%",
              border: "2px solid #2d7a4f", cursor: "pointer",
              flexShrink: 0
            }} />
            <span style={{ flex: 1, fontSize: 16 }}>{t.testo}</span>
            <span onClick={() => setMenuAperto(menuAperto === t.id ? null : t.id)}
              style={{ padding: "4px 8px", cursor: "pointer", color: "#999", fontSize: 20 }}>
              ⋯
            </span>
            {menuAperto === t.id && (
              <div ref={menuRef} style={{
                position: "absolute", right: 0, top: 8,
                background: "white", border: "1px solid #eee",
                borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 10, overflow: "hidden"
              }}>
                <div onClick={() => elimina(t.id)}
                  style={{ padding: "12px 24px", cursor: "pointer", color: "#e53e3e" }}>
                  Elimina
                </div>
              </div>
            )}
          </li>
        ))}

        {fatte.length > 0 && (
          <>
            <li style={{ padding: "12px 0", fontSize: 12, color: "#999" }}>— fatte —</li>
            {fatte.map(t => (
              <li key={t.id} style={{
                display: "flex", alignItems: "center",
                borderBottom: "1px solid #eee", padding: "12px 0", gap: 12,
                opacity: 0.4, position: "relative"
              }}>
                <span onClick={() => toggleFatta(t)} style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "#2d7a4f", cursor: "pointer",
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: 14
                }}>✓</span>
                <span style={{ flex: 1, fontSize: 16, textDecoration: "line-through" }}>{t.testo}</span>
                <span onClick={() => setMenuAperto(menuAperto === t.id ? null : t.id)}
                  style={{ padding: "4px 8px", cursor: "pointer", color: "#999", fontSize: 20 }}>
                  ⋯
                </span>
                {menuAperto === t.id && (
                  <div ref={menuRef} style={{
                    position: "absolute", right: 0, top: 8,
                    background: "white", border: "1px solid #eee",
                    borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 10, overflow: "hidden"
                  }}>
                    <div onClick={() => elimina(t.id)}
                      style={{ padding: "12px 24px", cursor: "pointer", color: "#e53e3e" }}>
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
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 600, boxSizing: "border-box",
          background: "white", borderTop: "1px solid #eee",
          padding: 16, paddingBottom: 32,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.08)", zIndex: 200
        }}>
          <input
            autoFocus value={nuova}
            onChange={e => setNuova(e.target.value)}
            onKeyDown={e => e.key === "Enter" && aggiungi()}
            placeholder="Nuova attività..."
            style={{ width: "100%", padding: 12, fontSize: 16, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box", marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPannelloAperto(false)} style={{
              padding: "10px 16px", background: "#f0f0f0", color: "#666",
              border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15
            }}>✕</button>
            <button onClick={aggiungi} style={{
              flex: 1, padding: "10px 20px", background: "#2d7a4f", color: "white",
              border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15
            }}>Aggiungi</button>
          </div>
        </div>
      )}

      <button onClick={() => setPannelloAperto(true)} style={{
        position: "fixed", bottom: 24, right: 24,
        width: 56, height: 56, borderRadius: "50%",
        background: "#2d7a4f", color: "white",
        fontSize: 28, border: "none", cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>+</button>
    </div>
  )
}

export default ToDo