import { signInWithRedirect, getRedirectResult } from "firebase/auth"
import { auth, googleProvider } from "../firebase"
import { useEffect } from "react"

function Login() {
  useEffect(() => {
    async function controllaRedirect() {
      try {
        await getRedirectResult(auth)
      } catch (error) {
        console.error("Errore redirect:", error)
      }
    }
    controllaRedirect()
  }, [])

  async function accediConGoogle() {
    try {
      await signInWithRedirect(auth, googleProvider)
    } catch (error) {
      console.error("Errore login:", error)
    }
  }

  return (
    <div style={{
      width: "100vw", height: "100dvh",
      backgroundImage: "url('/famiglia.jpg')",
      backgroundSize: "cover", backgroundPosition: "center top",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      paddingBottom: 80
    }}>
      <button onClick={accediConGoogle} style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 28px", borderRadius: 12,
        background: "white", border: "none", cursor: "pointer",
        fontSize: 16, fontWeight: 500,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
      }}>
        <img src="https://www.google.com/favicon.ico" width={20} height={20} />
        Accedi con Google
      </button>
    </div>

    
  )
}

export default Login