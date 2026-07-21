import { useState } from "react";
import Sfondo, { ui } from "./Sfondo";
import { useCronometro } from "../hooks/useCronometro";

/* =========================================================================
   COSTRUISCI LA PAROLA — metodo fonetico sillabico.
   - Emoji dell'oggetto (poi sostituibile con immagine in /compiti/parole/).
   - Tessere sillabiche sparse: quelle giuste + 3 distrattori reali.
   - TOCCO per posizionare (niente trascinamento).
   - Autocorrezione nel materiale: la sillaba giusta per il posto attivo si
     aggancia; una sbagliata non si aggancia (piccolo tremolio, nessun
     giudizio negativo). Ogni tocco pronuncia la sillaba (audio .m4a).
   - Contatore neutro "parole costruite", non una valuta. Nessun gettone.
   ========================================================================= */

const PAROLE = [
  { parola: "casa", emoji: "🏠", sillabe: ["ca", "sa"] },
  { parola: "luna", emoji: "🌙", sillabe: ["lu", "na"] },
  { parola: "naso", emoji: "👃", sillabe: ["na", "so"] },
  { parola: "pane", emoji: "🍞", sillabe: ["pa", "ne"] },
  { parola: "rana", emoji: "🐸", sillabe: ["ra", "na"] },
  { parola: "rete", emoji: "🥅", sillabe: ["re", "te"] },
  { parola: "vino", emoji: "🍷", sillabe: ["vi", "no"] },
  { parola: "mela", emoji: "🍎", sillabe: ["me", "la"] },
  { parola: "dado", emoji: "🎲", sillabe: ["da", "do"] },
  { parola: "pera", emoji: "🍐", sillabe: ["pe", "ra"] },
];

// Pool di sillabe reali per i distrattori (tutte hanno un audio registrato).
const POOL = ["ca","sa","lu","na","so","pa","ne","ra","re","te","vi","no","me","la","da","do","pe","ta"];

