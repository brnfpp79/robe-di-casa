import Intestazione from "../components/Intestazione"
import { useState, useEffect, useRef } from "react"
import { db } from "../firebase"
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore"

function Lista() {
  const [articoli, setArticoli] = useState([])
  const [nuovo, setNuovo] = useState("")
  const [pannelloAperto, setPannelloAperto] = useState(false)
  const [menuAperto, setMenuAperto] = useState(null)
  const menuRef = useRef(null)
  const [modificando, setModificando] = useState(null)
  const [nomeModificato, setNomeModificato] = useState("")
  const [prezzo, setPrezzo] = useState("")
  const [link, setLink] = useState("")
  const [prezzoModificato, setPrezzoModificato] = useState("")
  const [linkModificato, setLinkModificato] = useState("")

  useEffect(() => {
    async function carica() {
      const snap = await getDocs(collection(db, "spesa"))
      setArticoli(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    carica()
  }, [])

  async function salvaModifica(id) {
  if (!nomeModificato.trim()) return
  const aggiornamenti = {
    nome: nomeModificato.trim(),
    prezzo: prezzoModificato ? parseFloat(prezzoModificato.replace(",", ".")) : null,
    link: linkModificato.trim() || null,
    dataPrezzo: prezzoModificato ? new Date().toISOString().split("T")[0] : null
  }
  await updateDoc(doc(db, "spesa", id), aggiornamenti)
  setArticoli(articoli.map(a => a.id === id ? { ...a, ...aggiornamenti } : a))
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
  const nuovoArticolo = {
    nome: nuovo.trim(),
    comprato: false,
    prezzo: prezzo ? parseFloat(prezzo.replace(",", ".")) : null,
    link: link.trim() || null,
    dataPrezzo: prezzo ? new Date().toISOString().split("T")[0] : null
  }
  const docRef = await addDoc(collection(db, "spesa"), nuovoArticolo)
  setArticoli([...articoli, { id: docRef.id, ...nuovoArticolo }])
  setNuovo("")
  setPrezzo("")
  setLink("")
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

  function colorePrezzo(dataPrezzo) {
  if (!dataPrezzo) return null
  const giorni = Math.floor((new Date() - new Date(dataPrezzo)) / (1000 * 60 * 60 * 24))
  if (giorni <= 30) return "#2d7a4f"
  if (giorni <= 60) return "#e07b2a"
  return "#e53e3e"
}

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, paddingBottom: 100 }}>
  <Intestazione to="/dashboard"/>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {daComprare.map(a => (
          <li key={a.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #eee", position: "relative" }}>
  
    <span onClick={() => toggleComprato(a)} style={{ flex: 1, padding: "14px 8px", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
      {a.nome.charAt(0).toUpperCase() + a.nome.slice(1)}
      {a.prezzo && (
  <span style={{ fontSize: 13, color: "#999" }}>€ {a.prezzo.toFixed(2)}</span>
)}
{colorePrezzo(a.dataPrezzo) && (
  <span style={{ width: 8, height: 8, borderRadius: "50%", background: colorePrezzo(a.dataPrezzo), flexShrink: 0 }} />
)}
      {a.link && (
        <a href={a.link} target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ fontSize: 16, textDecoration: "none" }}>
          🔗
        </a>
      )}
    </span>
  
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
      <div onClick={() => {
  setModificando(a.id)
  setNomeModificato(a.nome)
  setPrezzoModificato(a.prezzo ? a.prezzo.toString() : "")
  setLinkModificato(a.link || "")
  setMenuAperto(null)
}} style={{ padding: "12px 24px", cursor: "pointer", borderBottom: "1px solid #eee" }}>
  Modifica
</div>
      <div onClick={() => elimina(a.id)}
        style={{ padding: "12px 24px", cursor: "pointer", color: "#e53e3e" }}>
        Elimina
      </div>
    </div>
  )}
</li>
        ))}

        {comprati.length > 0 && (
          <><br></br>
            <li style={{ padding: "12px 8px", fontSize: 16, color: "#999" }}>— 🛒  nel carrello —</li>
            {comprati.map(a => (
              <li key={a.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #eee", opacity: 0.4 }}>
                <span onClick={() => toggleComprato(a)} style={{ flex: 1, padding: "14px 8px", cursor: "pointer", fontSize: 18 }}>
                  {a.nome.charAt(0).toUpperCase() + a.nome.slice(1)}
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


{modificando && (
  <div style={{
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "white", borderTop: "1px solid #eee",
    padding: 16, paddingBottom: 32,
    boxShadow: "0 -4px 12px rgba(0,0,0,0.08)", zIndex: 200
  }}>
    <input
      autoFocus value={nomeModificato}
      onChange={e => setNomeModificato(e.target.value)}
      onKeyDown={e => e.key === "Enter" && salvaModifica(modificando)}
      placeholder="Nome articolo..."
      style={{ width: "100%", padding: 10, fontSize: 16, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box", marginBottom: 8 }}
    />
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <input
        value={prezzoModificato} onChange={e => setPrezzoModificato(e.target.value)}
        placeholder="€ prezzo"
        inputMode="decimal"
        style={{ flex: 1, padding: 10, fontSize: 16, border: "1px solid #ddd", borderRadius: 8 }}
      />
      <input
        value={linkModificato} onChange={e => setLinkModificato(e.target.value)}
        placeholder="Link prodotto..."
        style={{ flex: 2, padding: 10, fontSize: 16, border: "1px solid #ddd", borderRadius: 8 }}
      />
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => setModificando(null)} style={{
        padding: "10px 16px", background: "#f0f0f0", color: "#666",
        border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15
      }}>✕</button>
      <button onClick={() => salvaModifica(modificando)} style={{
        flex: 1, padding: "10px 20px", fontSize: 15,
        background: "#2d7a4f", color: "white",
        border: "none", borderRadius: 8, cursor: "pointer"
      }}>Salva</button>
    </div>
  </div>
)}


     {pannelloAperto && (
  <div style={{
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "white", borderTop: "1px solid #eee",
    padding: 16, paddingBottom: 32,
    boxShadow: "0 -4px 12px rgba(0,0,0,0.08)", zIndex: 200
  }}>
    <input
      autoFocus value={nuovo}
      onChange={e => setNuovo(e.target.value)}
      onKeyDown={e => e.key === "Enter" && aggiungi()}
      placeholder="Nome articolo..."
      style={{ width: "100%", padding: 10, fontSize: 16, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box", marginBottom: 8 }}
    />
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <input
        value={prezzo} onChange={e => setPrezzo(e.target.value)}
        placeholder="€ prezzo"
        inputMode="decimal"
        style={{ flex: 1, padding: 10, fontSize: 16, border: "1px solid #ddd", borderRadius: 8 }}
      />
      <input
        value={link} onChange={e => setLink(e.target.value)}
        placeholder="Link prodotto..."
        style={{ flex: 2, padding: 10, fontSize: 16, border: "1px solid #ddd", borderRadius: 8 }}
      />
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => setPannelloAperto(false)} style={{
        padding: "10px 16px", background: "#f0f0f0", color: "#666",
        border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15
      }}>✕</button>
      <button onClick={aggiungi} style={{
        flex: 1, padding: "10px 20px", fontSize: 15,
        background: "#2d7a4f", color: "white",
        border: "none", borderRadius: 8, cursor: "pointer"
      }}>Aggiungi</button>
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

export default Lista