import { useState, useEffect, useRef } from "react";
import { useUserProfile } from "../hooks/useUserProfile";
import { leggiLivelliSeq, salvaLivelloSeq, salvaLivelloSeqMax, salvaDiagSeq } from "./livelliSeq";
import Sfondo, { ui } from "./Sfondo";

/* =========================================================================
   COSA VIENE DOPO? — sequenze e pattern (logica, niente aritmetica).
   Generatori procedurali ARRICCHITI: ogni livello ha più tipi di pattern e
   parametri variabili, così c'è profondità da esplorare prima di scalare.

   Livelli:
     1 ciclico 2 elementi   (lunghezza variabile, pool diversi)
     2 ciclico 3 elementi   (+ variante A-A-B-A-A-B)
     3 DUE VARIABILI vere   (forma periodo 2 × colore periodo 3)
     4 seriazione           (dimensione crescente/decrescente | quantità)
     5 numeriche            (passo vario, cresc/decr, raddoppio, +1 crescente)

   Diagnostica nascosta: conta i tentativi per pattern e li aggrega per
   livello su Firestore. Il bambino non vede nulla di tutto ciò.
   ========================================================================= */

const LIV_MIN = 1, LIV_MAX = 5;
const scegli = (a) => a[Math.floor(Math.random() * a.length)];
const mescola = (arr) => { const a = arr.slice(); for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const intFra = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

/* --- Pool di elementi --- */
const CERCHI  = ["🔴","🟠","🟡","🟢","🔵","🟣"];
const QUADRI  = ["🟥","🟧","🟨","🟩","🟦","🟪"];
const CUORI   = ["❤️","🧡","💛","💚","💙","💜"];
const LUNE    = ["🌑","🌓","🌕","🌗"];
const FRUTTA  = ["🍎","🍌","🍇","🍓","🍐","🍊"];
const ANIMALI = ["🐱","🐶","🐸","🐦","🐢","🐝"];
const COSE    = ["🚗","⚽","🌟","🌸","🎈","🚀"];
const POOLS   = [CERCHI, QUADRI, CUORI, FRUTTA, ANIMALI, COSE, LUNE];

/* Forme × colori per il livello 3: stesso indice colore in famiglie diverse */
const FAMIGLIE = [CERCHI, QUADRI, CUORI];

const el = (emoji, scala = 1, tag = "") => ({ key: `${emoji}|${scala}|${tag}`, emoji, scala });

/* ---------- Livello 1: ciclico a 2 elementi ---------- */
function genCiclico2() {
  const pool = mescola(scegli(POOLS));
  const base = [el(pool[0]), el(pool[1])];
  const lung = intFra(4, 7);
  const seq = Array.from({ length: lung }, (_, i) => base[i % 2]);
  const giusta = base[lung % 2];
  const distr = [base[(lung + 1) % 2], el(pool[2]), el(pool[3])];
  return { seq, giusta, distr };
}

/* ---------- Livello 2: ciclico a 3 elementi (+ variante AAB) ---------- */
function genCiclico3() {
  const pool = mescola(scegli(POOLS));
  if (Math.random() < 0.35) {                     // variante A-A-B
    const A = el(pool[0]), B = el(pool[1]);
    const motivo = [A, A, B];
    const lung = intFra(5, 8);
    const seq = Array.from({ length: lung }, (_, i) => motivo[i % 3]);
    const giusta = motivo[lung % 3];
    const distr = [giusta.key === A.key ? B : A, el(pool[2]), el(pool[3])];
    return { seq, giusta, distr };
  }
  const base = [el(pool[0]), el(pool[1]), el(pool[2])];
  const lung = intFra(5, 8);
  const seq = Array.from({ length: lung }, (_, i) => base[i % 3]);
  const giusta = base[lung % 3];
  const distr = base.filter((b) => b.key !== giusta.key).concat(el(pool[3]));
  return { seq, giusta, distr };
}

/* ---------- Livello 3: due variabili indipendenti ----------
   forma cicla ogni 2, colore cicla ogni 3 → combinazione si ripete ogni 6. */
function genDueVariabili() {
  const fam = mescola(FAMIGLIE).slice(0, 2);      // 2 forme
  const col = mescola([0,1,2,3,4,5]).slice(0, 3); // 3 colori
  const cella = (i) => el(fam[i % 2][col[i % 3]], 1, `${i % 2}-${i % 3}`);
  const lung = intFra(5, 7);
  const seq = Array.from({ length: lung }, (_, i) => cella(i));
  const giusta = cella(lung);
  const fGiusta = lung % 2, cGiusta = lung % 3;
  const distr = [
    el(fam[(fGiusta + 1) % 2][col[cGiusta]], 1, "forma-sbagliata"),
    el(fam[fGiusta][col[(cGiusta + 1) % 3]], 1, "colore-sbagliato"),
    el(fam[(fGiusta + 1) % 2][col[(cGiusta + 2) % 3]], 1, "entrambi"),
  ];
  return { seq, giusta, distr };
}

/* ---------- Livello 4: seriazione (dimensione | quantità) ---------- */
function genSeriazione() {
  const e = scegli(scegli(POOLS));
  if (Math.random() < 0.4) {                       // per quantità: 🍎, 🍎🍎, …
    const cresc = Math.random() < 0.5;
    const n = intFra(3, 4);
    const conteggi = cresc ? [1,2,3,4,5] : [5,4,3,2,1];
    const seq = conteggi.slice(0, n).map((c) => el(e.repeat(c), 1, `q${c}`));
    const attesa = conteggi[n];
    const giusta = el(e.repeat(attesa), 1, `q${attesa}`);
    const distr = [conteggi[n-1], attesa + (cresc ? 1 : -1), conteggi[0]]
      .filter((c) => c > 0 && c !== attesa)
      .map((c) => el(e.repeat(c), 1, `q${c}`));
    return { seq, giusta, distr };
  }
  const scale = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75];
  const cresc = Math.random() < 0.5;
  const ordine = cresc ? scale : scale.slice().reverse();
  const n = intFra(3, 4);
  const seq = ordine.slice(0, n).map((s) => el(e, s, `s${s}`));
  const giusta = el(e, ordine[n], `s${ordine[n]}`);
  const distr = [ordine[n-1], ordine[0], ordine[Math.min(n+1, 5)]]
    .filter((s) => s !== ordine[n])
    .map((s) => el(e, s, `s${s}`));
  return { seq, giusta, distr };
}

