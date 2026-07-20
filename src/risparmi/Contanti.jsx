import { useState, useEffect } from "react";
import { leggiMovimenti, aggiungiMovimento, euro, oggi, dataIt } from "./movimenti";

/* =========================================================================
   I MIEI SOLDINI — contabilità dei contanti di Riccardo.
   Saldo grande, "Ho ricevuto" / "Ho speso", importo col tastierino che già
   conosce dalla matematica, categoria a emoji, niente testo da scrivere.
   Data automatica (oggi). Non cancella e non modifica: gli errori li
   correggono i grandi (le regole Firestore lo garantiscono).
   ========================================================================= */

const ENTRATE = [
  { id: "regalo",   nome: "Regalo",   emoji: "🎁" },
  { id: "paghetta", nome: "Paghetta", emoji: "💶" },
  { id: "altro-in", nome: "Altro",    emoji: "✨" },
];
const USCITE = [
  { id: "giocattolo", nome: "Giocattolo", emoji: "🧸" },
  { id: "dolce",      nome: "Dolcetto",   emoji: "🍭" },
  { id: "libro",      nome: "Libro",      emoji: "📗" },
  { id: "altro-out",  nome: "Altro",      emoji: "🛒" },
];
const tutte = [...ENTRATE, ...USCITE];
const catById = (id) => tutte.find((c) => c.id === id);

