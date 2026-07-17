/* Sfondo condiviso della zona Compiti (foto sfocata) + stili comuni di
   intestazione. Un posto solo: cambio qui, cambiano tutte le schermate. */

export default function Sfondo({ children }) {
  return (
    <div style={S.bg}>
      <div style={S.blur} />
      <div style={S.fg}>{children}</div>
    </div>
  );
}

export const ui = {
  top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  back: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, fontSize: 26, width: 46, height: 46, cursor: "pointer", color: "#8A5A16" },
  title: { color: "#fff", fontSize: 30, fontWeight: 700, margin: "4px 0 18px", textAlign: "center" },
};

const S = {
  bg: { minHeight: "100dvh", backgroundImage: "url('/famiglia.jpg')", backgroundSize: "cover", backgroundPosition: "center", position: "relative", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  blur: { position: "absolute", inset: 0, backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" },
  fg: { position: "relative", zIndex: 1, maxWidth: 460, margin: "0 auto", padding: "20px 16px" },
};