import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserProfile";
import { GIOCHI, giocoById } from "../giochi";
import { salvaPunteggio, leggiPunteggi } from "../giochi/scores";

/* Nomi di default dal profilo (modificabili in fase di salvataggio). */
const NOMI = { family: "Famiglia", fil: "Fil", vale: "Vale", richi: "Riccardo" };

export default function Giochi() {
  const navigate = useNavigate();
  const { profileId } = useUserProfile();
  const player = profileId || "guest";
  const nomeDefault = NOMI[profileId] || "Ospite";

  const [giocoId, setGiocoId] = useState(null);   // gioco in corso
  const [istanza, setIstanza] = useState(0);      // per "gioca ancora" (rimonta)
  const [risultato, setRisultato] = useState(null); // { value } a fine partita
  const [nome, setNome] = useState(nomeDefault);
  const [salvato, setSalvato] = useState(false);
  const [vistaClassifiche, setVistaClassifiche] = useState(false);

  const gioco = giocoId ? giocoById(giocoId) : null;

  const avvia = (id) => {
    setGiocoId(id); setIstanza((n) => n + 1);
    setRisultato(null); setSalvato(false); setNome(nomeDefault);
  };
  const tornaAiGiochi = () => {
    setGiocoId(null); setRisultato(null); setSalvato(false);
  };
  const finePartita = (value) => setRisultato({ value });

  const salva = async () => {
    try {
      await salvaPunteggio({ game: giocoId, player, name: (nome || nomeDefault).trim(), value: risultato.value });
      setSalvato(true);
    } catch (e) {
      console.error("Salvataggio punteggio fallito:", e);
      alert("Non sono riuscito a salvare il punteggio. Riprova.");
    }
  };

  // --- Schermata: classifiche ---
  if (vistaClassifiche) {
    return <Classifiche onIndietro={() => setVistaClassifiche(false)} />;
  }

  // --- Schermata: gioco in corso ---
  if (gioco) {
    const Componente = gioco.componente;
    return (
      <div style={S.bg}>
        <div style={S.blur} />
        <div style={S.fg}>
          <Componente key={istanza} onFine={finePartita} onEsci={tornaAiGiochi} />
        </div>

        {risultato && (
          <div style={S.overlay}>
            <div style={S.card}>
              <div style={S.mascotte}>🦊🎉</div>
              <h2 style={S.bravo}>Bravo!</h2>
              <p style={S.sub}>
                {gioco.nome}: <b>{risultato.value}</b> {gioco.unit}
              </p>

              {!salvato ? (
                <>
                  <label style={S.label}>Salvo con che nome?</label>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    maxLength={14}
                    style={S.input}
                  />
                  <button onClick={salva} style={S.primario}>Salva punteggio</button>
                  <button onClick={() => avvia(giocoId)} style={S.secondario}>Non salvare, rigioca</button>
                </>
              ) : (
                <>
                  <p style={S.salvato}>Punteggio salvato! 🏆</p>
                  <button onClick={() => avvia(giocoId)} style={S.primario}>Gioca ancora</button>
                  <button onClick={tornaAiGiochi} style={S.secondario}>Torna ai giochi</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Schermata: griglia giochi ---
  return (
    <div style={S.bg}>
      <div style={S.blur} />
      <div style={S.fg}>
        <div style={S.top}>
          <button onClick={() => navigate("/")} style={S.back}>←</button>
          <button onClick={() => setVistaClassifiche(true)} style={S.trofeo}>🏆 Classifiche</button>
        </div>
        <h1 style={S.titolo}>Giochi</h1>
        <div style={S.griglia}>
          {GIOCHI.map((g) => (
            <button key={g.id} onClick={() => avvia(g.id)} style={S.tile}>
              <span style={S.emoji}>{g.emoji}</span>
              <span style={S.nomeGioco}>{g.nome}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   CLASSIFICHE — per gioco + generale (a punti-classifica)
   ========================================================================= */
function Classifiche({ onIndietro }) {
  const [tutti, setTutti] = useState(null);
  const [tab, setTab] = useState("generale");

  useEffect(() => {
    leggiPunteggi().then(setTutti).catch((e) => { console.error(e); setTutti([]); });
  }, []);

  if (tutti === null) return <Sfondo><p style={{ color: "#fff", textAlign: "center" }}>Carico…</p></Sfondo>;

  return (
    <Sfondo>
      <div style={S.top}>
        <button onClick={onIndietro} style={S.back}>←</button>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Classifiche</span>
        <span style={{ width: 46 }} />
      </div>

      <div style={S.tabs}>
        <button onClick={() => setTab("generale")} style={tabStyle(tab === "generale")}>Generale</button>
        {GIOCHI.map((g) => (
          <button key={g.id} onClick={() => setTab(g.id)} style={tabStyle(tab === g.id)}>{g.nome}</button>
        ))}
      </div>

      {tab === "generale"
        ? <ListaGenerale tutti={tutti} />
        : <ListaGioco tutti={tutti} gioco={giocoById(tab)} />}
    </Sfondo>
  );
}

// Classifica di un singolo gioco: top 8 nel verso giusto.
function ListaGioco({ tutti, gioco }) {
  const righe = tutti
    .filter((s) => s.game === gioco.id)
    .sort((a, b) => (gioco.higherIsBetter ? b.value - a.value : a.value - b.value))
    .slice(0, 8);

  if (righe.length === 0) return <Vuoto testo="Ancora nessun punteggio. Gioca tu il primo!" />;
  return (
    <div style={S.lista}>
      {righe.map((r, i) => (
        <div key={r.id} style={S.riga}>
          <span style={S.pos}>{i + 1}</span>
          <span style={S.nome}>{r.name}</span>
          <span style={S.val}>{r.value} {gioco.unit}</span>
        </div>
      ))}
    </div>
  );
}

// Generale: per ogni gioco assegno punti-classifica al miglior risultato di
// ciascun giocatore, poi sommo. 1°=10, 2°=6, 3°=4, 4°=3.
function ListaGenerale({ tutti }) {
  const PUNTI = [10, 6, 4, 3];
  const totali = {}; // player -> { name, punti }

  for (const gioco of GIOCHI) {
    const perGioco = tutti.filter((s) => s.game === gioco.id);
    // miglior punteggio per giocatore
    const best = {};
    for (const s of perGioco) {
      const c = best[s.player];
      const meglio = !c || (gioco.higherIsBetter ? s.value > c.value : s.value < c.value);
      if (meglio) best[s.player] = s;
    }
    // ordino i migliori e assegno i punti
    const ordinati = Object.values(best).sort((a, b) =>
      gioco.higherIsBetter ? b.value - a.value : a.value - b.value
    );
    ordinati.forEach((s, i) => {
      const p = PUNTI[i] || 1;
      if (!totali[s.player]) totali[s.player] = { name: s.name, punti: 0 };
      totali[s.player].punti += p;
      totali[s.player].name = s.name;
    });
  }

  const righe = Object.values(totali).sort((a, b) => b.punti - a.punti);
  if (righe.length === 0) return <Vuoto testo="Nessun punteggio ancora. La sfida comincia con la prima partita!" />;
  return (
    <div style={S.lista}>
      {righe.map((r, i) => (
        <div key={i} style={S.riga}>
          <span style={S.pos}>{i + 1}</span>
          <span style={S.nome}>{r.name}</span>
          <span style={S.val}>{r.punti} pt</span>
        </div>
      ))}
    </div>
  );
}

function Vuoto({ testo }) {
  return <p style={{ color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 30 }}>{testo}</p>;
}
function Sfondo({ children }) {
  return (
    <div style={S.bg}>
      <div style={S.blur} />
      <div style={S.fg}>{children}</div>
    </div>
  );
}
const tabStyle = (attivo) => ({
  border: "none", cursor: "pointer", padding: "8px 14px", borderRadius: 20, fontSize: 14, fontWeight: 700,
  background: attivo ? "#E8A13C" : "rgba(255,255,255,0.25)", color: attivo ? "#fff" : "rgba(255,255,255,0.9)",
});

const S = {
  bg: { minHeight: "100dvh", backgroundImage: "url('/famiglia.jpg')", backgroundSize: "cover", backgroundPosition: "center", position: "relative", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  blur: { position: "absolute", inset: 0, backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" },
  fg: { position: "relative", zIndex: 1, maxWidth: 460, margin: "0 auto", padding: "20px 16px" },
  top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  back: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, fontSize: 26, width: 46, height: 46, cursor: "pointer", color: "#8A5A16" },
  trofeo: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 20, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#8A5A16" },
  titolo: { color: "#fff", fontSize: 30, fontWeight: 700, margin: "4px 0 18px" },
  griglia: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 },
  tile: { border: "none", cursor: "pointer", borderRadius: 22, padding: "26px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "linear-gradient(145deg,#FBEFD8,#F6D79A)", boxShadow: "0 6px 14px -6px rgba(0,0,0,.4)" },
  emoji: { fontSize: 46 },
  nomeGioco: { fontSize: 18, fontWeight: 700, color: "#8A5A16" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", zIndex: 10, padding: 24 },
  card: { background: "#fff", borderRadius: 28, padding: "30px 26px", textAlign: "center", maxWidth: 340, width: "100%", boxShadow: "0 20px 50px -12px rgba(0,0,0,.5)" },
  mascotte: { fontSize: 54, marginBottom: 6 },
  bravo: { margin: "0 0 4px", fontSize: 28, color: "#8A5A16" },
  sub: { margin: "0 0 18px", color: "#6d665a", fontSize: 16 },
  label: { display: "block", fontSize: 13, color: "#9a917f", marginBottom: 6 },
  input: { width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 18, textAlign: "center", borderRadius: 12, border: "2px solid #EFC873", marginBottom: 14, fontWeight: 700, color: "#8A5A16" },
  primario: { width: "100%", background: "linear-gradient(145deg,#E8A13C,#D98A1E)", color: "#fff", border: "none", borderRadius: 14, padding: "13px", fontSize: 17, fontWeight: 700, cursor: "pointer", marginBottom: 8 },
  secondario: { width: "100%", background: "none", color: "#9a917f", border: "none", padding: "8px", fontSize: 14, cursor: "pointer" },
  salvato: { color: "#2E7D32", fontWeight: 700, margin: "0 0 16px" },
  tabs: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, justifyContent: "center" },
  lista: { display: "flex", flexDirection: "column", gap: 8 },
  riga: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.92)", borderRadius: 12, padding: "12px 16px" },
  pos: { fontWeight: 800, color: "#E8A13C", width: 24, fontSize: 17 },
  nome: { flex: 1, fontWeight: 600, color: "#3B352A" },
  val: { fontWeight: 700, color: "#8A5A16" },
};