const mescola = (arr) => { const a = arr.slice(); for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const suona = (sill) => { try { new Audio(`/compiti/sillabe/${sill}.m4a`).play().catch(()=>{}); } catch {} };

function costruisciTessere(sillabe) {
  const distr = mescola(POOL.filter((s) => !sillabe.includes(s))).slice(0, 3);
  return mescola([...sillabe, ...distr].map((s, i) => ({ id: `${i}-${s}`, sill: s, usata: false })));
}
const prossima = (cur) => { const alt = PAROLE.filter((p) => p.parola !== cur?.parola); return alt[Math.floor(Math.random()*alt.length)]; };

export default function CostruisciParola({ onEsci }) {
  useCronometro("parola");
  const [parola, setParola] = useState(() => PAROLE[Math.floor(Math.random()*PAROLE.length)]);
  const [posizioni, setPosizioni] = useState(() => Array(parola.sillabe.length).fill(null));
  const [tessere, setTessere] = useState(() => costruisciTessere(parola.sillabe));
  const [completata, setCompletata] = useState(false);
  const [shakeId, setShakeId] = useState(null);
  const [fatte, setFatte] = useState(0);

  const setup = (p) => {
    setParola(p);
    setPosizioni(Array(p.sillabe.length).fill(null));
    setTessere(costruisciTessere(p.sillabe));
    setCompletata(false);
    setShakeId(null);
  };

  const tapTessera = (t) => {
    if (completata) return;
    suona(t.sill);                 // ogni tocco pronuncia la sillaba
    if (t.usata) return;
    const idx = posizioni.findIndex((p) => p === null);
    if (idx === -1) return;

    if (t.sill === parola.sillabe[idx]) {          // giusta per il posto attivo
      const nuovePos = posizioni.slice(); nuovePos[idx] = { sill: t.sill, id: t.id };
      setPosizioni(nuovePos);
      setTessere(tessere.map((x) => (x.id === t.id ? { ...x, usata: true } : x)));
      if (nuovePos.every((p) => p !== null)) {
        setCompletata(true);
        setFatte((f) => f + 1);
        parola.sillabe.forEach((s, i) => setTimeout(() => suona(s), 400 + i * 650));
      }
    } else {                                       // sbagliata: non si aggancia
      setShakeId(t.id);
      setTimeout(() => setShakeId(null), 450);
    }
  };

  const tapSlot = (idx) => {
    if (completata || !posizioni[idx]) return;
    const nuovePos = posizioni.slice();
    const liberati = [];
    for (let j = idx; j < nuovePos.length; j++) if (nuovePos[j]) { liberati.push(nuovePos[j].id); nuovePos[j] = null; }
    setPosizioni(nuovePos);
    setTessere(tessere.map((x) => (liberati.includes(x.id) ? { ...x, usata: false } : x)));
  };

  const attivo = posizioni.findIndex((p) => p === null);

  return (
    <Sfondo>
      <style>{`@keyframes wiggle{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>

      <div style={ui.top}>
        <button onClick={onEsci} style={ui.back}>←</button>
        <div style={S.badge}>Parole costruite: <b style={{ marginLeft: 6 }}>{fatte}</b></div>
      </div>

      <div style={S.card}>
        <div style={S.emoji}>{parola.emoji}</div>

        {/* Slot della parola */}
        <div style={S.slots}>
          {posizioni.map((p, i) => (
            <div
              key={i}
              onClick={() => tapSlot(i)}
              style={{
                ...S.slot,
                borderColor: completata ? "#5BBE7A" : (i === attivo ? "#E8A13C" : "#E6DCC4"),
                background: p ? "#FBEFD8" : "#FAF7F0",
                cursor: p ? "pointer" : "default",
              }}
            >
              {p ? p.sill : ""}
            </div>
          ))}
        </div>

        {completata ? (
          <div style={S.successo}>
            <div style={{ fontSize: 34 }}>🌟</div>
            <button onClick={() => setup(prossima(parola))} style={S.primario}>Continua →</button>
          </div>
        ) : (
          <div style={S.tessere}>
            {tessere.map((t) => (
              <button
                key={t.id}
                onClick={() => tapTessera(t)}
                disabled={t.usata}
                style={{
                  ...S.tessera,
                  visibility: t.usata ? "hidden" : "visible",
                  animation: shakeId === t.id ? "wiggle .4s" : "none",
                }}
              >
                {t.sill}
              </button>
            ))}
          </div>
        )}
      </div>
    </Sfondo>
  );
}

const S = {
  badge: { display: "flex", alignItems: "center", background: "rgba(255,255,255,0.9)", borderRadius: 20, padding: "8px 16px", fontSize: 14, fontWeight: 700, color: "#8A5A16" },
  card: { background: "#fff", borderRadius: 26, padding: "28px 20px", maxWidth: 380, margin: "0 auto", textAlign: "center", boxShadow: "0 12px 34px -14px rgba(0,0,0,.5)" },
  emoji: { fontSize: 96, lineHeight: 1, marginBottom: 20 },
  slots: { display: "flex", justifyContent: "center", gap: 10, marginBottom: 24 },
  slot: { width: 76, height: 76, border: "3px solid", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "#8A5A16" },
  tessere: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  tessera: { minWidth: 64, height: 64, padding: "0 14px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 28, fontWeight: 800, color: "#3B352A", background: "linear-gradient(145deg,#FBEFD8,#F6D79A)", boxShadow: "0 4px 0 #E4C97F" },
  successo: { display: "flex", flexDirection: "column", alignItems: "center", gap: 14 },
  primario: { background: "linear-gradient(145deg,#7ED09A,#5BBE7A)", color: "#fff", border: "none", borderRadius: 14, padding: "13px 28px", fontSize: 18, fontWeight: 700, cursor: "pointer" },
};