import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserProfile";
import Fondo from "../risparmi/Fondo";
import Contanti from "../risparmi/Contanti";

/* =========================================================================
   RISPARMI — smistamento per profilo.
     richi   → i suoi contanti (il fondo università è nascosto: lo vedrà
               verso i 10-11 anni, scelta pedagogica)
     family  → sceglie fra Fondo università di Riccardo e Fondo di famiglia
     fil/vale→ il proprio fondo personale
   ========================================================================= */

const SFONDO = {
  minHeight: "100dvh", backgroundImage: "url('/famiglia.jpg')", backgroundSize: "cover",
  backgroundPosition: "center", position: "relative", fontFamily: "'Segoe UI', system-ui, sans-serif",
};
const BLUR = { position: "absolute", inset: 0, backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.42)" };
const FG   = { position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto", padding: "20px 16px" };

export default function Risparmi() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { profileId, loading } = useUserProfile();
  const [cassetto, setCassetto] = useState(null);   // per l'account famiglia

  const home = () => navigate("/");

  if (loading) return <Guscio><p style={S.info}>Un attimo…</p></Guscio>;

  // --- Riccardo: solo i suoi contanti ---
  if (profileId === "richi") {
    return <Guscio><Contanti onEsci={home} /></Guscio>;
  }

  // --- Account famiglia: due cassetti ---
  if (profileId === "family") {
    if (!cassetto) {
      return (
        <Guscio>
          <div style={S.top}>
            <button onClick={home} style={S.back}>←</button>
            <span style={{ width: 46 }} />
          </div>
          <h1 style={S.titolo}>Risparmi</h1>
          <div style={S.scelte}>
            <button onClick={() => setCassetto("uni")} style={S.scelta}>
              <span style={{ fontSize: 40 }}>🎓</span>
              <span style={S.sNome}>Fondo università</span>
              <span style={S.sSub}>di Riccardo</span>
            </button>
            <button onClick={() => setCassetto("fam")} style={S.scelta}>
              <span style={{ fontSize: 40 }}>🏡</span>
              <span style={S.sNome}>Fondo di famiglia</span>
              <span style={S.sSub}>risparmio di casa</span>
            </button>
          </div>
        </Guscio>
      );
    }
    const uni = cassetto === "uni";
    return (
      <Guscio>
        <Fondo
          scope={uni ? "richiUniversity" : "shared"}
          titolo={uni ? "Fondo università" : "Fondo di famiglia"}
          mostraScadenza={uni}
          onEsci={() => setCassetto(null)}
        />
      </Guscio>
    );
  }

  // --- Fil / Vale: il proprio fondo ---
  if (profileId === "fil" || profileId === "vale") {
    return (
      <Guscio>
        <Fondo
          scope={profileId}
          titolo={profileId === "fil" ? "I miei risparmi" : "Risparmi di Vale"}
          mostraScadenza={false}
          onEsci={home}
        />
      </Guscio>
    );
  }

  return <Guscio><p style={S.info}>Questa sezione non è disponibile.</p></Guscio>;
}

function Guscio({ children }) {
  return (
    <div style={SFONDO}>
      <div style={BLUR} />
      <div style={FG}>{children}</div>
    </div>
  );
}

const S = {
  info: { color: "rgba(255,255,255,0.9)", textAlign: "center", marginTop: 30 },
  top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  back: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, fontSize: 26, width: 46, height: 46, cursor: "pointer", color: "#1F4A46" },
  titolo: { color: "#fff", fontSize: 30, fontWeight: 700, margin: "4px 0 18px", textAlign: "center" },
  scelte: { display: "flex", flexDirection: "column", gap: 14 },
  scelta: { border: "none", cursor: "pointer", borderRadius: 20, padding: "24px 20px", background: "linear-gradient(145deg,#EDF3F1,#D7E5E1)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, boxShadow: "0 6px 14px -6px rgba(0,0,0,.4)" },
  sNome: { fontSize: 19, fontWeight: 700, color: "#1F4A46" },
  sSub: { fontSize: 13, color: "#5C7C77" },
};