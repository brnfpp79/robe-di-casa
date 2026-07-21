import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserProfile";

/* =========================================================================
   HOME / LAUNCHER — la super-home a profili (versione react-router)
   Ogni account vede le sue stanze; il tasto Risparmi apre il cassetto giusto.
   NB (minimo): nasconde i tasti, NON blinda le rotte. Il blindaggio è il
   mattone successivo.
   ========================================================================= */

const ROOM_META = {
  famiglia: { label: "Casa di famiglia", hint: "Spesa, spese, ricette", zone: "family", icon: HouseIcon, path: "/dashboard" },
  giochi:   { label: "Giochi",           hint: "Gioca e divertiti",     zone: "kid",    icon: JoystickIcon, path: "/giochi" },
  compiti:  { label: "Compiti",          hint: "I compiti di oggi",     zone: "kid",    icon: BookIcon,     path: "/compiti" },
  risparmi: { label: "Risparmi",         hint: "",                      zone: "adult",  icon: WalletIcon,   path: "/risparmi" },
  attivita: { label: "Attività di Richi", hint: "Statistiche e tempo",  zone: "adult",  icon: ChartIcon,    path: "/attivita" },
};

const PROFILES = {
  family: { name: "Famiglia",  mascot: "🏠", rooms: ["famiglia", "giochi", "compiti", "risparmi", "attivita"], savings: { scope: "shared", label: "Risparmi condivisi", hint: "Il salvadanaio di casa" } },
  fil:    { name: "Fil",       mascot: "🏠", rooms: ["famiglia", "giochi", "compiti", "risparmi", "attivita"], savings: { scope: "fil",    label: "I miei risparmi",    hint: "Solo tuoi" } },
  vale:   { name: "Vale",      mascot: "🏠", rooms: ["famiglia", "giochi", "compiti", "risparmi", "attivita"], savings: { scope: "vale",   label: "Risparmi di Vale",   hint: "Solo di Vale" } },
  richi:  { name: "Riccardo",  mascot: "🦊", rooms: ["giochi", "compiti", "risparmi"],             savings: { scope: "richi",  label: "I miei risparmi",    hint: "Il tuo salvadanaio" } },
};

const GUEST = { name: "Ospite", mascot: "🦊", rooms: ["giochi", "compiti"], savings: null };

export default function Home() {
  const navigate = useNavigate();
  const { user, profileId, loading } = useUserProfile();

  if (loading) return <Centered>Un attimo…</Centered>;
  if (!user)   return <Centered>Devi accedere per continuare.</Centered>;

  const profile = PROFILES[profileId] || GUEST;

  const tiles = profile.rooms.map((id) => {
    const meta = ROOM_META[id];
    if (id === "risparmi" && profile.savings) {
      return { ...meta, id, label: profile.savings.label, hint: profile.savings.hint, scope: profile.savings.scope };
    }
    return { ...meta, id };
  });

  const open = (tile) => {
    // Ai risparmi passo lo scope via query, così la pagina sa quale cassetto aprire.
    if (tile.id === "risparmi" && tile.scope) navigate(`${tile.path}?scope=${tile.scope}`);
    else navigate(tile.path);
  };

  return (
    <div style={S.bg}>
      <div style={S.blur} />
      <div style={{ ...S.page, position: "relative", zIndex: 1 }}>
        <div style={S.frame}>
        <header style={S.header}>
          <div style={S.mascot} aria-hidden>{profile.mascot}</div>
          <div>
            <p style={S.eyebrow}>{profileId === "richi" ? "Bentornato" : "Ciao"}</p>
            <h1 style={S.title}>{profile.name}</h1>
          </div>
        </header>

        <main style={S.grid}>
          {tiles.map((t) => (
            <RoomTile key={t.id} tile={t} onOpen={() => open(t)} />
          ))}
        </main>
      </div>
    </div>
    </div>
  );
}

