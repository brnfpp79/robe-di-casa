import Memory from "./Memory";

/* =========================================================================
   REGISTRO GIOCHI
   -------------------------------------------------------------------------
   Per aggiungere un gioco in futuro:
     1. crei giochi/NuovoGioco.jsx  (props: onFine(value), onEsci)
     2. aggiungi una riga qui sotto
   NIENT'ALTRO. Né rotte, né modifiche a App.jsx.

   Campi:
     unit          → come si chiama il punteggio ("mosse", "punti"…)
     higherIsBetter→ true se un numero più alto è migliore (Snake); false se
                     è migliore più basso (Memory: meno mosse = meglio).
   ========================================================================= */
export const GIOCHI = [
  {
    id: "memory",
    nome: "Memory",
    emoji: "🧠",
    unit: "mosse",
    higherIsBetter: false,
    componente: Memory,
  },
  // Esempio futuro:
  // { id: "snake", nome: "Snake", emoji: "🐍", unit: "punti", higherIsBetter: true, componente: Snake },
];

export const giocoById = (id) => GIOCHI.find((g) => g.id === id);