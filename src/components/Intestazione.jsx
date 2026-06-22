import { useNavigate } from "react-router-dom"

function Intestazione({ titolo }) {
  const navigate = useNavigate()

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      marginBottom: 24
    }}>
      <button onClick={() => navigate("/")} style={{
        background: "none", border: "none",
        cursor: "pointer", fontSize: 22,
        color: "#2d7a4f", padding: "4px 8px",
        borderRadius: 8
      }}>
        ←
      </button>
      {titolo && <h2 style={{ fontWeight: 400, color: "#999", margin: 0 }}>{titolo}</h2>}
    </div>
  )
}

export default Intestazione
