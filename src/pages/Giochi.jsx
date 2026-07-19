import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserProfile";
import { GIOCHI, giocoById } from "../giochi";
import { salvaPunteggio, leggiPunteggi } from "../giochi/scores";

const NOMI = { family: "Famiglia", fil: "Fil", vale: "Vale", richi: "Riccardo" };
// Le tre persone mostrate nelle classifiche (una colonna ciascuna).
const PERSONE = [
  { id: "fil", nome: "Fil" },
  { id: "vale", nome: "Vale" },
  { id: "richi", nome: "Riccardo" },
];

export default function Giochi() {
  const navigate = useNavigate();
  const { profileId, loading } = useUserProfile();
  const player = profileId || "guest";
  const nomeDefault = NOMI[profileId] || "Ospite";

  const [giocoId, setGiocoId] = useState(null);
  const [variante, setVariante] = useState(null);
  const [istanza, setIstanza] = useState(0);
  const [risultato, setRisultato] = useState(null);
  const [nome, setNome] = useState(nomeDefault);
  const [salvato, setSalvato] = useState(false);
  const [vistaClassifiche, setVistaClassifiche] = useState(false);

  useEffect(() => { setNome(NOMI[profileId] || "Ospite"); }, [profileId]);
  if (loading) return null;

  const gioco = giocoId ? giocoById(giocoId) : null;

  const avvia = (id) => {
    setGiocoId(id); setVariante(null);
    setRisultato(null); setSalvato(false); setIstanza((n) => n + 1);
  };
  const scegliVariante = (v) => { setVariante(v); setIstanza((n) => n + 1); };
  const rigioca = () => { setIstanza((n) => n + 1); setRisultato(null); setSalvato(false); };
  const tornaAiGiochi = () => { setGiocoId(null); setVariante(null); setRisultato(null); setSalvato(false); };
  const finePartita = (value) => setRisultato({ value });

  const salva = async () => {
    try {
      await salvaPunteggio({ game: giocoId, variant: variante?.id, player, name: (nome || nomeDefault).trim(), value: risultato.value });
      setSalvato(true);
    } catch (e) {
      console.error("Salvataggio punteggio fallito:", e);
      alert("Non sono riuscito a salvare il punteggio. Riprova.");
    }
  };

  if (vistaClassifiche) return <Classifiche onIndietro={() => setVistaClassifiche(false)} />;

  if (gioco && gioco.varianti && !variante) {
    return (
      <Sfondo>
        <div style={S.top}>
          <button onClick={tornaAiGiochi} style={S.back}>←</button>
          <span style={{ width: 46 }} />
        </div>
        <h1 style={S.titolo}>{gioco.nome}</h1>
        <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: 18 }}>Scegli la difficoltà</p>
        <div style={S.listaDiff}>
          {gioco.varianti.map((v) => (
            <button key={v.id} onClick={() => scegliVariante(v)} style={S.diff}>
              <span style={S.diffLabel}>{v.label}</span>
              <span style={S.diffInfo}>{v.coppie ? `${v.coppie} coppie` : ""}</span>
            </button>
          ))}
        </div>
      </Sfondo>
    );
  }

  if (gioco) {
    const Componente = gioco.componente;
    return (
      <div style={S.bg}>
        <div style={S.blur} />
        <div style={S.fg}>
          <Componente key={istanza} variante={variante} onFine={finePartita} onEsci={tornaAiGiochi} />
        </div>

        {risultato && (
          <div style={S.overlay}>
            <div style={S.card}>
              <div style={S.mascotte}>🦊🎉</div>
              <h2 style={S.bravo}>Bravo!</h2>
              <p style={S.sub}>
                {gioco.nome}{variante ? ` · ${variante.label}` : ""}: <b>{risultato.value}</b> {gioco.unit}
              </p>
              {!salvato ? (
                <>
                  <label style={S.label}>Salvo con che nome?</label>
                  <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={14} style={S.input} />
                  <button onClick={salva} style={S.primario}>Salva punteggio</button>
                  <button onClick={rigioca} style={S.secondario}>Non salvare, rigioca</button>
                </>
              ) : (
                <>
                  <p style={S.salvato}>Punteggio salvato! 🏆</p>
                  <button onClick={rigioca} style={S.primario}>Gioca ancora</button>
                  <button onClick={tornaAiGiochi} style={S.secondario}>Torna ai giochi</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Sfondo>
      <div style={S.top}>
        <button onClick={() => navigate("/")} style={S.back}>←</button>
        <button onClick={() => setVistaClassifiche(true)} style={S.trofeo}>🏆 Punteggi</button>
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
    </Sfondo>
  );
}

/* ===================== PUNTEGGI (non competitivi) =====================
   Tre colonne affiancate — una persona ciascuna — con i suoi 10 migliori.
   Nessun confronto tra persone: ognuno vede la propria crescita.          */
function Classifiche({ onIndietro }) {
  const [tutti, setTutti] = useState(null);
  const [gTab, setGTab] = useState(GIOCHI[0].id);

  useEffect(() => {
    leggiPunteggi().then(setTutti).catch((e) => { console.error(e); setTutti([]); });
  }, []);

  if (tutti === null) return <Sfondo><p style={{ color: "#fff", textAlign: "center" }}>Carico…</p></Sfondo>;

  return (
    <Sfondo>
      <div style={S.top}>
        <button onClick={onIndietro} style={S.back}>←</button>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Punteggi</span>
        <span style={{ width: 46 }} />
      </div>
      <div style={S.tabs}>
        {GIOCHI.map((g) => (
          <button key={g.id} onClick={() => setGTab(g.id)} style={tabStyle(gTab === g.id)}>{g.nome}</button>
        ))}
      </div>
      <Colonne gioco={giocoById(gTab)} tutti={tutti} />
    </Sfondo>
  );
}

function Colonne({ gioco, tutti }) {
  const varianti = gioco.varianti || [{ id: null, label: gioco.nome }];
  const [vId, setVId] = useState(varianti[0].id);

  const top = (playerId) =>
    tutti
      .filter((s) => s.game === gioco.id && (vId === null || s.variant === vId) && s.player === playerId)
      .sort((a, b) => (gioco.higherIsBetter ? b.value - a.value : a.value - b.value))
      .slice(0, 10);

  return (
    <>
      {gioco.varianti && (
        <div style={S.tabs}>
          {varianti.map((v) => (
            <button key={v.id} onClick={() => setVId(v.id)} style={tabStyle(vId === v.id)}>{v.label}</button>
          ))}
        </div>
      )}
      <div style={S.colonne}>
        {PERSONE.map((p) => {
          const righe = top(p.id);
          return (
            <div key={p.id} style={S.colonna}>
              <div style={S.colTesta}>{p.nome}</div>
              {righe.length === 0
                ? <div style={S.colVuoto}>—</div>
                : righe.map((r, i) => (
                    <div key={r.id} style={{ ...S.colCella, ...(i === 0 ? S.colTop : {}) }}>{r.value}</div>
                  ))}
            </div>
          );
        })}
      </div>
      <p style={S.unitNota}>i 10 migliori · in {gioco.unit}</p>
    </>
  );
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
  fg: { position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto", padding: "20px 16px" },
  top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  back: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, fontSize: 26, width: 46, height: 46, cursor: "pointer", color: "#8A5A16" },
  trofeo: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 20, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#8A5A16" },
  titolo: { color: "#fff", fontSize: 30, fontWeight: 700, margin: "4px 0 6px" },
  griglia: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginTop: 12 },
  tile: { border: "none", cursor: "pointer", borderRadius: 22, padding: "26px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "linear-gradient(145deg,#FBEFD8,#F6D79A)", boxShadow: "0 6px 14px -6px rgba(0,0,0,.4)" },
  emoji: { fontSize: 46 },
  nomeGioco: { fontSize: 18, fontWeight: 700, color: "#8A5A16" },
  listaDiff: { display: "flex", flexDirection: "column", gap: 12 },
  diff: { border: "none", cursor: "pointer", borderRadius: 18, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(145deg,#FBEFD8,#F6D79A)", boxShadow: "0 4px 12px -6px rgba(0,0,0,.4)" },
  diffLabel: { fontSize: 20, fontWeight: 700, color: "#8A5A16" },
  diffInfo: { fontSize: 14, color: "#B08A4E" },
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
  colonne: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  colonna: { background: "rgba(255,255,255,0.9)", borderRadius: 14, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 6 },
  colTesta: { fontWeight: 800, color: "#8A5A16", textAlign: "center", fontSize: 15, paddingBottom: 6, borderBottom: "2px solid #F0E4C8" },
  colCella: { textAlign: "center", fontWeight: 600, color: "#3B352A", fontSize: 15, padding: "3px 0" },
  colTop: { color: "#B8860B", fontWeight: 800 },
  colVuoto: { textAlign: "center", color: "#c9bfac", padding: "10px 0" },
  unitNota: { textAlign: "center", color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 14 },
};