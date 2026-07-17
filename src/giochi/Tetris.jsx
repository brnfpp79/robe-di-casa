import { useRef, useReducer, useEffect, useState } from "react";

/* =========================================================================
   TETRIS — 7 pezzi, rotazioni, righe, livelli di velocità, anteprima,
   game over, punteggio. Props: variante({velocita}), onFine(value), onEsci().
   Controlli: pulsanti a schermo (◀ ▶ ↻ ▼) + frecce tastiera (test desktop).
   ========================================================================= */

const W = 10, H = 18;

const PEZZI = [
  { m: [[1, 1, 1, 1]],          c: "#4DD0E1" }, // I
  { m: [[1, 1], [1, 1]],        c: "#FFD54F" }, // O
  { m: [[0, 1, 0], [1, 1, 1]],  c: "#BA68C8" }, // T
  { m: [[0, 1, 1], [1, 1, 0]],  c: "#81C784" }, // S
  { m: [[1, 1, 0], [0, 1, 1]],  c: "#E57373" }, // Z
  { m: [[1, 0, 0], [1, 1, 1]],  c: "#64B5F6" }, // J
  { m: [[0, 0, 1], [1, 1, 1]],  c: "#FFB74D" }, // L
];

const vuota = () => Array.from({ length: H }, () => Array(W).fill(0));
const pescaPezzo = () => { const p = PEZZI[Math.floor(Math.random() * PEZZI.length)]; return { m: p.m, c: p.c }; };
const centro = (m) => Math.floor((W - m[0].length) / 2);

function ruota(m) {
  const r = m.length, c = m[0].length;
  const out = Array.from({ length: c }, () => Array(r).fill(0));
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) out[j][r - 1 - i] = m[i][j];
  return out;
}
function collide(board, m, row, col) {
  for (let i = 0; i < m.length; i++)
    for (let j = 0; j < m[i].length; j++) {
      if (!m[i][j]) continue;
      const R = row + i, C = col + j;
      if (C < 0 || C >= W || R >= H) return true;
      if (R >= 0 && board[R][C]) return true;
    }
  return false;
}
function fondi(board, pezzo) {
  const b = board.map((r) => r.slice());
  const { matrix, row, col, color } = pezzo;
  for (let i = 0; i < matrix.length; i++)
    for (let j = 0; j < matrix[i].length; j++)
      if (matrix[i][j] && row + i >= 0) b[row + i][col + j] = color;
  return b;
}
function cancellaRighe(board) {
  const restano = board.filter((r) => r.some((c) => !c));
  const tolte = H - restano.length;
  const nuove = Array.from({ length: tolte }, () => Array(W).fill(0));
  return { board: [...nuove, ...restano], tolte };
}
const PUNTI_RIGHE = [0, 100, 300, 500, 800];

function statoIniziale(velocita) {
  const primo = pescaPezzo(), secondo = pescaPezzo();
  return {
    board: vuota(),
    pezzo: { matrix: primo.m, color: primo.c, row: 0, col: centro(primo.m) },
    prossimo: secondo,
    score: 0, righe: 0, livello: 0, velocita: velocita || 500, over: false,
  };
}
function bloccaEGenera(s) {
  const { board: b2, tolte } = cancellaRighe(fondi(s.board, s.pezzo));
  const righe = s.righe + tolte;
  const livello = Math.floor(righe / 10);
  const score = s.score + PUNTI_RIGHE[tolte] * (livello + 1);
  const pezzo = { matrix: s.prossimo.m, color: s.prossimo.c, row: 0, col: centro(s.prossimo.m) };
  const prossimo = pescaPezzo();
  const over = collide(b2, pezzo.matrix, pezzo.row, pezzo.col);
  return { ...s, board: b2, righe, livello, score, pezzo, prossimo, over };
}