/* ---------- Livello 5: numeriche (passo, direzione, raddoppio) ---------- */
function genNumerica() {
  const tipo = Math.random();
  let seq = [], attesa = 0;

  if (tipo < 0.15) {                               // raddoppio
    const start = scegli([1, 2, 3]);
    const vals = [0,1,2,3].map((i) => start * 2 ** i);
    attesa = start * 2 ** 4;
    seq = vals.map((v) => el(String(v)));
  } else if (tipo < 0.5) {                         // decrescente
    const passo = scegli([2, 3, 4, 5, 10]);
    const start = passo * intFra(5, 9);
    const vals = [0,1,2,3].map((i) => start - i * passo);
    attesa = start - 4 * passo;
    seq = vals.map((v) => el(String(v)));
  } else {                                         // crescente
    const passo = scegli([2, 3, 4, 5, 10]);
    const start = intFra(1, 9);
    const vals = [0,1,2,3].map((i) => start + i * passo);
    attesa = start + 4 * passo;
    seq = vals.map((v) => el(String(v)));
  }

  const cand = new Set();
  [attesa + 1, attesa - 1, attesa + 2, attesa - 2].forEach((v) => { if (v > 0 && v !== attesa) cand.add(v); });
  const distr = mescola([...cand]).slice(0, 3).map((v) => el(String(v)));
  return { seq, giusta: el(String(attesa)), distr };
}

function generaPattern(livello) {
  if (livello <= 1) return genCiclico2();
  if (livello === 2) return genCiclico3();
  if (livello === 3) return genDueVariabili();
  if (livello === 4) return genSeriazione();
  return genNumerica();
}

