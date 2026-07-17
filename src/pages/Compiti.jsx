import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ESERCIZI, esercizioById } from "../compiti";
import Sfondo, { ui } from "../compiti/Sfondo";

/* =========================================================================
   COMPITI — launcher della zona. Mostra le tessere degli esercizi; scelto uno,
   lo renderizza passandogli onEsci per tornare qui. Come la stanza Giochi.
   Ogni esercizio è autonomo (gettoni, livelli, ecc. se li gestisce da sé).
   ========================================================================= */

export default function Compiti() {
  const navigate = useNavigate();
  const [eserId, setEserId] = useState(null);

  const eser = eserId ? esercizioById(eserId) : null;
  if (eser) {
    const Componente = eser.componente;
    return <Componente onEsci={() => setEserId(null)} />;
  }

  return (
    <Sfondo>
      <div style={ui.top}>
        <button onClick={() => navigate("/")} style={ui.back}>←</button>
        <span style={{ width: 46 }} />
      </div>
      <h1 style={ui.title}>Compiti</h1>
      <div style={S.griglia}>
        {ESERCIZI.map((e) => (
          <button key={e.id} onClick={() => setEserId(e.id)} style={S.tile}>
            <span style={S.emoji}>{e.emoji}</span>
            <span style={S.nome}>{e.nome}</span>
          </button>
        ))}
      </div>
    </Sfondo>
  );
}

const S = {
  griglia: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginTop: 12 },
  tile: { border: "none", cursor: "pointer", borderRadius: 22, padding: "28px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "linear-gradient(145deg,#FBEFD8,#F6D79A)", boxShadow: "0 6px 14px -6px rgba(0,0,0,.4)" },
  emoji: { fontSize: 46 },
  nome: { fontSize: 17, fontWeight: 700, color: "#8A5A16", textAlign: "center" },
};