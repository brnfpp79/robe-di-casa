import Memory from "./Memory";
import Tetris from "./Tetris";
import ApeSpaziale from "./ApeSpaziale";

/* =========================================================================
   REGISTRO GIOCHI
   Aggiungere un gioco = un file + una riga qui.
   Campo opzionale `limiteGiornaliero` (in secondi): se presente, la stanza
   Giochi conta il tempo e impedisce di iniziare una nuova partita quando è
   esaurito. Non interrompe mai una partita in corso.
   ========================================================================= */
export const GIOCHI = [
  {
    id: "memory", nome: "Memory", emoji: "🧠",
    unit: "mosse", higherIsBetter: false, componente: Memory,
    varianti: [
      { id: "facile",    label: "Facile",    coppie: 6,  moltiplicatore: 1 },
      { id: "medio",     label: "Medio",     coppie: 8,  moltiplicatore: 1.5 },
      { id: "difficile", label: "Difficile", coppie: 12, moltiplicatore: 2 },
    ],
  },
  {
    id: "tetris", nome: "Tetris", emoji: "🟦",
    unit: "punti", higherIsBetter: true, componente: Tetris,
    varianti: [
      { id: "facile",    label: "Facile",    velocita: 750, moltiplicatore: 1 },
      { id: "medio",     label: "Medio",     velocita: 500, moltiplicatore: 1.5 },
      { id: "difficile", label: "Difficile", velocita: 320, moltiplicatore: 2 },
    ],
  },
  {
    id: "ape", nome: "Ape Spaziale", emoji: "🐝",
    unit: "punti", higherIsBetter: true, componente: ApeSpaziale,
    limiteGiornaliero: 15 * 60,          // ← 15 minuti al giorno
    varianti: [
      { id: "facile",    label: "Facile",    spawn: 2000, vel: 1.0, moltiplicatore: 1 },
      { id: "medio",     label: "Medio",     spawn: 1600, vel: 1.4, moltiplicatore: 1.5 },
      { id: "difficile", label: "Difficile", spawn: 1200, vel: 1.9, moltiplicatore: 2 },
    ],
  },
];

export const giocoById = (id) => GIOCHI.find((g) => g.id === id);