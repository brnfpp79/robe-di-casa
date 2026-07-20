import { useState, useEffect } from "react";
import { leggiMovimenti, aggiungiMovimento, eliminaMovimento, euro, oggi, dataIt } from "./movimenti";

/* =========================================================================
   FONDO — vista adulti per un cassetto di risparmio (università, famiglia,
   fil, vale). Lista unica di movimenti + totali separati per categoria.

   Due totali che NON mentono:
     Versato finora     → somma di tutti gli importi (dato certo)
     Valore atteso 2038 → somma dei valori a scadenza dei soli buoni Posta,
                          dichiarati a mano. Il sistema non proietta nulla.
   ========================================================================= */

export const CATEGORIE = [
  { id: "posta",    nome: "Posta",         emoji: "📮", scadenza: true },
  { id: "etf",      nome: "ETF",           emoji: "📈" },
  { id: "deposito", nome: "Conto deposito", emoji: "🏦" },
  { id: "oro",      nome: "Oro",           emoji: "🪙" },
];
const catById = (id) => CATEGORIE.find((c) => c.id === id) || CATEGORIE[0];

export default function Fondo({ scope, titolo, mostraScadenza, onEsci }) {
  const [movs, setMovs] = useState(null);
  const [form, setForm] = useState(false);

  const carica = () => leggiMovimenti(scope).then(setMovs).catch((e) => { console.error(e); setMovs([]); });
  useEffect(() => { carica(); /* eslint-disable-next-line */ }, [scope]);

  const versato = (movs || []).reduce((s, m) => s + (m.importo || 0), 0);
  const atteso  = (movs || []).reduce((s, m) => s + (m.valoreScadenza || 0), 0);
  const perCat  = CATEGORIE.map((c) => ({
    ...c, tot: (movs || []).filter((m) => m.categoria === c.id).reduce((s, m) => s + (m.importo || 0), 0),
  })).filter((c) => c.tot > 0);

  const salva = async (mov) => { await aggiungiMovimento(scope, mov); setForm(false); carica(); };
  const elimina = async (id) => {
    if (!window.confirm("Eliminare questo movimento?")) return;
    await eliminaMovimento(scope, id); carica();
  };

  return (
    <>
      <div style={S.top}>
        <button onClick={onEsci} style={S.back}>←</button>
        <span style={S.titolo}>{titolo}</span>
        <span style={{ width: 46 }} />
      </div>

      <div style={S.totali}>
        <div style={S.totBox}>
          <span style={S.totLbl}>Versato finora</span>
          <span style={S.totVal}>{euro(versato)}</span>
        </div>
        {mostraScadenza && (
          <div style={{ ...S.totBox, background: "#EAF3EE" }}>
            <span style={S.totLbl}>Valore atteso 2038</span>
            <span style={{ ...S.totVal, color: "#2E7D52" }}>{euro(atteso)}</span>
            <span style={S.totNota}>solo buoni postali</span>
          </div>
        )}
      </div>

      {perCat.length > 0 && (
        <div style={S.chips}>
          {perCat.map((c) => (
            <span key={c.id} style={S.chip}>{c.emoji} {c.nome} · <b>{euro(c.tot)}</b></span>
          ))}
        </div>
      )}

      <button onClick={() => setForm(true)} style={S.aggiungi}>+ Aggiungi versamento</button>

      {movs === null ? (
        <p style={S.info}>Carico…</p>
      ) : movs.length === 0 ? (
        <p style={S.info}>Nessun versamento registrato.</p>
      ) : (
        <div style={S.lista}>
          {movs.map((m) => {
            const c = catById(m.categoria);
            return (
              <div key={m.id} style={S.riga}>
                <span style={S.rEmoji}>{c.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={S.rCat}>{c.nome}</div>
                  <div style={S.rData}>{dataIt(m.data)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={S.rImp}>{euro(m.importo)}</div>
                  {m.valoreScadenza ? <div style={S.rScad}>→ {euro(m.valoreScadenza)}</div> : null}
                </div>
                <button onClick={() => elimina(m.id)} style={S.rDel}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {form && <FormVersamento onSalva={salva} onAnnulla={() => setForm(false)} />}
    </>
  );
}

function FormVersamento({ onSalva, onAnnulla }) {
  const [data, setData] = useState(oggi());
  const [categoria, setCategoria] = useState("posta");
  const [importo, setImporto] = useState("");
  const [scad, setScad] = useState("");
  const cat = catById(categoria);

  const conferma = () => {
    const imp = parseFloat(String(importo).replace(",", "."));
    if (!imp || imp <= 0) return;
    const sc = parseFloat(String(scad).replace(",", "."));
    onSalva({ data, categoria, importo: imp, valoreScadenza: cat.scadenza && sc > 0 ? sc : null });
  };

  return (
    <div style={S.overlay}>
      <div style={S.dialog}>
        <h2 style={S.dTit}>Nuovo versamento</h2>

        <label style={S.lbl}>Categoria</label>
        <div style={S.catGrid}>
          {CATEGORIE.map((c) => (
            <button key={c.id} onClick={() => setCategoria(c.id)}
              style={{ ...S.catBtn, ...(categoria === c.id ? S.catOn : {}) }}>
              <span style={{ fontSize: 24 }}>{c.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{c.nome}</span>
            </button>
          ))}
        </div>

        <label style={S.lbl}>Importo versato (€)</label>
        <input type="number" inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} style={S.input} placeholder="0" />

        {cat.scadenza && (
          <>
            <label style={S.lbl}>Valore a scadenza 2038 (€)</label>
            <input type="number" inputMode="decimal" value={scad} onChange={(e) => setScad(e.target.value)} style={S.input} placeholder="quanto varrà" />
          </>
        )}

        <label style={S.lbl}>Data</label>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={S.input} />

        <button onClick={conferma} style={S.dOk}>Salva</button>
        <button onClick={onAnnulla} style={S.dNo}>Annulla</button>
      </div>
    </div>
  );
}

const S = {
  top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  back: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, fontSize: 26, width: 46, height: 46, cursor: "pointer", color: "#1F4A46" },
  titolo: { color: "#fff", fontSize: 20, fontWeight: 700 },
  totali: { display: "flex", gap: 10, marginBottom: 14 },
  totBox: { flex: 1, background: "#fff", borderRadius: 16, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 2 },
  totLbl: { fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "#9a917f", fontWeight: 700 },
  totVal: { fontSize: 24, fontWeight: 800, color: "#1F4A46" },
  totNota: { fontSize: 10, color: "#9a917f" },
  chips: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: { background: "rgba(255,255,255,0.9)", borderRadius: 14, padding: "6px 12px", fontSize: 13, color: "#3B352A" },
  aggiungi: { width: "100%", background: "linear-gradient(145deg,#3E7F79,#1F4A46)", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 16 },
  info: { color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 20 },
  lista: { display: "flex", flexDirection: "column", gap: 8 },
  riga: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.93)", borderRadius: 14, padding: "12px 14px" },
  rEmoji: { fontSize: 24 },
  rCat: { fontWeight: 700, color: "#3B352A", fontSize: 15 },
  rData: { fontSize: 12, color: "#9a917f" },
  rImp: { fontWeight: 800, color: "#1F4A46", fontSize: 16 },
  rScad: { fontSize: 12, color: "#2E7D52", fontWeight: 700 },
  rDel: { background: "none", border: "none", color: "#c9bfac", fontSize: 22, cursor: "pointer", padding: "0 4px" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", zIndex: 20, padding: 20, overflowY: "auto" },
  dialog: { background: "#fff", borderRadius: 24, padding: "24px 22px", maxWidth: 420, width: "100%", boxShadow: "0 20px 50px -12px rgba(0,0,0,.5)" },
  dTit: { margin: "0 0 16px", fontSize: 22, color: "#1F4A46", textAlign: "center" },
  lbl: { display: "block", fontSize: 12, color: "#9a917f", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 },
  catGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 },
  catBtn: { border: "2px solid #E6DCC4", background: "#FAF7F0", borderRadius: 14, padding: "10px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: "#3B352A" },
  catOn: { borderColor: "#1F4A46", background: "#E4ECEA" },
  input: { width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 17, borderRadius: 12, border: "2px solid #E6DCC4", marginBottom: 14, fontWeight: 600, color: "#3B352A" },
  dOk: { width: "100%", background: "linear-gradient(145deg,#3E7F79,#1F4A46)", color: "#fff", border: "none", borderRadius: 14, padding: "13px", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 8 },
  dNo: { width: "100%", background: "none", border: "none", color: "#9a917f", padding: "8px", fontSize: 14, cursor: "pointer" },
};