function nuovoEsercizio(livello) {
  const { seq, giusta, distr } = generaPattern(livello);
  const unici = [];
  for (const d of distr) if (d.key !== giusta.key && !unici.some((u) => u.key === d.key)) unici.push(d);
  return { seq, giusta, opzioni: mescola([giusta, ...unici.slice(0, 3)]) };
}

export default function Sequenze({ onEsci }) {
  const { profileId, loading } = useUserProfile();
  const player = profileId || "guest";

  const [corrente, setCorrente] = useState(null);
  const [livelloMax, setLivelloMax] = useState(null);
  const diagRef = useRef({});
  const daSalvare = useRef(0);

  useEffect(() => {
    if (loading) return;
    leggiLivelliSeq(player)
      .then(({ livello, livelloMax, diag }) => { setCorrente(livello); setLivelloMax(livelloMax); diagRef.current = diag || {}; })
      .catch((e) => { console.error(e); setCorrente(1); setLivelloMax(1); });
  }, [loading, player]);

  // Diagnostica nascosta: aggrega per livello, salva ogni 5 pattern risolti.
  const registraTentativi = (livello, tentativi) => {
    const k = String(livello);
    const d = diagRef.current[k] || { risolti: 0, primoColpo: 0, tentativi: 0 };
    d.risolti += 1;
    d.tentativi += tentativi;
    if (tentativi === 1) d.primoColpo += 1;
    diagRef.current = { ...diagRef.current, [k]: d };
    if (++daSalvare.current >= 5) {
      daSalvare.current = 0;
      salvaDiagSeq(player, diagRef.current).catch((e) => console.error("Diagnostica non salvata:", e));
    }
  };

  const onCorrente = (liv) => {
    setCorrente(liv);
    salvaLivelloSeq(player, liv).catch((e) => console.error("Livello non salvato:", e));
  };
  const onNuovoMax = (liv) => {
    setCorrente(liv); setLivelloMax(liv);
    salvaLivelloSeq(player, liv).catch((e) => console.error("Livello non salvato:", e));
    salvaLivelloSeqMax(player, liv).catch((e) => console.error("Record non salvato:", e));
  };

  const pronto = !loading && corrente !== null;

  return (
    <Sfondo>
      <style>{`@keyframes wiggle{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
               @keyframes pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}`}</style>
      <div style={ui.top}>
        <button onClick={onEsci} style={ui.back}>←</button>
        <div style={S.badge}><span style={S.livLbl}>Livello</span><span style={S.livVal}>{livelloMax ?? "…"}</span></div>
      </div>
      <h1 style={ui.title}>Cosa viene dopo?</h1>
      {pronto
        ? <Esercizio livello={corrente} livelloMax={livelloMax} onCorrente={onCorrente} onNuovoMax={onNuovoMax} onTentativi={registraTentativi} />
        : <p style={{ color: "rgba(255,255,255,0.85)", textAlign: "center" }}>Un attimo…</p>}
    </Sfondo>
  );
}

