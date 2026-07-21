import { useState, useEffect, useRef } from "react";
import { useUserProfile } from "../hooks/useUserProfile";
import { leggiStato, aggiungiGettoni, salvaLivello, salvaLivelloMax, salvaDiagMate } from "./gettoni";
import Sfondo, { ui } from "./Sfondo";
import { useCronometro } from "../hooks/useCronometro";

/* =========================================================================
   MATEMATICA — esercizio AUTONOMO: carica da sé gettoni e livelli, mostra i
   propri badge, e riceve solo onEsci() per tornare al launcher.
   Regole invariate: adattivo, nessuna punizione, discesa livello invisibile,
   festa + bonus solo a nuovo record.
   ========================================================================= */

const LIV_MIN = 1;
const LIV_MAX = 6;
const maxFor = (liv) => liv * 10;
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function nuovaDomanda(max) {
  if (Math.random() < 0.5) {
    const a = rand(1, max), b = rand(1, max);
    return { a, b, op: "+", ris: a + b };
  }
  const a = rand(2, max), b = rand(1, a);
  return { a, b, op: "−", ris: a - b };
}
const COLORI = { a: "#4D8FD6", b: "#E8A13C", op: "#B368C8", ris: "#5BBE7A" };

export default function Matematica({ onEsci }) {
  useCronometro("matematica");
  const { profileId, loading } = useUserProfile();
  const player = profileId || "guest";

  const [gettoni, setGettoni] = useState(null);
  const [corrente, setCorrente] = useState(null);
  const [livelloMax, setLivelloMax] = useState(null);
  const gettoniRef = useRef(0);
  const diagRef = useRef({});
  const daSalvareDiag = useRef(0);

  const registraTentativo = (primoColpo) => {
    const d = diagRef.current;
    d.risolte = (d.risolte || 0) + 1;
    if (primoColpo) d.primoColpo = (d.primoColpo || 0) + 1;
    diagRef.current = { ...d };
    if (++daSalvareDiag.current >= 5) {
      daSalvareDiag.current = 0;
      salvaDiagMate(player, diagRef.current).catch((e) => console.error("Diag mate:", e));
    }
  };

  useEffect(() => {
    if (loading) return;
    leggiStato(player)
      .then(({ count, livello, livelloMax, diag }) => {
        gettoniRef.current = count; setGettoni(count);
        setCorrente(livello); setLivelloMax(livelloMax);
        diagRef.current = diag || {};
      })
      .catch((e) => { console.error(e); gettoniRef.current = 0; setGettoni(0); setCorrente(2); setLivelloMax(2); });
  }, [loading, player]);

  const premia = (n) => {
    const cur = gettoniRef.current;
    const nuovo = Math.max(0, cur + n);
    const delta = nuovo - cur;
    if (delta === 0) return;
    gettoniRef.current = nuovo;
    setGettoni(nuovo);
    aggiungiGettoni(player, delta).catch((e) => console.error("Gettoni non salvati:", e));
  };
  const onCorrente = (liv) => {
    setCorrente(liv);
    salvaLivello(player, liv).catch((e) => console.error("Livello non salvato:", e));
  };
  const onNuovoMax = (liv) => {
    setCorrente(liv); setLivelloMax(liv);
    salvaLivello(player, liv).catch((e) => console.error("Livello non salvato:", e));
    salvaLivelloMax(player, liv).catch((e) => console.error("Record non salvato:", e));
  };

  const pronto = !loading && gettoni !== null && corrente !== null;

  return (
    <Sfondo>
      <div style={ui.top}>
        <button onClick={onEsci} style={ui.back}>←</button>
        <div style={S.badges}>
          <div style={S.badge}><span style={S.moneta}>🪙</span><span style={S.conta}>{gettoni === null ? "…" : gettoni}</span></div>
          <div style={S.badge}><span style={S.livLbl}>Livello</span><span style={S.livVal}>{livelloMax === null ? "…" : livelloMax}</span></div>
        </div>
      </div>
      <h1 style={ui.title}>Matematica</h1>
      {pronto
        ? <Esercizio livello={corrente} livelloMax={livelloMax} onPremio={premia} onCorrente={onCorrente} onNuovoMax={onNuovoMax} onTentativo={registraTentativo} />
        : <p style={{ color: "rgba(255,255,255,0.85)", textAlign: "center" }}>Un attimo…</p>}
    </Sfondo>
  );
}

