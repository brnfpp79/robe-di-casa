import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ESERCIZI, esercizioById } from "../compiti";
import { useUserProfile } from "../hooks/useUserProfile";
import Sfondo, { ui } from "../compiti/Sfondo";

/* =========================================================================
   COMPITI — launcher della zona.
   Sotto ogni tessera, per i SOLI adulti, un tasto per azzerare l'avanzamento
   DI RICCARDO (i dati sono i suoi: è quello che serve monitorare/resettare).
   Richi non vede mai questi tasti.
   ========================================================================= */

const TARGET = "richi";   // di chi si azzera l'avanzamento

export default function Compiti() {
  const navigate = useNavigate();
  const { profileId } = useUserProfile();
  const [eserId, setEserId] = useState(null);
  const [conferma, setConferma] = useState(null);   // esercizio in attesa di conferma
  const [fatto, setFatto] = useState(null);

  const adulto = profileId && profileId !== "richi";

  const eser = eserId ? esercizioById(eserId) : null;
  if (eser) {
    const Componente = eser.componente;
    return <Componente onEsci={() => setEserId(null)} />;
  }

  const azzera = async (e) => {
    try {
      await e.azzera(TARGET);
      setFatto(e.id);
      setTimeout(() => setFatto(null), 2500);
    } catch (err) {
      console.error("Azzeramento fallito:", err);
      alert("Non sono riuscito ad azzerare. Riprova.");
    }
    setConferma(null);
  };

  return (
    <Sfondo>
      <div style={ui.top}>
        <button onClick={() => navigate("/")} style={ui.back}>←</button>
        <span style={{ width: 46 }} />
      </div>
      <h1 style={ui.title}>Compiti</h1>

      <div style={S.griglia}>
        {ESERCIZI.map((e) => (
          <div key={e.id} style={S.colonna}>
            <button onClick={() => setEserId(e.id)} style={S.tile}>
              <span style={S.emoji}>{e.emoji}</span>
              <span style={S.nome}>{e.nome}</span>
            </button>

            {adulto && e.azzera && (
              fatto === e.id
                ? <span style={S.ok}>Azzerato ✓</span>
                : <button onClick={() => setConferma(e)} style={S.reset}>Azzera avanzamento</button>
            )}
          </div>
        ))}
      </div>

      {conferma && (
        <div style={S.overlay}>
          <div style={S.dialog}>
            <h2 style={S.dTitolo}>Azzerare l'avanzamento?</h2>
            <p style={S.dTesto}>
              <b>{conferma.nome}</b> — i livelli di Riccardo tornano all'inizio.
              {conferma.id === "matematica" && " I gettoni guadagnati restano."}
              {conferma.id === "sequenze" && " Si azzerano anche i dati di calibrazione."}
            </p>
            <button onClick={() => azzera(conferma)} style={S.dConferma}>Sì, azzera</button>
            <button onClick={() => setConferma(null)} style={S.dAnnulla}>Annulla</button>
          </div>
        </div>
      )}
    </Sfondo>
  );
}

const S = {
  griglia: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginTop: 12 },
  colonna: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  tile: { width: "100%", border: "none", cursor: "pointer", borderRadius: 22, padding: "28px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "linear-gradient(145deg,#FBEFD8,#F6D79A)", boxShadow: "0 6px 14px -6px rgba(0,0,0,.4)" },
  emoji: { fontSize: 46 },
  nome: { fontSize: 17, fontWeight: 700, color: "#8A5A16", textAlign: "center" },
  reset: { background: "rgba(255,255,255,0.75)", border: "none", borderRadius: 12, padding: "7px 12px", fontSize: 12, fontWeight: 600, color: "#8A6A4A", cursor: "pointer" },
  ok: { fontSize: 12, fontWeight: 700, color: "#5BBE7A", background: "rgba(255,255,255,0.9)", borderRadius: 12, padding: "7px 12px" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", zIndex: 20, padding: 24 },
  dialog: { background: "#fff", borderRadius: 24, padding: "26px 24px", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 50px -12px rgba(0,0,0,.5)" },
  dTitolo: { margin: "0 0 10px", fontSize: 22, color: "#8A5A16" },
  dTesto: { margin: "0 0 20px", fontSize: 15, color: "#6d665a", lineHeight: 1.5 },
  dConferma: { width: "100%", background: "linear-gradient(145deg,#E8A13C,#D98A1E)", color: "#fff", border: "none", borderRadius: 14, padding: "13px", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 8 },
  dAnnulla: { width: "100%", background: "none", border: "none", color: "#9a917f", padding: "8px", fontSize: 14, cursor: "pointer" },
};