export default function Tetris({ variante, onFine, onEsci }) {
  const st = useRef(statoIniziale(variante?.velocita));
  const [, force] = useReducer((x) => x + 1, 0);
  const overFired = useRef(false);
  const holdRef = useRef(null);

  // Dimensioni responsive: più grandi su tablet
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 400);
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const grande = vw >= 640;
  const boardW = grande ? 360 : 250;
  const prevCell = grande ? 20 : 14;
  const ctrlH = grande ? 84 : 64;
  const ctrlF = grande ? 32 : 26;
  const wrapMax = grande ? 540 : 420;

  const commit = (next) => {
    st.current = next;
    if (next.over && !overFired.current) { overFired.current = true; onFine?.(next.score); }
    force();
  };
  const scendi = () => {
    const s = st.current; if (s.over) return;
    if (!collide(s.board, s.pezzo.matrix, s.pezzo.row + 1, s.pezzo.col))
      commit({ ...s, pezzo: { ...s.pezzo, row: s.pezzo.row + 1 } });
    else commit(bloccaEGenera(s));
  };
  const muovi = (dx) => {
    const s = st.current; if (s.over) return;
    if (!collide(s.board, s.pezzo.matrix, s.pezzo.row, s.pezzo.col + dx))
      commit({ ...s, pezzo: { ...s.pezzo, col: s.pezzo.col + dx } });
  };
  const rotazione = () => {
    const s = st.current; if (s.over) return;
    const r = ruota(s.pezzo.matrix);
    for (const k of [0, -1, 1, -2, 2])
      if (!collide(s.board, r, s.pezzo.row, s.pezzo.col + k)) {
        commit({ ...s, pezzo: { ...s.pezzo, matrix: r, col: s.pezzo.col + k } });
        return;
      }
  };

  useEffect(() => {
    let id;
    const ritardo = () => Math.max(90, st.current.velocita - st.current.livello * 55);
    const loop = () => { if (st.current.over) return; scendi(); id = setTimeout(loop, ritardo()); };
    id = setTimeout(loop, ritardo());
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft") muovi(-1);
      else if (e.key === "ArrowRight") muovi(1);
      else if (e.key === "ArrowUp") rotazione();
      else if (e.key === "ArrowDown") scendi();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const inizioHold = (fn) => { fn(); holdRef.current = setInterval(fn, 110); };
  const fineHold = () => { clearInterval(holdRef.current); holdRef.current = null; };

  const s = st.current;
  const disp = s.board.map((r) => r.slice());
  if (!s.over) {
    const { matrix, row, col, color } = s.pezzo;
    for (let i = 0; i < matrix.length; i++)
      for (let j = 0; j < matrix[i].length; j++)
        if (matrix[i][j] && row + i >= 0) disp[row + i][col + j] = color;
  }
  const prevCols = s.prossimo.m[0].length; // larghezza reale del pezzo

  return (
    <div style={{ ...S.wrap, maxWidth: wrapMax }}>
      <div style={S.top}>
        <button onClick={onEsci} style={S.back}>←</button>
        <div style={S.info}>
          <div><span style={S.infoLbl}>Punti</span><span style={S.infoVal}>{s.score}</span></div>
          <div><span style={S.infoLbl}>Righe</span><span style={S.infoVal}>{s.righe}</span></div>
        </div>
      </div>

      <div style={S.centro}>
        <div style={{ ...S.board, width: boardW }}>
          {disp.flatMap((riga, i) =>
            riga.map((cella, j) => (
              <div key={`${i}-${j}`} style={{ ...S.cella, background: cella || "rgba(255,255,255,0.06)", boxShadow: cella ? "inset 0 0 0 1px rgba(0,0,0,.15)" : "none" }} />
            ))
          )}
        </div>

        <div style={S.lato}>
          <span style={S.infoLbl}>Prossimo</span>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${prevCols}, ${prevCell}px)`, gap: 2, background: "rgba(0,0,0,0.25)", padding: 6, borderRadius: 8 }}>
            {s.prossimo.m.flatMap((riga, i) =>
              riga.map((cella, j) => (
                <div key={`${i}-${j}`} style={{ width: prevCell, height: prevCell, borderRadius: 3, background: cella ? s.prossimo.c : "transparent" }} />
              ))
            )}
          </div>
        </div>
      </div>

      <div style={S.controlli}>
        <button style={{ ...S.ctrl, height: ctrlH, fontSize: ctrlF, maxWidth: grande ? 100 : 78 }} onPointerDown={() => inizioHold(() => muovi(-1))} onPointerUp={fineHold} onPointerLeave={fineHold}>◀</button>
        <button style={{ ...S.ctrl, height: ctrlH, fontSize: ctrlF, maxWidth: grande ? 100 : 78 }} onPointerDown={rotazione}>↻</button>
        <button style={{ ...S.ctrl, height: ctrlH, fontSize: ctrlF, maxWidth: grande ? 100 : 78 }} onPointerDown={() => inizioHold(scendi)} onPointerUp={fineHold} onPointerLeave={fineHold}>▼</button>
        <button style={{ ...S.ctrl, height: ctrlH, fontSize: ctrlF, maxWidth: grande ? 100 : 78 }} onPointerDown={() => inizioHold(() => muovi(1))} onPointerUp={fineHold} onPointerLeave={fineHold}>▶</button>
      </div>
    </div>
  );
}

const S = {
  wrap: { margin: "0 auto", padding: "16px 14px" },
  top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  back: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, fontSize: 26, width: 46, height: 46, cursor: "pointer", color: "#8A5A16" },
  info: { display: "flex", gap: 18 },
  infoLbl: { display: "block", fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: ".05em" },
  infoVal: { display: "block", fontSize: 22, fontWeight: 800, color: "#fff" },
  centro: { display: "flex", gap: 12, justifyContent: "center", alignItems: "flex-start" },
  board: { display: "grid", gridTemplateColumns: `repeat(${W}, 1fr)`, gap: 2, background: "rgba(0,0,0,0.35)", padding: 6, borderRadius: 10 },
  cella: { width: "100%", aspectRatio: "1", borderRadius: 3 },
  lato: { display: "flex", flexDirection: "column", gap: 6, alignItems: "center" },
  controlli: { display: "flex", gap: 10, justifyContent: "center", marginTop: 18 },
  ctrl: { flex: 1, borderRadius: 16, border: "none", cursor: "pointer", fontWeight: 800, color: "#8A5A16", background: "linear-gradient(145deg,#FBEFD8,#F6D79A)", boxShadow: "0 4px 10px -4px rgba(0,0,0,.4)", touchAction: "none", userSelect: "none" },
};