import { useNavigate, useSearchParams } from "react-router-dom";

/* Pagina segnaposto temporanea per le stanze non ancora costruite
   (giochi, compiti, risparmi). La sostituiremo una alla volta. */
export default function Placeholder({ nome }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const scope = params.get("scope"); // valorizzato solo per i risparmi

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#F3EFE6", color: "#23201b", padding: 24, textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>{nome}</h1>
        <p style={{ color: "#9a917f", marginBottom: 4 }}>Questa stanza è in costruzione 🚧</p>
        {scope && <p style={{ color: "#9a917f", fontSize: 14 }}>cassetto: <b>{scope}</b></p>}
        <button
          onClick={() => navigate("/")}
          style={{ marginTop: 20, padding: "10px 18px", borderRadius: 10, border: "none", background: "#23201b", color: "#f3efe6", fontSize: 15, cursor: "pointer" }}
        >
          ← Torna alla home
        </button>
      </div>
    </div>
  );
}