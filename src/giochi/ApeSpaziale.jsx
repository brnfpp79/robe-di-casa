import { useRef, useEffect, useState } from "react";

/* =========================================================================
   APE SPAZIALE — sparatutto verticale ispirato a TwinBee.
   Il dito trascina l'ape, il fuoco è automatico (a sei anni due comandi
   insieme sono troppi). Le nuvole colpite liberano campanelle: colpendole
   cambiano valore (🔔 100 → ⭐ 300 → 💎 500), raccoglierle dà punti.
   Props: variante({spawn, vel}), onFine(punteggio), onEsci().
   ========================================================================= */

const W = 480, H = 680;                       // coordinate logiche del canvas

export default function ApeSpaziale({ variante, onFine, onEsci }) {
  const cvs = useRef(null);
  const box = useRef(null);
  const [hud, setHud] = useState({ punti: 0, vite: 3 });
  const finito = useRef(false);

  useEffect(() => {
    const canvas = cvs.current;
    const ctx = canvas.getContext("2d");
    const spawnBase = variante?.spawn ?? 1100;
    const velBase   = variante?.vel   ?? 1.6;

    const S = {
      ape: { x: W / 2, y: H - 110 },
      proiettili: [], nemici: [], campanelle: [], scoppi: [], bolle: [], flash: 0,
      punti: 0, vite: 3, inv: 0, t: 0, ultimoSparo: 0, ultimoNemico: 0, over: false,
    };

    /* --- input: il dito trascina l'ape --- */
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { x: (p.clientX - r.left) * (W / r.width), y: (p.clientY - r.top) * (H / r.height) };
    };
    let premuto = false;
    const giu = (e) => { premuto = true; muovi(e); e.preventDefault(); };
    const muovi = (e) => {
      if (!premuto) return;
      const { x, y } = pos(e);
      S.ape.x = Math.max(24, Math.min(W - 24, x));
      S.ape.y = Math.max(120, Math.min(H - 40, y));
      e.preventDefault();
    };
    const su = () => { premuto = false; };
    canvas.addEventListener("pointerdown", giu);
    canvas.addEventListener("pointermove", muovi);
    window.addEventListener("pointerup", su);

    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const emoji = (e, x, y, s) => { ctx.font = `${s}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(e, x, y); };

    let raf, prec = performance.now();

    const loop = (ora) => {
      const dt = Math.min(50, ora - prec); prec = ora;
      S.t += dt;
      const liv = 1 + S.t / 70000;                     // accelera piano piano

      /* spara da solo */
      if (ora - S.ultimoSparo > 330) { S.ultimoSparo = ora; S.proiettili.push({ x: S.ape.x, y: S.ape.y - 26 }); }

      /* genera nemici e nuvole */
      if (ora - S.ultimoNemico > spawnBase / liv) {
        S.ultimoNemico = ora;
        const nuvola = Math.random() < 0.25;
        S.nemici.push({
          x: 30 + Math.random() * (W - 60), y: -30, nuvola,
          v: (nuvola ? 0.7 : velBase * liv) * (0.8 + Math.random() * 0.5),
          f: Math.random() * 6.28,
        });
      }

      /* aggiorna proiettili */
      S.proiettili.forEach((p) => (p.y -= 0.62 * dt));
      S.proiettili = S.proiettili.filter((p) => p.y > -20);

      /* aggiorna nemici */
      S.nemici.forEach((n) => { n.y += n.v * dt * 0.038; n.x += Math.sin(S.t / 500 + n.f) * 0.45; });
      S.nemici = S.nemici.filter((n) => {
        if (n.y < H + 30) return true;
        if (!n.nuvola) {                       // mostro sfuggito: costa una vita
          S.vite -= 1; S.flash = 400;
          if (S.vite <= 0) S.over = true;
        }
        return false;
      });

      /* aggiorna campanelle */
      S.campanelle.forEach((c) => { c.vy += 0.0015 * dt; c.y += c.vy * dt * 0.06; c.x += c.vx * dt * 0.05; });
      S.campanelle = S.campanelle.filter((c) => c.y < H + 40);

      /* collisioni proiettile → nemico/nuvola */
      for (const p of S.proiettili) {
        for (const n of S.nemici) {
          if (n.morto) continue;
          if (dist(p, n) < 26) {
            p.fuori = true; n.morto = true;
            if (n.nuvola) S.campanelle.push({ x: n.x, y: n.y, vx: 0, vy: -0.4, liv: 0 });
            else { S.punti += 100; S.scoppi.push({ x: n.x, y: n.y, t: 0 }); }
          }
        }
        for (const c of S.campanelle) {
          if (dist(p, c) < 26 && !p.fuori) { p.fuori = true; c.vy = -0.55; c.liv = Math.min(2, c.liv + 1); }
        }
      }
      S.proiettili = S.proiettili.filter((p) => !p.fuori);
      S.nemici = S.nemici.filter((n) => !n.morto);

      /* raccolta campanelle */
      S.campanelle = S.campanelle.filter((c) => {
        if (dist(S.ape, c) < 34) {
          S.punti += [100, 300, 500][c.liv];
          for (let i = 0; i < 9; i++) S.bolle.push({
            x: c.x + (Math.random() - 0.5) * 26, y: c.y + (Math.random() - 0.5) * 20,
            r: 5 + Math.random() * 11, vx: (Math.random() - 0.5) * 0.35,
            vy: -0.18 - Math.random() * 0.22, t: 0, dur: 900 + Math.random() * 500,
          });
          return false;
        }
        return true;
      });

      /* collisione ape → nemico */
      if (S.inv > 0) S.inv -= dt;
      else for (const n of S.nemici) {
        if (!n.nuvola && dist(S.ape, n) < 30) {
          n.morto = true; S.vite -= 1; S.inv = 1500; S.flash = 400;
          S.scoppi.push({ x: S.ape.x, y: S.ape.y, t: 0 });
          if (S.vite <= 0) S.over = true;
          break;
        }
      }
      S.nemici = S.nemici.filter((n) => !n.morto);
      S.bolle.forEach((b) => { b.t += dt; b.y += b.vy * dt; b.x += b.vx * dt + Math.sin(b.t / 200) * 0.25; });
      S.bolle = S.bolle.filter((b) => b.t < b.dur);
      if (S.flash > 0) S.flash -= dt;
      S.scoppi.forEach((s) => (s.t += dt));
      S.scoppi = S.scoppi.filter((s) => s.t < 450);

      /* disegno */
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#123A5E"); g.addColorStop(1, "#2E6F9E");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,.5)";
      for (let i = 0; i < 40; i++) {
        const y = (i * 137 + S.t * 0.03) % H;
        ctx.fillRect((i * 97) % W, y, 2, 2);
      }
      ctx.strokeStyle = "rgba(255,255,255,.28)"; ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]); ctx.beginPath();
      ctx.moveTo(0, H - 26); ctx.lineTo(W, H - 26); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#FFE08A";
      S.proiettili.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 6.28); ctx.fill(); });
      S.nemici.forEach((n) => emoji(n.nuvola ? "☁️" : "👾", n.x, n.y, 42));
      S.campanelle.forEach((c) => emoji(["🔔", "⭐", "💎"][c.liv], c.x, c.y, 38));
      S.scoppi.forEach((s) => emoji("💥", s.x, s.y, 30 + s.t / 12));
      S.bolle.forEach((b) => {
        const a = 1 - b.t / b.dur;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.28);
        ctx.fillStyle = `rgba(190,235,255,${0.30 * a})`; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(255,255,255,${0.75 * a})`; ctx.stroke();
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.32, b.y - b.r * 0.34, b.r * 0.24, 0, 6.28);
        ctx.fillStyle = `rgba(255,255,255,${0.8 * a})`; ctx.fill();
      });
      if (S.inv <= 0 || Math.floor(S.t / 120) % 2 === 0) emoji("🐝", S.ape.x, S.ape.y, 46);
      if (S.flash > 0) {
        ctx.strokeStyle = `rgba(255,90,90,${Math.min(1, S.flash / 400) * 0.9})`;
        ctx.lineWidth = 10; ctx.strokeRect(5, 5, W - 10, H - 10);
      }

      setHud((h) => (h.punti === S.punti && h.vite === S.vite ? h : { punti: S.punti, vite: S.vite }));

      if (S.over) {
        if (!finito.current) { finito.current = true; onFine?.(S.punti); }
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", giu);
      canvas.removeEventListener("pointermove", muovi);
      window.removeEventListener("pointerup", su);
    };
  }, []);   // eslint-disable-line

  return (
    <div style={St.wrap} ref={box}>
      <div style={St.top}>
        <button onClick={onEsci} style={St.back}>←</button>
        <span style={St.punti}>{hud.punti}</span>
        <span style={St.vite}>{"❤️".repeat(Math.max(0, hud.vite))}</span>
      </div>
      <canvas ref={cvs} width={W} height={H} style={St.canvas} />
      <p style={St.aiuto}>Trascina l'ape · non far passare i mostri!</p>
    </div>
  );
}

const St = {
  wrap: { maxWidth: 520, margin: "0 auto", padding: "12px 10px" },
  top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  back: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, fontSize: 26, width: 46, height: 46, cursor: "pointer", color: "#8A5A16" },
  punti: { color: "#fff", fontSize: 26, fontWeight: 800, textShadow: "0 2px 6px rgba(0,0,0,.5)" },
  vite: { fontSize: 20, letterSpacing: 2 },
  canvas: { width: "100%", height: "auto", borderRadius: 18, display: "block", touchAction: "none", boxShadow: "0 10px 30px -12px rgba(0,0,0,.6)" },
  aiuto: { textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 10 },
};