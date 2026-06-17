import { useNavigate } from "react-router-dom"

function Home() {
  const navigate = useNavigate()

  return (
    <div onClick={() => navigate("/lista")} style={{
      width: "100%",
      height: "100vh",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden"
    }}>
      <img
        src="/famiglia.jpg"
        alt="famiglia"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top"
        }}
      />
      <div style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        textAlign: "center",
        color: "white",
        fontSize: 14,
        letterSpacing: 2,
        textTransform: "uppercase",
        opacity: 0.8
      }}>
        tocca per entrare
      </div>
    </div>
  )
}

export default Home