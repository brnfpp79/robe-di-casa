import { useState, useEffect, useRef } from "react"
import { db } from "../firebase"
// Importiamo le funzioni di Firestore che ci servono:
// collection = riferimento a una collezione nel db
// addDoc = aggiunge un documento
// getDocs = legge tutti i documenti
// deleteDoc = elimina un documento
// updateDoc = modifica un documento esistente
// doc = riferimento a un documento specifico
// orderBy, query = per ordinare i risultati
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, orderBy, query } from "firebase/firestore"

// Lista fissa delle categorie disponibili.
// Ogni categoria ha: id (salvato nel db), label (nome visibile), icon (emoji)
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

// Funzione di utilità: converte "2025-06" in "Giugno 2025"
function nomeMese(data) {
  const [anno, mese] = data.split("-")
  const nomi = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
    "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"]
  return `${nomi[parseInt(mese) - 1]} ${anno}`
}

// Componente Pannello: il cassetto che si apre dal basso per aggiungere o modificare una spesa.
// Riceve:
//   titolo = "Nuova spesa" o "Modifica spesa"
//   spesa = la spesa da modificare (undefined se è nuova)
//   onSalva = funzione da chiamare quando si clicca Aggiungi/Salva
//   onChiudi = funzione da chiamare quando si clicca ✕
function Pannello({ titolo, spesa, onSalva, onChiudi }) {
  // Stato locale del pannello: i campi del form
  // Se stiamo modificando una spesa esistente, partiamo dai suoi valori
  const [categoria, setCategoria] = useState(spesa?.categoria || "spesa")
  const [importo, setImporto] = useState(spesa?.importo?.toString() || "")
  const [data, setData] = useState(spesa?.data || new Date().toISOString().split("T")[0])
  const [nota, setNota] = useState(spesa?.nota || "")

  // Funzione chiamata quando si clicca Aggiungi/Salva
  function salva() {
    // Non fare niente se l'importo è vuoto o non è un numero
    if (!importo || isNaN(parseFloat(importo))) return
    // Chiama la funzione esterna passando i dati del form
    // replace(",", ".") permette di scrivere sia 1,50 che 1.50
    onSalva({ categoria, importo: parseFloat(importo.replace(",", ".")), data, nota: nota.trim() })
  }

  return (
    // Div principale del pannello: fisso in basso, centrato, largo 390px
    <div style={{
      position: "fixed",      // rimane fisso anche quando si scrolla
      bottom: 0,              // attaccato al fondo dello schermo
      left: "50%",            // parte dal centro
      transform: "translateX(-50%)", // si sposta a sinistra di metà della sua larghezza → risultato: centrato
      width: "100vw",
      maxWidth: 390,             // larghezza fissa uguale all'app
      boxSizing: "border-box",
      background: "white",
      borderTop: "1px solid #eee",
      padding: 4,
      paddingBottom: 20,
      boxShadow: "0 -4px 12px rgba(0,0,0,0.08)", // ombra verso l'alto
      zIndex: 200             // sopra tutto il resto (la nav è a 100)
    }}>

      {/* Riga titolo + pulsante chiudi */}
      <div style={{ fontWeight: 500, marginBottom: 12, color: "#666" }}>{titolo}</div>

      {/* Riga dei bottoni categoria: uno per ogni voce in CATEGORIE */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {CATEGORIE.map(c => (
          <button key={c.id} onClick={() => setCategoria(c.id)} style={{
            padding: "6px 12px",
            borderRadius: 18,
            border: "1px solid",
            // Se questa categoria è quella selezionata, colore verde; altrimenti grigio
            borderColor: categoria === c.id ? "#2d7a4f" : "#eee",
            background: categoria === c.id ? "#e8f5ee" : "white",
            color: categoria === c.id ? "#2d7a4f" : "#666",
            cursor: "pointer",
            fontSize: 13
          }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Riga data + importo affiancati */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="date" value={data}
          onChange={e => setData(e.target.value)}
          style={{ padding: 10, fontSize: 15, border: "1px solid #ddd", borderRadius: 8, flex: 1 }}
        />
        <input
          autoFocus                    // il cursore va qui automaticamente quando si apre
          type="text"
          inputMode="decimal"          // su mobile mostra tastiera numerica
          placeholder="€ importo"
          value={importo}
          onChange={e => setImporto(e.target.value)}
          onKeyDown={e => e.key === "Enter" && salva()} // Enter = salva
          style={{ padding: 10, fontSize: 15, border: "1px solid #ddd", borderRadius: 8, flex: 1 }}
        />
      </div>

      {/* Riga nota + pulsante chiudi + pulsante salva */}
      <input
        type="text" placeholder="Nota opzionale..." value={nota}
        onChange={e => setNota(e.target.value)}
        style={{ padding: 10, fontSize: 15, border: "1px solid #ddd", borderRadius: 8,
          width: "100%", boxSizing: "border-box", marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onChiudi} style={{
          padding: "10px 16px", fontSize: 15, background: "#f0f0f0",
          color: "#666", border: "none", borderRadius: 8, cursor: "pointer"
        }}>
          ✕
        </button>
        <button onClick={salva} style={{
          flex: 1, padding: "10px 20px", fontSize: 15, background: "#2d7a4f",
          color: "white", border: "none", borderRadius: 8, cursor: "pointer"
        }}>
          {spesa ? "Salva" : "Aggiungi"}
        </button>
      </div>
    </div>
  )
}

// Componente principale della pagina Spese
function Spese() {
  // Lista di tutte le spese caricate dal database
  const [spese, setSpese] = useState([])
  // true = il pannello "Nuova spesa" è aperto
  const [pannelloAperto, setPannelloAperto] = useState(false)
  // Contiene la spesa che si sta modificando (null = nessuna)
  const [modificando, setModificando] = useState(null)
  // Contiene l'id della spesa con il menu ⋯ aperto (null = nessuno)
  const [menuAperto, setMenuAperto] = useState(null)
  // Lista dei mesi aperti nell'accordion (inizia vuota, poi si apre il mese corrente)
  const [mesiAperti, setMesiAperti] = useState([])
  // Riferimento DOM al div del menu ⋯, usato per chiuderlo cliccando fuori
  const menuRef = useRef(null)

  // Al primo caricamento della pagina: legge tutte le spese da Firestore
  useEffect(() => {
    async function carica() {
      // Crea una query sulla collezione "spese" ordinata per data decrescente
      const q = query(collection(db, "spese"), orderBy("data", "desc"))
      const snap = await getDocs(q)
      // Converte i documenti Firestore in oggetti JS con id incluso
      setSpese(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    carica()
  }, []) // [] = esegui solo al primo render

  // Chiude il menu ⋯ se si clicca fuori da esso
  useEffect(() => {
    function chiudiMenu(e) {
      // menuRef.current.contains(e.target) = il click è dentro il menu?
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAperto(null)
    }
    document.addEventListener("mousedown", chiudiMenu)
    // La funzione return serve a "smontare" l'event listener quando il componente sparisce
    return () => document.removeEventListener("mousedown", chiudiMenu)
  }, [])

  // Quando le spese vengono caricate, apre automaticamente il mese più recente
  const mesiOrdinati = [...new Set(spese.map(s => s.data.slice(0, 7)))].sort((a, b) => b.localeCompare(a))
  useEffect(() => {
    if (mesiOrdinati.length > 0 && mesiAperti.length === 0) {
      setMesiAperti([mesiOrdinati[0]])
    }
  }, [spese])

  // Aggiunge una nuova spesa a Firestore e aggiorna la lista locale
  async function aggiungi(dati) {
    const docRef = await addDoc(collection(db, "spese"), dati)
    // Aggiunge la nuova spesa in cima alla lista (senza ricaricare tutto dal db)
    setSpese([{ id: docRef.id, ...dati }, ...spese])
    setPannelloAperto(false)
  }

  // Salva le modifiche a una spesa esistente
  async function salvaModifica(dati) {
    await updateDoc(doc(db, "spese", modificando.id), dati)
    // Aggiorna solo la spesa modificata nella lista locale
    setSpese(spese.map(s => s.id === modificando.id ? { ...s, ...dati } : s))
    setModificando(null)
  }

  // Elimina una spesa da Firestore e dalla lista locale
  async function elimina(id) {
    await deleteDoc(doc(db, "spese", id))
    setSpese(spese.filter(s => s.id !== id))
    setMenuAperto(null)
  }

  // Trova l'oggetto categoria dall'id (es. "spesa" → { id: "spesa", label: "Spesa", icon: "🛒" })
  // Se non la trova (categoria vecchia o cancellata) usa la prima della lista
  const cat = (id) => CATEGORIE.find(c => c.id === id) || CATEGORIE[0]

  // Apre o chiude un mese nell'accordion
  function toggleMese(mese) {
    setMesiAperti(prev =>
      // Se il mese è già aperto lo rimuove, altrimenti lo aggiunge
      prev.includes(mese) ? prev.filter(m => m !== mese) : [...prev, mese]
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, paddingBottom: 100 }}>

      {/* Per ogni mese presente nelle spese, mostra un accordion */}
      {mesiOrdinati.map(mese => (
        <div key={mese} style={{ marginBottom: 8, border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>

          {/* Intestazione del mese: cliccabile per aprire/chiudere */}
          <div
            onClick={() => toggleMese(mese)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 16px", cursor: "pointer", background: "white"
            }}
          >
            <span style={{ fontWeight: 500 }}>{nomeMese(mese)}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Totale del mese: somma di tutti gli importi di quel mese */}
              <span style={{ color: "#2d7a4f", fontWeight: 600 }}>
                € {spese.filter(s => s.data.startsWith(mese)).reduce((sum, s) => sum + s.importo, 0).toFixed(2)}
              </span>
              {/* Freccia su o giù a seconda se il mese è aperto */}
              <span style={{ color: "#ccc", fontSize: 18 }}>
                {mesiAperti.includes(mese) ? "▲" : "▼"}
              </span>
            </div>
          </div>

          {/* Lista delle spese del mese: visibile solo se il mese è aperto */}
          {mesiAperti.includes(mese) && (
            <div style={{ background: "#fafafa" }}>
              <ul style={{ listStyle: "none", padding: "0 16px", margin: 0 }}>
                {spese.filter(s => s.data.startsWith(mese)).map(s => (
                  <li key={s.id} style={{
                    display: "flex", alignItems: "center",
                    borderBottom: "1px solid #eee", padding: "12px 0", gap: 12,
                    position: "relative" // necessario per posizionare il menu ⋯ in modo assoluto
                  }}>
                    <span style={{ fontSize: 22 }}>{cat(s.categoria).icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>{cat(s.categoria).label}</div>
                      <div style={{ fontSize: 12, color: "#999" }}>
                        {/* Mostra la nota solo se esiste */}
                        {s.data}{s.nota ? ` · ${s.nota}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#2d7a4f" }}>
                      € {s.importo.toFixed(2)}
                    </div>

                    {/* Pulsante tre puntini ⋯ */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation() // evita che il click chiuda/apra l'accordion
                        setMenuAperto(menuAperto === s.id ? null : s.id)
                      }}
                      style={{ padding: "4px 8px", cursor: "pointer", color: "#999", fontSize: 20 }}>
                      ⋯
                    </span>

                    {/* Menu popup con Modifica ed Elimina, visibile solo per la spesa con menuAperto */}
                    {menuAperto === s.id && (
                      <div ref={menuRef} style={{
                        position: "absolute", // posizionato rispetto al <li> padre (che ha position: relative)
                        right: 0, top: 8,
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

      {/* Pannello nuova spesa: appare solo quando pannelloAperto è true */}
      {pannelloAperto && (
        <Pannello titolo="Nuova spesa" onSalva={aggiungi} onChiudi={() => setPannelloAperto(false)} />
      )}

      {/* Pannello modifica spesa: appare solo quando modificando non è null */}
      {modificando && (
        <Pannello titolo="Modifica spesa" spesa={modificando} onSalva={salvaModifica} onChiudi={() => setModificando(null)} />
      )}

      {/* Bottone verde + fisso in basso a destra */}
      <button onClick={() => setPannelloAperto(true)} style={{
        position: "fixed",
        bottom: 80,   // 80px dal basso = sopra la barra di navigazione (alta ~70px)
        right: 24,
        width: 56, height: 56,
        borderRadius: "50%",  // cerchio perfetto
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