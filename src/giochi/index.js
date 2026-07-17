import Memory from "./Memory";
import Tetris from "./Tetris";

/* =========================================================================
   REGISTRO GIOCHI
   -------------------------------------------------------------------------
   Aggiungere un gioco = un file + una riga qui. Niente rotte, niente App.jsx.

   Campi gioco:
     unit           → "mosse", "punti"…
     higherIsBetter → true se numero alto è meglio; false se basso è meglio
     varianti       → livelli di difficoltà (opzionale). Ogni variante porta:
                        · id, label
                        · moltiplicatore → peso nella classifica generale
                        · + parametri specifici del gioco
                          (Memory: coppie | Tetris: velocita in ms)
   ========================================================================= */
export const GIOCHI = [
  {
    id: "memory",
    nome: "Memory",
    emoji: "🧠",
    unit: "mosse",
    higherIsBetter: false,
    componente: Memory,
    varianti: [
      { id: "facile",    label: "Facile",    coppie: 6,  moltiplicatore: 1 },
      { id: "medio",     label: "Medio",     coppie: 8,  moltiplicatore: 1.5 },
      { id: "difficile", label: "Difficile", coppie: 12, moltiplicatore: 2 },
    ],
  },
  {
    id: "tetris",
    nome: "Tetris",
    emoji: "🟦",
    unit: "punti",
    higherIsBetter: true,
    componente: Tetris,
    varianti: [
      { id: "facile",    label: "Facile",    velocita: 750, moltiplicatore: 1 },
      { id: "medio",     label: "Medio",     velocita: 500, moltiplicatore: 1.5 },
      { id: "difficile", label: "Difficile", velocita: 320, moltiplicatore: 2 },
    ],
  },
];

export const giocoById = (id) => GIOCHI.find((g) => g.id === id);