/* --- Il cuore dell'esercizio (logica invariata) --- */
function Esercizio({ livello, livelloMax, onPremio, onCorrente, onNuovoMax, onTentativo }) {
  const [dom, setDom] = useState(() => nuovaDomanda(maxFor(livello)));
  const [risp, setRisp] = useState("");
  const [stato, setStato] = useState("gioca");
  const [giusti, setGiusti] = useState(0);
  const [sbagliati, setSbagliati] = useState(0);
  const [celebra, setCelebra] = useState(null);
  const erratiSuQuesta = useRef(0);

  const digita = (d) => {
    if (stato !== "gioca" || risp.length >= 3) return;
    setRisp((r) => r + d);
  };
  const cancella = () => stato === "gioca" && setRisp((r) => r.slice(0, -1));

  const conferma = () => {
    if (stato !== "gioca" || risp === "") return;
    if (parseInt(risp, 10) === dom.ris) {
      onTentativo?.(erratiSuQuesta.current === 0);
      erratiSuQuesta.current = 0;
      onPremio?.(1);
      setStato("giusto");
      const g = giusti + 1;
      setTimeout(() => {
        setSbagliati(0);
        if (g >= 10) {
          const nuovo = Math.min(LIV_MAX, livello + 1);
          setGiusti(0);
          if (nuovo > livelloMax) {
            onNuovoMax?.(nuovo);
            onPremio?.(5);
            setCelebra(nuovo);
          } else {
            if (nuovo !== livello) onCorrente?.(nuovo);
            setDom(nuovaDomanda(maxFor(nuovo)));
            setRisp(""); setStato("gioca");
          }
        } else {
          setGiusti(g);
          setDom(nuovaDomanda(maxFor(livello)));
          setRisp(""); setStato("gioca");
        }
      }, 1300);
    } else {
      erratiSuQuesta.current += 1;
      setStato("sbagliato");
      const s = sbagliati + 1;
      setTimeout(() => {
        setGiusti(0);
        if (s >= 10) {
          const nuovo = Math.max(LIV_MIN, livello - 1);
          setSbagliati(0);
          if (nuovo !== livello) onCorrente?.(nuovo);
          setDom(nuovaDomanda(maxFor(nuovo)));
        } else {
          setSbagliati(s);
          setDom(nuovaDomanda(maxFor(livello)));
        }
        setRisp(""); setStato("gioca");
      }, 1200);
    }
  };

  const continua = () => {
    setCelebra(null);
    setDom(nuovaDomanda(maxFor(livello)));
    setRisp(""); setStato("gioca");
  };

  if (celebra !== null) {
    return (
      <div style={S.card}>
        <div style={{ fontSize: 60 }}>🌟</div>
        <h2 style={S.titolo}>Livello {celebra}!</h2>
        <p style={S.sub}>Un nuovo traguardo! <b>+5 gettoni</b> 🪙</p>
        <button onClick={continua} style={S.primario}>Continua!</button>
      </div>
    );
  }

  const bordo = stato === "giusto" ? "#5BBE7A" : stato === "sbagliato" ? "#E57373" : "#EFC873";

  return (
    <div style={S.card}>
      <div style={S.equazione}>
        <span style={{ color: COLORI.a }}>{dom.a}</span>
        <span style={{ color: COLORI.op }}>{dom.op}</span>
        <span style={{ color: COLORI.b }}>{dom.b}</span>
        <span style={{ color: "#999" }}>=</span>
        <span style={{ ...S.risposta, borderColor: bordo, color: COLORI.ris }}>
          {stato === "giusto" ? dom.ris : (risp || "?")}
        </span>
      </div>
      <div style={S.feedback}>
        {stato === "giusto" && <span style={{ color: "#3Fae63" }}>Giusto! +1 🪙</span>}
        {stato === "sbagliato" && <span style={{ color: "#D98A1E" }}>Riprova! 💪</span>}
        {stato === "gioca" && <span style={{ color: "transparent" }}>.</span>}
      </div>
      <div style={S.tastierino}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} onClick={() => digita(String(n))} style={S.tasto}>{n}</button>
        ))}
        <button onClick={cancella} style={{ ...S.tasto, ...S.tastoAz }}>⌫</button>
        <button onClick={() => digita("0")} style={S.tasto}>0</button>
        <button onClick={conferma} style={{ ...S.tasto, ...S.tastoOk }}>✓</button>
      </div>
    </div>
  );
}

const S = {
  badges: { display: "flex", gap: 8 },
  badge: { display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.9)", borderRadius: 20, padding: "8px 14px" },
  moneta: { fontSize: 22 },
  conta: { fontSize: 20, fontWeight: 800, color: "#B8860B" },
  livLbl: { fontSize: 11, textTransform: "uppercase", color: "#9a917f", fontWeight: 700, letterSpacing: ".05em" },
  livVal: { fontSize: 20, fontWeight: 800, color: "#8A5A16" },
  card: { background: "#fff", borderRadius: 26, padding: "24px 20px", maxWidth: 360, margin: "0 auto", textAlign: "center", boxShadow: "0 12px 34px -14px rgba(0,0,0,.5)" },
  titolo: { margin: "6px 0", fontSize: 28, color: "#8A5A16" },
  sub: { color: "#6d665a", fontSize: 16, marginBottom: 18 },
  equazione: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 50, fontWeight: 800, marginBottom: 6, flexWrap: "wrap" },
  risposta: { minWidth: 72, height: 64, padding: "0 8px", border: "3px solid", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#FAF7F0" },
  feedback: { height: 40, fontSize: 30, fontWeight: 800, margin: "6px 0 14px", display: "flex", alignItems: "center", justifyContent: "center" },
  tastierino: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  tasto: { height: 60, borderRadius: 14, border: "none", cursor: "pointer", fontSize: 26, fontWeight: 800, color: "#3B352A", background: "#F0EBE1", boxShadow: "0 3px 0 #DcD3C2" },
  tastoAz: { background: "#F3D9D9", color: "#C0574F" },
  tastoOk: { background: "linear-gradient(145deg,#7ED09A,#5BBE7A)", color: "#fff" },
  primario: { background: "linear-gradient(145deg,#E8A13C,#D98A1E)", color: "#fff", border: "none", borderRadius: 14, padding: "13px 28px", fontSize: 18, fontWeight: 700, cursor: "pointer" },
};