function RoomTile({ tile, onOpen }) {
  const [hover, setHover] = useState(false);
  const z = ZONE[tile.zone];
  const Icon = tile.icon;
  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...S.tile, background: z.bg, borderColor: z.line, borderRadius: z.radius, boxShadow: hover ? z.shadowHover : z.shadow, transform: hover ? "translateY(-3px)" : "translateY(0)" }}
    >
      <span style={{ ...S.iconWrap, background: z.chip }}><Icon color={z.ink} /></span>
      <span style={{ ...S.tileLabel, color: z.ink }}>{tile.label}</span>
      <span style={{ ...S.tileHint, color: z.hint }}>{tile.hint}</span>
    </button>
  );
}

function Centered({ children }) {
  return <div style={{ ...S.page, alignItems: "center" }}><p style={{ color: "#9a917f" }}>{children}</p></div>;
}

function HouseIcon({ color }) { return (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></svg>); }
function JoystickIcon({ color }) { return (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="9" width="20" height="11" rx="3" /><path d="M7 13v3M5.5 14.5h3" /><circle cx="16" cy="13.5" r="1.2" /><circle cx="18.5" cy="16" r="1.2" /></svg>); }
function BookIcon({ color }) { return (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h7a2 2 0 0 1 2 2v14a1.5 1.5 0 0 0-1.5-1.5H4z" /><path d="M20 4h-7a2 2 0 0 0-2 2v14a1.5 1.5 0 0 1 1.5-1.5H20z" /></svg>); }
function WalletIcon({ color }) { return (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><circle cx="16.5" cy="14.5" r="1.1" fill={color} stroke="none" /></svg>); }
function ChartIcon({ color }) { return (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V4" /><path d="M4 20h16" /><rect x="7" y="12" width="3" height="5" /><rect x="12" y="8" width="3" height="9" /><rect x="17" y="14" width="3" height="3" /></svg>); }

const ZONE = {
  kid:    { bg: "#FBEFD8", chip: "#F6D79A", line: "#EFC873", ink: "#8A5A16", hint: "#B08A4E", radius: "26px", shadow: "0 2px 0 #EAD3A0", shadowHover: "0 10px 24px -8px rgba(200,150,40,.45)" },
  adult:  { bg: "#E4ECEA", chip: "#CBDCD8", line: "#B3C9C4", ink: "#1F4A46", hint: "#5C7C77", radius: "12px", shadow: "0 1px 0 #C9D8D4", shadowHover: "0 10px 22px -10px rgba(30,74,70,.4)" },
  family: { bg: "#ECE7DC", chip: "#DAD2C2", line: "#C9BFAC", ink: "#3B352A", hint: "#736B5B", radius: "14px", shadow: "0 1px 0 #D6CDBB", shadowHover: "0 10px 22px -10px rgba(59,53,42,.35)" },
};

const S = {
  bg: { width: "100%", minHeight: "100dvh", backgroundImage: "url('/famiglia.jpg')", backgroundSize: "cover", backgroundPosition: "center center", position: "relative" },
  blur: { position: "absolute", inset: 0, backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" },
  page: { minHeight: "100dvh", padding: "24px", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", display: "flex", justifyContent: "center" },
  frame: { width: "100%", maxWidth: 560 },
  header: { display: "flex", alignItems: "center", gap: 16, margin: "12px 0 22px" },
  mascot: { width: 60, height: 60, borderRadius: 18, background: "#fff", display: "grid", placeItems: "center", fontSize: 32, boxShadow: "0 2px 8px -3px rgba(0,0,0,.15)", flexShrink: 0 },
  eyebrow: { margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" },
  title: { margin: "2px 0 0", fontSize: 30, fontWeight: 700, letterSpacing: "-.01em", color: "#fff" },
  grid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 },
  tile: { border: "1.5px solid", cursor: "pointer", textAlign: "left", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 6, minHeight: 130, transition: "transform .15s, box-shadow .15s" },
  iconWrap: { width: 46, height: 46, borderRadius: 13, display: "grid", placeItems: "center", marginBottom: 8 },
  tileLabel: { fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" },
  tileHint: { fontSize: 13, fontWeight: 500 },
};