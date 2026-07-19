import { useState, useEffect } from "react";
import { useUserProfile } from "../hooks/useUserProfile";
import { leggiLivelliSeq, salvaLivelloSeq, salvaLivelloSeqMax } from "./livelliSeq";
import Sfondo, { ui } from "./Sfondo";

/* =========================================================================
   COSA VIENE DOPO? — sequenze e pattern (logica, niente aritmetica).
   Generatore procedurale: i pattern non sono scritti a mano, si creano da
   pool di elementi → varietà infinita nel tempo.

   Livelli:
     1 ciclico 2 elementi      A-B-A-B-?
     2 ciclico 3 elementi      A-B-C-A-B-C-?
     3 ciclico 2 variabili     forma E colore cambiano insieme
     4 seriazione              piccolo-medio-grande (crescente/decrescente)
     5 sequenze numeriche      2-4-6-?  (+2, +3, +5, +10)

   Autocorrezione: la scelta giusta si aggancia; quella sbagliata tremola e
   torna al suo posto. Nessun "sbagliato", nessun suono negativo, nessun
   punteggio, nessun timer. Contatore neutro delle sequenze completate.
   ========================================================================= */

const LIV_MIN = 1, LIV_MAX = 5;
const scegli = (a) => a[Math.floor(Math.random() * a.length)];
const mescola = (arr) => { const a = arr.slice(); for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };

/* --- Pool di elementi --- */
const CERCHI  = ["🔴","🟠","🟡","🟢","🔵","🟣"];
const QUADRI  = ["🟥","🟧","🟨","🟩","🟦","🟪"];
const CUORI   = ["❤️","🧡","💛","💚","💙","💜"];
const OGGETTI = ["🍎","🍌","🍇","🌸","🌟","🐱","🐶","🐸","🚗","⚽","🌙","☀️"];

/* Un "elemento" = { key, emoji, scala }  — scala serve alla seriazione. */
const el = (emoji, scala = 1) => ({ key: `${emoji}-${scala}`, emoji, scala });

/* --- Generatori per livello --- */
function genCiclico(nDiversi) {
  const pool = mescola(scegli([CERCHI, QUADRI, OGGETTI, CUORI])).slice(0, nDiversi);
  const base = pool.map((e) => el(e));
  const lung = nDiversi === 2 ? 6 : 6;                  // 6 posizioni + incognita
  const seq = Array.from({ length: lung }, (_, i) => base[i % nDiversi]);
  const giusta = base[lung % nDiversi];
  const distr = base.filter((b) => b.key !== giusta.key);
  return { seq, giusta, distr };
}

function genDueVariabili() {
  // forma E colore cambiano insieme: alterno due famiglie mantenendo l'indice
  const A = mescola(CERCHI).slice(0, 3);
  const B = mescola(QUADRI).slice(0, 3);
  const base = [el(A[0]), el(B[1]), el(A[2])];          // ciclo di 3 misti
  const seq = Array.from({ length: 6 }, (_, i) => base[i % 3]);
  const giusta = base[6 % 3];
  const distr = [el(B[0]), el(A[1]), el(B[2])].filter((d) => d.key !== giusta.key);
  return { seq, giusta, distr };
}

function genSeriazione() {
  const e = scegli(OGGETTI);
  const scale = [0.55, 0.8, 1.05, 1.3, 1.55];
  const cresc = Math.random() < 0.5;
  const ordine = cresc ? scale : scale.slice().reverse();
  const seq = ordine.slice(0, 4).map((s) => el(e, s));
  const giusta = el(e, ordine[4]);
  const distr = [el(e, ordine[0]), el(e, ordine[2]), el(e, cresc ? 0.4 : 1.7)]
    .filter((d) => d.key !== giusta.key);
  return { seq, giusta, distr };
}

function genNumerica() {
  const passo = scegli([2, 3, 5, 10]);
  const start = passo * (1 + Math.floor(Math.random() * 3));
  const seq = [0,1,2,3].map((i) => el(String(start + i * passo)));
  const attesa = start + 4 * passo;
  const giusta = el(String(attesa));
  const distr = [el(String(attesa + passo)), el(String(attesa - 1)), el(String(attesa + 1))];
  return { seq, giusta, distr };
}

function generaPattern(livello) {
  if (livello <= 1) return genCiclico(2);
  if (livello === 2) return genCiclico(3);
  if (livello === 3) return genDueVariabili();
  if (livello === 4) return genSeriazione();
  return genNumerica();
}

function nuovoEsercizio(livello) {
  const { seq, giusta, distr } = generaPattern(livello);
  const opzioni = mescola([giusta, ...distr.slice(0, 3)]);
  return { seq, giusta, opzioni };
}

export default function Sequenze({ onEsci }) {
  const { profileId, loading } = useUserProfile();
  const player = profileId || "guest";

  const [corrente, setCorrente] = useState(null);
  const [livelloMax, setLivelloMax] = useState(null);

  useEffect(() => {
    if (loading) return;
    leggiLivelliSeq(player)
      .then(({ livello, livelloMax }) => { setCorrente(livello); setLivelloMax(livelloMax); })
      .catch((e) => { console.error(e); setCorrente(1); setLivelloMax(1); });
  }, [loading, player]);

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
        ? <Esercizio livello={corrente} livelloMax={livelloMax} onCorrente={onCorrente} onNuovoMax={onNuovoMax} />
        : <p style={{ color: "rgba(255,255,255,0.85)", textAlign: "center" }}>Un attimo…</p>}
    </Sfondo>
  );
}

function Esercizio({ livello, livelloMax, onCorrente, onNuovoMax }) {
  const [ex, setEx] = useState(() => nuovoEsercizio(livello));
  const [risolto, setRisolto] = useState(false);
  const [shakeKey, setShakeKey] = useState(null);
  const [giuste, setGiuste] = useState(0);
  const [mancate, setMancate] = useState(0);
  const [celebra, setCelebra] = useState(null);
  const [fatte, setFatte] = useState(0);

  const scegliOpzione = (o) => {
    if (risolto) return;
    if (o.key === ex.giusta.key) {
      setRisolto(true);
      setFatte((f) => f + 1);
      setMancate(0);
      const g = giuste + 1;
      setTimeout(() => {
        if (g >= 10) {
          const nuovo = Math.min(LIV_MAX, livello + 1);
          setGiuste(0);
          if (nuovo > livelloMax) { onNuovoMax(nuovo); setCelebra(nuovo); return; }
          if (nuovo !== livello) onCorrente(nuovo);
          setEx(nuovoEsercizio(nuovo)); setRisolto(false);
        } else {
          setGiuste(g);
          setEx(nuovoEsercizio(livello)); setRisolto(false);
        }
      }, 1100);
    } else {
      setShakeKey(o.key);
      setTimeout(() => setShakeKey(null), 450);
      const m = mancate + 1;
      setGiuste(0);
      if (m >= 10) {                                   // discesa silenziosa
        const nuovo = Math.max(LIV_MIN, livello - 1);
        setMancate(0);
        if (nuovo !== livello) { onCorrente(nuovo); setEx(nuovoEsercizio(nuovo)); }
      } else setMancate(m);
    }
  };

  const continua = () => {
    setCelebra(null);
    setEx(nuovoEsercizio(livello));
    setRisolto(false);
  };

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