function Esercizio({ livello, livelloMax, onCorrente, onNuovoMax, onTentativi }) {
  const [ex, setEx] = useState(() => nuovoEsercizio(livello));
  const [risolto, setRisolto] = useState(false);
  const [shakeKey, setShakeKey] = useState(null);
  const [giuste, setGiuste] = useState(0);
  const [mancate, setMancate] = useState(0);
  const [celebra, setCelebra] = useState(null);
  const [fatte, setFatte] = useState(0);
  const tentativi = useRef(0);          // tentativi sul pattern corrente

  const nuovo = (liv) => { tentativi.current = 0; setEx(nuovoEsercizio(liv)); setRisolto(false); };

  const scegliOpzione = (o) => {
    if (risolto) return;
    tentativi.current += 1;

    if (o.key === ex.giusta.key) {
      onTentativi?.(livello, tentativi.current);     // diagnostica nascosta
      setRisolto(true);
      setFatte((f) => f + 1);
      setMancate(0);
      const g = giuste + 1;
      setTimeout(() => {
        if (g >= 10) {
          const nuovoLiv = Math.min(LIV_MAX, livello + 1);
          setGiuste(0);
          if (nuovoLiv > livelloMax) { onNuovoMax(nuovoLiv); setCelebra(nuovoLiv); return; }
          if (nuovoLiv !== livello) onCorrente(nuovoLiv);
          nuovo(nuovoLiv);
        } else {
          setGiuste(g);
          nuovo(livello);
        }
      }, 1100);
    } else {
      setShakeKey(o.key);
      setTimeout(() => setShakeKey(null), 450);
      const m = mancate + 1;
      setGiuste(0);
      if (m >= 10) {
        const nuovoLiv = Math.max(LIV_MIN, livello - 1);
        setMancate(0);
        if (nuovoLiv !== livello) { onCorrente(nuovoLiv); nuovo(nuovoLiv); }
      } else setMancate(m);
    }
  };

  const continua = () => { setCelebra(null); nuovo(livello); };

  if (celebra !== null) {
    return (
      <div style={S.card}>
        <div style={{ fontSize: 60 }}>🌟</div>
        <h2 style={S.titolo}>Livello {celebra}!</h2>
        <p style={S.sub}>Hai scoperto un nuovo tipo di sequenza!</p>
        <button onClick={continua} style={S.primario}>Continua!</button>
      </div>
    );
  }

  return (
    <>
      <div style={S.card}>
        <div style={S.fila}>
          {ex.seq.map((e, i) => (
            <div key={i} style={S.cella}>
              <span style={{ fontSize: 44 * (e.scala || 1) }}>{e.emoji}</span>
            </div>
          ))}
          <div style={{ ...S.cella, ...S.incognita, borderColor: risolto ? "#5BBE7A" : "#E8A13C" }}>
            {risolto
              ? <span style={{ fontSize: 44 * (ex.giusta.scala || 1), animation: "pop .45s" }}>{ex.giusta.emoji}</span>
              : <span style={S.qm}>?</span>}
          </div>
        </div>
      </div>

      <div style={S.opzioni}>
        {ex.opzioni.map((o) => (
          <button
            key={o.key}
            onClick={() => scegliOpzione(o)}
            disabled={risolto}
            style={{ ...S.opz, animation: shakeKey === o.key ? "wiggle .4s" : "none", opacity: risolto ? 0.45 : 1 }}
          >
            <span style={{ fontSize: 44 * (o.scala || 1) }}>{o.emoji}</span>
          </button>
        ))}
      </div>

      <p style={S.contatore}>Sequenze completate: {fatte}</p>
    </>
  );
}

const S = {
  badge: { display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.9)", borderRadius: 20, padding: "8px 14px" },
  livLbl: { fontSize: 11, textTransform: "uppercase", color: "#9a917f", fontWeight: 700, letterSpacing: ".05em" },
  livVal: { fontSize: 20, fontWeight: 800, color: "#8A5A16" },
  card: { background: "#fff", borderRadius: 26, padding: "22px 14px", maxWidth: 540, margin: "0 auto", boxShadow: "0 12px 34px -14px rgba(0,0,0,.5)" },
  fila: { display: "flex", justifyContent: "center", alignItems: "center", gap: 6, flexWrap: "wrap" },
  cella: { minWidth: 58, height: 68, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#3B352A" },
  incognita: { border: "3px dashed", borderRadius: 14, background: "#FAF7F0" },
  qm: { fontSize: 38, color: "#E8A13C", fontWeight: 800 },
  opzioni: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 20 },
  opz: { minWidth: 88, height: 88, padding: "0 10px", borderRadius: 18, border: "none", cursor: "pointer", background: "linear-gradient(145deg,#FBEFD8,#F6D79A)", boxShadow: "0 4px 0 #E4C97F", fontWeight: 800, color: "#3B352A", display: "flex", alignItems: "center", justifyContent: "center" },
  contatore: { textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 18 },
  titolo: { margin: "6px 0", fontSize: 28, color: "#8A5A16", textAlign: "center" },
  sub: { color: "#6d665a", fontSize: 16, marginBottom: 18, textAlign: "center" },
  primario: { display: "block", margin: "0 auto", background: "linear-gradient(145deg,#E8A13C,#D98A1E)", color: "#fff", border: "none", borderRadius: 14, padding: "13px 28px", fontSize: 18, fontWeight: 700, cursor: "pointer" },
};