import { useNavigate } from "react-router-dom"

function Intestazione({ titolo, to = "/", onTorna }) {
  const navigate = useNavigate()

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      <button onClick={() => onTorna ? onTorna() : navigate(to)} style={{

background: "rgba(255,255,255,0.2)", border: "none",
            color: "white", padding: "6px 14px", borderRadius: 20,
            cursor: "pointer", fontSize: 20

        // background: "none", border: "none",
        //</div>cursor: "pointer", fontSize: 28,
        //color: "#2d7a4f", padding: "6px 10px", borderRadius: 8
      }}>←</button>
      {titolo && <h2 style={{ fontWeight: 400, color: "#999", margin: 0 }}>{titolo}</h2>}
    </div>
  )
}

export default Intestazione
