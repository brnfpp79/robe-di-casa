import { useState, useEffect } from "react"
import { db } from "../firebase"
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, orderBy, query } from "firebase/firestore"
import Intestazione from "../components/Intestazione"
import { useWindowSize } from "../hooks/useWindowSize"
import { TimerProvider } from "../context/TimerContext"
import { useTimer } from "../context/TimerContext"

const UNITA = ["g", "kg", "ml", "l", "cucchiaio", "cucchiaino", "tazza", "n°"]

function Ricette() {
  const { isTablet } = useWindowSize()
  const [ricette, setRicette] = useState([])
  const [selezionata, setSelezionata] = useState(null)
  const [modalita, setModalita] = useState("lista") // lista | dettaglio | nuova | modifica

  useEffect(() => {
    async function carica() {
      const q = query(collection(db, "ricette"), orderBy("nome"))
      const snap = await getDocs(q)
      setRicette(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    carica()
  }, [])

  // Su tablet: lista + dettaglio affiancati
  // Su mobile: una vista alla volta
  if (isTablet) {
    return (
      <div style={{ display: "flex", height: "100dvh" }}>
        <div style={{ width: 300, borderRight: "1px solid #eee", overflowY: "auto", flexShrink: 0 }}>
          <ListaRicette
            ricette={ricette}
            selezionata={selezionata}
            onSeleziona={setSelezionata}
            onNuova={() => { setSelezionata(null); setModalita("nuova") }}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {modalita === "nuova" && (
            <FormRicetta
              onSalva={async (dati) => {
                const docRef = await addDoc(collection(db, "ricette"), dati)
                const nuova = { id: docRef.id, ...dati }
                setRicette([...ricette, nuova].sort((a,b) => a.nome.localeCompare(b.nome)))
                setSelezionata(nuova)
                setModalita("dettaglio")
              }}
              onAnnulla={() => setModalita("dettaglio")}
            />
          )}
          {modalita === "modifica" && selezionata && (
            <FormRicetta
              ricetta={selezionata}
              onSalva={async (dati) => {
                await updateDoc(doc(db, "ricette", selezionata.id), dati)
                const aggiornata = { ...selezionata, ...dati }
                setRicette(ricette.map(r => r.id === selezionata.id ? aggiornata : r))
                setSelezionata(aggiornata)
                setModalita("dettaglio")
              }}
              onAnnulla={() => setModalita("dettaglio")}
            />
          )}
          {(modalita === "dettaglio" || modalita === "lista") && selezionata && (
            <DettaglioRicetta
              ricetta={selezionata}
              onModifica={() => setModalita("modifica")}
              onElimina={async () => {
                await deleteDoc(doc(db, "ricette", selezionata.id))
                setRicette(ricette.filter(r => r.id !== selezionata.id))
                setSelezionata(null)
                setModalita("lista")
              }}
            />
          )}
          {!selezionata && modalita !== "nuova" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#ccc", fontSize: 16 }}>
              Seleziona una ricetta
            </div>
          )}
        </div>
      </div>
    )
  }

  // Mobile: una vista alla volta
  if (modalita === "nuova") return (
    <FormRicetta
      onSalva={async (dati) => {
        const docRef = await addDoc(collection(db, "ricette"), dati)
        const nuova = { id: docRef.id, ...dati }
        setRicette([...ricette, nuova].sort((a,b) => a.nome.localeCompare(b.nome)))
        setSelezionata(nuova)
        setModalita("dettaglio")
      }}
      onAnnulla={() => setModalita("lista")}
    />
  )

  if (modalita === "modifica" && selezionata) return (
    <FormRicetta
      ricetta={selezionata}
      onSalva={async (dati) => {
        await updateDoc(doc(db, "ricette", selezionata.id), dati)
        const aggiornata = { ...selezionata, ...dati }
        setRicette(ricette.map(r => r.id === selezionata.id ? aggiornata : r))
        setSelezionata(aggiornata)
        setModalita("dettaglio")
      }}
      onAnnulla={() => setModalita("dettaglio")}
    />
  )

  if (modalita === "dettaglio" && selezionata) return (
    <DettaglioRicetta
      ricetta={selezionata}
      onModifica={() => setModalita("modifica")}
      onTorna={() => setModalita("lista")}
      onElimina={async () => {
        await deleteDoc(doc(db, "ricette", selezionata.id))
        setRicette(ricette.filter(r => r.id !== selezionata.id))
        setSelezionata(null)
        setModalita("lista")
      }}
    />
  )

  return (
    <ListaRicette
      ricette={ricette}
      selezionata={selezionata}
      onSeleziona={(r) => { setSelezionata(r); setModalita("dettaglio") }}
      onNuova={() => setModalita("nuova")}
      mostraIntestazione={true}
    />
  )
}

// ── LISTA RICETTE ─────────────────────────────────────────────
function ListaRicette({ ricette, selezionata, onSeleziona, onNuova, mostraIntestazione }) {
  return (
    <div style={{ padding: 24, paddingBottom: 100 }}>
      {mostraIntestazione && <Intestazione />}
      <div style={{ fontWeight: 400, color: "#999", marginBottom: 24, fontSize: 20 }}>Ricette</div>
      {ricette.length === 0 && (
        <div style={{ color: "#ccc", fontSize: 14 }}>Nessuna ricetta ancora</div>
      )}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {ricette.map(r => (
          <li key={r.id} onClick={() => onSeleziona(r)} style={{
            padding: "14px 8px", borderBottom: "1px solid #eee",
            cursor: "pointer", fontSize: 16,
            background: selezionata?.id === r.id ? "#e8f5ee" : "white",
            borderRadius: selezionata?.id === r.id ? 8 : 0
          }}>
            {r.nome}
            <div style={{ fontSize: 12, color: "#a7a2a2", marginTop: 2 }}>
              {r.porzioni} porzioni · {r.ingredienti?.length || 0} ingredienti
            </div>
          </li>
        ))}
      </ul>
      <button onClick={onNuova} style={{
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

// ── DETTAGLIO RICETTA ─────────────────────────────────────────
function DettaglioRicetta({ ricetta, onModifica, onElimina, onTorna }) {
  const { timers, startTimer, resetTimer } = useTimer()
  const [passoAttivo, setPassoAttivo] = useState(0)

  function formatTimer(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24, paddingBottom: 100 }}>
      {onTorna && <Intestazione />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 600 }}>{ricetta.nome}</h2>
          <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>{ricetta.porzioni} porzioni</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onModifica} style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid #2d7a4f",
            color: "#2d7a4f", background: "white", cursor: "pointer", fontSize: 14
          }}>Modifica</button>
          <button onClick={onElimina} style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            color: "#e53e3e", background: "#fff0f0", cursor: "pointer", fontSize: 14
          }}>Elimina</button>
        </div>
      </div>

      <ul style={{ listStyle: "none", padding: 0, marginBottom: 32 }}>
        {ricetta.ingredienti?.map((ing, i) => (
          <li key={i} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 15, display: "flex" }}>
            <span style={{ width: 80, flexShrink: 0, color: "#bdbcbc" }}>{ing.quantita} {ing.unita}</span>
            <span>{ing.nome}</span>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>Procedimento</div>
        {passoAttivo > 0 && (
          <button onClick={() => setPassoAttivo(0)} style={{
            padding: "6px 14px", borderRadius: 20, border: "none",
            background: "#f0f0f0", color: "#666", cursor: "pointer", fontSize: 13
          }}>↺ Ricomincia</button>
        )}
      </div>

      {ricetta.passi?.map((passo, i) => {
        const key = `${ricetta.id}_${i}`
        const t = timers[key]

        return (
          <div key={i} onClick={() => i === passoAttivo && setPassoAttivo(i + 1)} style={{
            marginBottom: 16, padding: 16,
            background: i < passoAttivo ? "#969494" : i === passoAttivo ? "#fff9e6" : "#fafafa",
            border: `2px solid ${i < passoAttivo ? "#2d7a4f" : i === passoAttivo ? "#ce7126" : "#eee"}`,
            opacity: i > passoAttivo ? 0.4 : 1,
            cursor: i === passoAttivo ? "pointer" : "default",
            transition: "all 0.2s",
            borderRadius: 12
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{
                width: 28, height: 28, borderRadius: "50%",
                background: i < passoAttivo ? "#2d7a4f" : i === passoAttivo ? "#2d7a4f" : "#ddd",
                color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 600, flexShrink: 0
              }}>{i < passoAttivo ? "✓" : i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 15, lineHeight: 1.5, color: "#222", fontWeight: 500 }}>
                    {passo.testo}
                  </div>
                  {passo.timer > 0 && (
                    <div style={{ flexShrink: 0 }}>
                      {!t ? (
                        <button onClick={(e) => {
                          e.stopPropagation()
                          startTimer(key, passo.timer * 60, ricetta.nome, i, `Passo ${i + 1}`)
                        }} style={{
                          padding: "6px 10px", borderRadius: 20, border: "none",
                          background: "#2d7a4f", color: "white", cursor: "pointer", fontSize: 12
                        }}>⏱ {passo.timer}m</button>
                      ) : t.finito ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: "#e53e3e", fontWeight: 600, fontSize: 13 }}>⏰ Scaduto!</span>
                          <button onClick={(e) => { e.stopPropagation(); resetTimer(key) }} style={{
                            background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 16
                          }}>×</button>
                        </div>
                      ) : (
                        <div style={{ color: "#2d7a4f", fontWeight: 600, fontSize: 16 }}>
                          ⏱ {formatTimer(t.secondi)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {passo.foto && (
                  <img src={passo.foto} alt={`passo ${i + 1}`} style={{
                    width: "100%", borderRadius: 8, marginTop: 12, maxHeight: 300, objectFit: "cover"
                  }} />
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── FORM NUOVA/MODIFICA RICETTA ───────────────────────────────
function FormRicetta({ ricetta, onSalva, onAnnulla }) {
  const [nome, setNome] = useState(ricetta?.nome || "")
  const [porzioni, setPorzioni] = useState(ricetta?.porzioni || 4)
  const [ingredienti, setIngredienti] = useState(ricetta?.ingredienti || [])
  const [passi, setPassi] = useState(ricetta?.passi || [])

  function aggiungiIngrediente() {
    setIngredienti([...ingredienti, { quantita: "", unita: "g", nome: "" }])
  }

  function aggiungiPasso() {
    setPassi([...passi, { testo: "", timer: 0, foto: null }])
  }

  function aggiornaIngrediente(i, campo, valore) {
    setIngredienti(ingredienti.map((ing, idx) => idx === i ? { ...ing, [campo]: valore } : ing))
  }

  function aggiornaPasso(i, campo, valore) {
    setPassi(passi.map((p, idx) => idx === i ? { ...p, [campo]: valore } : p))
  }

  function rimuoviIngrediente(i) {
    setIngredienti(ingredienti.filter((_, idx) => idx !== i))
  }

  function rimuoviPasso(i) {
    setPassi(passi.filter((_, idx) => idx !== i))
  }

  async function caricaFoto(i, file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const max = 800
        const ratio = Math.min(max / img.width, max / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height)
        aggiornaPasso(i, "foto", canvas.toDataURL("image/jpeg", 0.7))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  function salva() {
    if (!nome.trim()) return
    onSalva({
      nome: nome.trim(),
      porzioni: parseInt(porzioni),
      ingredienti: ingredienti.filter(ing => ing.nome.trim()),
      passi: passi.filter(p => p.testo.trim())
    })
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24, paddingBottom: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontWeight: 500, color: "#999" }}>
          {ricetta ? "Modifica ricetta" : "Nuova ricetta"}
        </h2>
        <button onClick={onAnnulla} style={{
          background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 22
        }}>✕</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Nome ricetta"
          style={{ width: "100%", padding: 12, fontSize: 18, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: "#666" }}>Porzioni:</span>
        <button onClick={() => setPorzioni(Math.max(1, porzioni - 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: 18 }}>−</button>
        <span style={{ fontWeight: 600, fontSize: 18 }}>{porzioni}</span>
        <button onClick={() => setPorzioni(porzioni + 1)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: 18 }}>+</button>
      </div>

      <div style={{ fontWeight: 600, marginBottom: 12 }}>Ingredienti</div>
      {ingredienti.map((ing, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <input value={ing.quantita} onChange={e => aggiornaIngrediente(i, "quantita", e.target.value)}
            placeholder="Qtà" inputMode="decimal"
            style={{ width: 60, padding: 8, border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}
          />
          <select value={ing.unita} onChange={e => aggiornaIngrediente(i, "unita", e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}>
            {UNITA.map(u => <option key={u}>{u}</option>)}
          </select>
          <input value={ing.nome} onChange={e => aggiornaIngrediente(i, "nome", e.target.value)}
            placeholder="Ingrediente"
            style={{ flex: 1, padding: 8, border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}
          />
          <button onClick={() => rimuoviIngrediente(i)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
      ))}
      <button onClick={aggiungiIngrediente} style={{
        padding: "8px 16px", borderRadius: 8, border: "1px dashed #ccc",
        background: "white", color: "#666", cursor: "pointer", fontSize: 14, marginBottom: 24
      }}>+ Ingrediente</button>

      <div style={{ fontWeight: 600, marginBottom: 12 }}>Procedimento</div>
      {passi.map((passo, i) => (
        <div key={i} style={{ marginBottom: 16, padding: 16, background: "#fafafa", borderRadius: 12, border: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: "#2d7a4f" }}>Passo {i + 1}</span>
            <button onClick={() => rimuoviPasso(i)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
          <textarea value={passo.testo} onChange={e => aggiornaPasso(i, "testo", e.target.value)}
            placeholder="Descrivi il passo..."
            style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 8, fontSize: 14, minHeight: 80, resize: "vertical", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#666" }}>⏱ Timer (min):</span>
            <input type="number" value={passo.timer || ""} onChange={e => aggiornaPasso(i, "timer", parseInt(e.target.value) || 0)}
              placeholder="0"
              style={{ width: 60, padding: 6, border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}
            />
            <label style={{ marginLeft: 8, padding: "6px 12px", borderRadius: 8, background: "#e8f5ee", color: "#2d7a4f", cursor: "pointer", fontSize: 13 }}>
              📷 Foto
              <input type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => e.target.files[0] && caricaFoto(i, e.target.files[0])} />
            </label>
            {passo.foto && <span style={{ fontSize: 12, color: "#2d7a4f" }}>✓ foto aggiunta</span>}
          </div>
        </div>
      ))}
      <button onClick={aggiungiPasso} style={{
        padding: "8px 16px", borderRadius: 8, border: "1px dashed #ccc",
        background: "white", color: "#666", cursor: "pointer", fontSize: 14, marginBottom: 32
      }}>+ Passo</button>

      <button onClick={salva} style={{
        position: "fixed", bottom: 24, right: 24,
        padding: "14px 28px", borderRadius: 12,
        background: "#2d7a4f", color: "white",
        border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
      }}>
        {ricetta ? "Salva modifiche" : "Crea ricetta"}
      </button>
    </div>
  )
}

export default Ricette