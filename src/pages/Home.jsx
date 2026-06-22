import { useNavigate } from "react-router-dom"

function Home() {
  const navigate = useNavigate()

  return (
  <div onClick={() => navigate("/lista")} style={{
    width: "100vw",
    height: "100dvh",
    cursor: "pointer",
    backgroundImage: "url('/famiglia.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center top",
    position: "relative"
  }}>
    <div style={{
      position: "absolute",
      bottom: 220,
      left: 0,
      right: 0,
      textAlign: "center",
      color: "white",
      fontSize: 18,
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