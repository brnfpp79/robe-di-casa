import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { leggiStorico } from "../attivita/attivita";
import { leggiStato } from "../compiti/gettoni";
import { leggiLivelliSeq } from "../compiti/livelliSeq";

/* =========================================================================
   ATTIVITÀ DI RICCARDO — dashboard per soli adulti.
   Tempo per sezione (7 o 30 giorni) + statistiche compiti (livelli e
   percentuale di risposte azzeccate al primo tentativo).
   Il tempo è "schermata aperta": ordine di grandezza, non misura precisa.
   ========================================================================= */

const TARGET = "richi";

const SEZIONI = {
  matematica: { nome: "Matematica", emoji: "🔢", col: "#4D8FD6" },
  sequenze:   { nome: "Sequenze",   emoji: "🧩", col: "#B368C8" },
  parola:     { nome: "Parole",     emoji: "🔤", col: "#E8A13C" },
  giochi:     { nome: "Giochi",     emoji: "🎮", col: "#5BBE7A" },
  risparmi:   { nome: "Risparmi",   emoji: "💰", col: "#E0A020" },
};

const fmtMin = (sec) => {
  const m = Math.round((sec || 0) / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}`;
};
const perc = (a, b) => (b > 0 ? Math.round((a / b) * 100) : null);

export default function Attivita() {
  const navigate = useNavigate();
  const [giorni, setGiorni] = useState(7);
  const [storico, setStorico] = useState(null);
  const [mate, setMate] = useState(null);
  const [seq, setSeq] = useState(null);

  useEffect(() => {
    leggiStorico(TARGET, giorni).then(setStorico).catch((e) => { console.error(e); setStorico([]); });
  }, [giorni]);

  useEffect(() => {
    leggiStato(TARGET).then(setMate).catch((e) => { console.error(e); setMate(null); });
    leggiLivelliSeq(TARGET).then(setSeq).catch((e) => { console.error(e); setSeq(null); });
  }, []);

  // Somma i secondi per sezione nella finestra scelta
  const totali = {};
  let giorniAttivi = 0;
  (storico || []).forEach((d) => {
    let haQualcosa = false;
    Object.entries(d.sezioni || {}).forEach(([k, v]) => {
      totali[k] = (totali[k] || 0) + v; if (v > 0) haQualcosa = true;
    });
    if (haQualcosa) giorniAttivi += 1;
  });
  const maxSec = Math.max(1, ...Object.values(totali));
  const totaleGen = Object.values(totali).reduce((s, v) => s + v, 0);

  return (
    <div style={S.bg}>
      <div style={S.blur} />
      <div style={S.fg}>
        <div style={S.top}>
          <button onClick={() => navigate("/")} style={S.back}>←</button>
          <span style={S.titolo}>Attività di Riccardo</span>
          <span style={{ width: 46 }} />
        </div>

        <div style={S.toggle}>
          {[7, 30].map((g) => (
            <button key={g} onClick={() => setGiorni(g)}
              style={{ ...S.tBtn, ...(giorni === g ? S.tOn : {}) }}>
              Ultimi {g} giorni
            </button>
          ))}
        </div>

        {/* --- TEMPO PER SEZIONE --- */}
        <div style={S.card}>
          <h2 style={S.h2}>Tempo per sezione</h2>
          {storico === null ? (
            <p style={S.info}>Carico…</p>
          ) : totaleGen === 0 ? (
            <p style={S.info}>Nessuna attività in questo periodo.</p>
          ) : (
            <>
              {Object.keys(SEZIONI).filter((k) => totali[k]).map((k) => {
                const s = SEZIONI[k];
                return (
                  <div key={k} style={S.barRow}>
                    <span style={S.barLbl}>{s.emoji} {s.nome}</span>
                    <div style={S.barTrack}>
                      <div style={{ ...S.barFill, width: `${(totali[k] / maxSec) * 100}%`, background: s.col }} />
                    </div>
                    <span style={S.barVal}>{fmtMin(totali[k])}</span>
                  </div>
                );
              })}
              <p style={S.nota}>
                Totale {fmtMin(totaleGen)} su {giorniAttivi} {giorniAttivi === 1 ? "giorno attivo" : "giorni attivi"}.
                Il tempo conta lo schermo aperto, quindi è un ordine di grandezza.
              </p>
            </>
          )}
        </div>

        {/* --- STATISTICHE COMPITI --- */}
        <div style={S.card}>
          <h2 style={S.h2}>Compiti</h2>

          <div style={S.statRow}>
            <div style={S.statBox}>
              <span style={S.statLbl}>🔢 Matematica · livello</span>
              <span style={S.statVal}>{mate ? mate.livelloMax : "…"}</span>
            </div>
            <div style={S.statBox}>
              <span style={S.statLbl}>al primo tentativo</span>
              <span style={S.statVal}>
                {mate && mate.diag && mate.diag.risolte
                  ? `${perc(mate.diag.primoColpo, mate.diag.risolte)}%`
                  : "—"}
              </span>
            </div>
          </div>

          <div style={{ ...S.statBox, marginBottom: 10 }}>
            <span style={S.statLbl}>🧩 Sequenze · livello</span>
            <span style={S.statVal}>{seq ? seq.livelloMax : "…"}</span>
          </div>

          {seq && seq.diag && Object.keys(seq.diag).length > 0 ? (
            <div>
              <p style={S.subH}>Primo tentativo per livello</p>
              {Object.keys(seq.diag).sort().map((liv) => {
                const d = seq.diag[liv];
                const p = perc(d.primoColpo, d.risolti);
                return (
                  <div key={liv} style={S.seqRow}>
                    <span style={S.seqLiv}>Livello {liv}</span>
                    <div style={S.barTrack}>
                      <div style={{ ...S.barFill, width: `${p ?? 0}%`, background: "#B368C8" }} />
                    </div>
                    <span style={S.seqVal}>{p !== null ? `${p}%` : "—"}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={S.info}>Ancora nessun dato sulle sequenze.</p>
          )}

          <p style={S.nota}>
            "Primo tentativo" alto = induce il pattern al volo. Basso = procede per esclusione:
            il livello potrebbe essere ancora da consolidare.
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  bg: { minHeight: "100dvh", backgroundImage: "url('/famiglia.jpg')", backgroundSize: "cover", backgroundPosition: "center", position: "relative", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  blur: { position: "absolute", inset: 0, backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.5)" },
  fg: { position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto", padding: "20px 16px" },
  top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  back: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, fontSize: 26, width: 46, height: 46, cursor: "pointer", color: "#333" },
  titolo: { color: "#fff", fontSize: 20, fontWeight: 700 },
  toggle: { display: "flex", gap: 8, marginBottom: 16 },
  tBtn: { flex: 1, border: "none", borderRadius: 12, padding: "10px", fontSize: 14, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.8)", color: "#555" },
  tOn: { background: "#fff", color: "#1F4A46", boxShadow: "0 3px 10px -3px rgba(0,0,0,.4)" },
  card: { background: "#fff", borderRadius: 20, padding: "18px 18px", marginBottom: 16, boxShadow: "0 10px 28px -14px rgba(0,0,0,.5)" },
  h2: { margin: "0 0 14px", fontSize: 18, color: "#2A2A2A" },
  info: { color: "#9a917f", textAlign: "center", padding: "10px 0" },
  barRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  barLbl: { width: 108, fontSize: 13, fontWeight: 600, color: "#3B352A" },
  barTrack: { flex: 1, height: 14, background: "#EFEAE0", borderRadius: 8, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 8, transition: "width .4s" },
  barVal: { width: 60, textAlign: "right", fontSize: 13, fontWeight: 700, color: "#555" },
  nota: { fontSize: 12, color: "#9a917f", lineHeight: 1.5, marginTop: 12, marginBottom: 0 },
  statRow: { display: "flex", gap: 10, marginBottom: 10 },
  statBox: { flex: 1, background: "#FAF7F0", borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 3 },
  statLbl: { fontSize: 12, color: "#9a917f", fontWeight: 700 },
  statVal: { fontSize: 24, fontWeight: 800, color: "#1F4A46" },
  subH: { fontSize: 13, fontWeight: 700, color: "#6d665a", margin: "6px 0 10px" },
  seqRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  seqLiv: { width: 84, fontSize: 13, fontWeight: 600, color: "#3B352A" },
  seqVal: { width: 44, textAlign: "right", fontSize: 13, fontWeight: 700, color: "#555" },
};