export default function Contanti({ onEsci }) {
  const [movs, setMovs] = useState(null);
  const [modo, setModo] = useState(null);   // "in" | "out"

  const carica = () => leggiMovimenti("richiCash").then(setMovs).catch((e) => { console.error(e); setMovs([]); });
  useEffect(() => { carica(); }, []);

  const saldo = (movs || []).reduce((s, m) => s + (m.tipo === "out" ? -m.importo : m.importo), 0);

  const salva = async (mov) => {
    await aggiungiMovimento("richiCash", mov);
    setModo(null);
    carica();
  };

  return (
    <>
      <div style={S.top}>
        <button onClick={onEsci} style={S.back}>←</button>
        <span style={{ width: 46 }} />
      </div>

      <div style={S.saldoBox}>
        <span style={S.saldoLbl}>I miei soldini</span>
        <span style={S.saldo}>{euro(saldo)}</span>
      </div>

      <div style={S.azioni}>
        <button onClick={() => setModo("in")} style={{ ...S.azione, background: "linear-gradient(145deg,#7ED09A,#5BBE7A)" }}>
          <span style={{ fontSize: 30 }}>➕</span><span>Ho ricevuto</span>
        </button>
        <button onClick={() => setModo("out")} style={{ ...S.azione, background: "linear-gradient(145deg,#F2A88C,#E5825F)" }}>
          <span style={{ fontSize: 30 }}>➖</span><span>Ho speso</span>
        </button>
      </div>

      {movs === null ? (
        <p style={S.info}>Un attimo…</p>
      ) : movs.length === 0 ? (
        <p style={S.info}>Qui vedrai tutti i tuoi soldini! 💰</p>
      ) : (
        <div style={S.lista}>
          {movs.map((m) => {
            const c = catById(m.categoria);
            const out = m.tipo === "out";
            return (
              <div key={m.id} style={S.riga}>
                <span style={S.rEmoji}>{c ? c.emoji : "💰"}</span>
                <div style={{ flex: 1 }}>
                  <div style={S.rCat}>{c ? c.nome : "—"}</div>
                  <div style={S.rData}>{dataIt(m.data)}</div>
                </div>
                <span style={{ ...S.rImp, color: out ? "#C0574F" : "#2E7D52" }}>
                  {out ? "−" : "+"}{euro(m.importo)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {modo && <FormSoldi tipo={modo} onSalva={salva} onAnnulla={() => setModo(null)} />}
    </>
  );
}

function FormSoldi({ tipo, onSalva, onAnnulla }) {
  const cats = tipo === "in" ? ENTRATE : USCITE;
  const [categoria, setCategoria] = useState(cats[0].id);
  const [cifre, setCifre] = useState("");

  const valore = cifre === "" ? 0 : parseInt(cifre, 10) / 100;   // centesimi
  const digita = (d) => setCifre((c) => (c + d).slice(0, 6));
  const cancella = () => setCifre((c) => c.slice(0, -1));
  const conferma = () => { if (valore > 0) onSalva({ data: oggi(), importo: valore, categoria, tipo }); };

  return (
    <div style={S.overlay}>
      <div style={S.dialog}>
        <h2 style={S.dTit}>{tipo === "in" ? "Ho ricevuto 🎉" : "Ho speso 🛍️"}</h2>

        <div style={S.catRow}>
          {cats.map((c) => (
            <button key={c.id} onClick={() => setCategoria(c.id)}
              style={{ ...S.catBtn, ...(categoria === c.id ? S.catOn : {}) }}>
              <span style={{ fontSize: 30 }}>{c.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{c.nome}</span>
            </button>
          ))}
        </div>

        <div style={S.display}>{euro(valore)}</div>

        <div style={S.tastierino}>
          {[1,2,3,4,5,6,7,8,9].map((n) => (
            <button key={n} onClick={() => digita(String(n))} style={S.tasto}>{n}</button>
          ))}
          <button onClick={cancella} style={{ ...S.tasto, ...S.tastoAz }}>⌫</button>
          <button onClick={() => digita("0")} style={S.tasto}>0</button>
          <button onClick={conferma} style={{ ...S.tasto, ...S.tastoOk }}>✓</button>
        </div>

        <button onClick={onAnnulla} style={S.dNo}>Annulla</button>
      </div>
    </div>
  );
}

const S = {
  top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  back: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, fontSize: 26, width: 46, height: 46, cursor: "pointer", color: "#8A5A16" },
  saldoBox: { background: "#fff", borderRadius: 24, padding: "22px 20px", textAlign: "center", marginBottom: 16, boxShadow: "0 10px 28px -14px rgba(0,0,0,.5)" },
  saldoLbl: { display: "block", fontSize: 13, textTransform: "uppercase", letterSpacing: ".06em", color: "#9a917f", fontWeight: 700 },
  saldo: { display: "block", fontSize: 46, fontWeight: 800, color: "#B8860B", marginTop: 4 },
  azioni: { display: "flex", gap: 12, marginBottom: 18 },
  azione: { flex: 1, border: "none", borderRadius: 20, padding: "18px 10px", cursor: "pointer", color: "#fff", fontSize: 16, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 5px 0 rgba(0,0,0,.12)" },
  info: { color: "rgba(255,255,255,0.9)", textAlign: "center", marginTop: 24, fontSize: 16 },
  lista: { display: "flex", flexDirection: "column", gap: 8 },
  riga: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.93)", borderRadius: 14, padding: "12px 14px" },
  rEmoji: { fontSize: 28 },
  rCat: { fontWeight: 700, color: "#3B352A", fontSize: 16 },
  rData: { fontSize: 12, color: "#9a917f" },
  rImp: { fontWeight: 800, fontSize: 18 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", zIndex: 20, padding: 16, overflowY: "auto" },
  dialog: { background: "#fff", borderRadius: 26, padding: "22px 20px", maxWidth: 420, width: "100%", boxShadow: "0 20px 50px -12px rgba(0,0,0,.5)" },
  dTit: { margin: "0 0 14px", fontSize: 24, color: "#8A5A16", textAlign: "center" },
  catRow: { display: "flex", gap: 8, justifyContent: "center", marginBottom: 14, flexWrap: "wrap" },
  catBtn: { border: "3px solid #EFE6D2", background: "#FAF7F0", borderRadius: 16, padding: "10px 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: "#3B352A", minWidth: 78 },
  catOn: { borderColor: "#E8A13C", background: "#FBEFD8" },
  display: { background: "#FAF7F0", border: "3px solid #EFC873", borderRadius: 16, padding: "14px", textAlign: "center", fontSize: 36, fontWeight: 800, color: "#B8860B", marginBottom: 14 },
  tastierino: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 },
  tasto: { height: 70, borderRadius: 14, border: "none", cursor: "pointer", fontSize: 30, fontWeight: 800, color: "#3B352A", background: "#F0EBE1", boxShadow: "0 3px 0 #DcD3C2" },
  tastoAz: { background: "#F3D9D9", color: "#C0574F" },
  tastoOk: { background: "linear-gradient(145deg,#7ED09A,#5BBE7A)", color: "#fff" },
  dNo: { width: "100%", background: "none", border: "none", color: "#9a917f", padding: "8px", fontSize: 14, cursor: "pointer" },
};