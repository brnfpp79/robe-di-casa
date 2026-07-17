import { useState, useEffect } from "react";

/* =========================================================================
   MEMORY — numero di coppie variabile per difficoltà.
   Props:
     variante  → { coppie, ... }  (da registro; default 8 se assente)
     onFine(value)  → a partita vinta, con le mosse
     onEsci()       → torna alla lista giochi
   ========================================================================= */
const SIMBOLI = ["🦊", "🐱", "🌟", "🚗", "🐶", "🌈", "🍎", "⚽", "🐸", "🚀", "🍕", "🎈", "🐝", "🌻"];

function nuovoMazzo(nCoppie) {
  const usati = SIMBOLI.slice(0, nCoppie);
  const carte = usati.flatMap((simbolo, i) => [
    { key: `${i}a`, simbolo, girata: false, trovata: false },
    { key: `${i}b`, simbolo, girata: false, trovata: false },
  ]);
  for (let i = carte.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [carte[i], carte[j]] = [carte[j], carte[i]];
  }
  return carte;
}

export default function Memory({ variante, onFine, onEsci }) {
  const nCoppie = variante?.coppie || 8;
  const [carte, setCarte] = useState(() => nuovoMazzo(nCoppie));
  const [scelte, setScelte] = useState([]);
  const [mosse, setMosse] = useState(0);
  const [bloccato, setBloccato] = useState(false);
  const [finito, setFinito] = useState(false);

  const vinto = carte.every((c) => c.trovata);

  useEffect(() => {
    if (scelte.length !== 2) return;
    setBloccato(true);
    const [a, b] = scelte;
    const uguali = carte[a].simbolo === carte[b].simbolo;
    const t = setTimeout(() => {
      setCarte((prev) =>
        prev.map((c, i) =>
          i === a || i === b
            ? (uguali ? { ...c, trovata: true, girata: true } : { ...c, girata: false })
            : c
        )
      );
      setScelte([]);
      setBloccato(false);
    }, uguali ? 450 : 850);
    return () => clearTimeout(t);
  }, [scelte, carte]);

  useEffect(() => {
    if (vinto && !finito) {
      setFinito(true);
      onFine?.(mosse);
    }
  }, [vinto, finito, mosse, onFine]);

  const giraCarta = (i) => {
    if (bloccato || carte[i].girata || carte[i].trovata) return;
    setCarte((prev) => prev.map((c, idx) => (idx === i ? { ...c, girata: true } : c)));
    setScelte((prev) => {
      const next = [...prev, i];
      if (next.length === 2) setMosse((m) => m + 1);
      return next;
    });
  };

  return (
    <div style={S.wrap}>
      <div style={S.top}>
        <button onClick={onEsci} style={S.back}>←</button>
        <span style={S.mosse}>Mosse: {mosse}</span>
      </div>
      <div style={S.grid}>
        {carte.map((c, i) => {
          const su = c.girata || c.trovata;
          return (
            <button
              key={c.key}
              onClick={() => giraCarta(i)}
              style={{
                ...S.carta,
                background: su ? "#fff" : "linear-gradient(145deg,#E8A13C,#D98A1E)",
                opacity: c.trovata ? 0.55 : 1,
                cursor: su ? "default" : "pointer",
              }}
            >
              <span style={{ fontSize: 34, visibility: su ? "visible" : "hidden" }}>{c.simbolo}</span>
              {!su && <span style={S.retro}>?</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const S = {
  wrap: { maxWidth: 460, margin: "0 auto", padding: "20px 16px" },
  top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  back: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, fontSize: 26, width: 46, height: 46, cursor: "pointer", color: "#8A5A16" },
  mosse: { color: "#fff", fontSize: 18, fontWeight: 700, background: "rgba(0,0,0,0.3)", padding: "8px 16px", borderRadius: 20 },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  carta: { aspectRatio: "1", border: "none", borderRadius: 16, display: "grid", placeItems: "center", position: "relative", boxShadow: "0 4px 10px -4px rgba(0,0,0,.4)", transition: "opacity .3s, background .2s" },
  retro: { position: "absolute", fontSize: 30, color: "rgba(255,255,255,0.85)", fontWeight: 800 },
};