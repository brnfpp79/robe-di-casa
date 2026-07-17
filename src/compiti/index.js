import Matematica from "./Matematica";
import CostruisciParola from "./CostruisciParola";

/* =========================================================================
   REGISTRO ESERCIZI (zona Compiti)
   Aggiungere un esercizio = un file + una riga qui. Come per i giochi.
   Ogni esercizio è autonomo: gestisce da sé il proprio (eventuale) premio.
   Props che riceve: onEsci()  → torna al launcher dei compiti.
   ========================================================================= */
export const ESERCIZI = [
  { id: "matematica", nome: "Matematica",          emoji: "🔢", componente: Matematica },
  { id: "parola",     nome: "Costruisci la Parola", emoji: "🔤", componente: CostruisciParola },
];

export const esercizioById = (id) => ESERCIZI.find((e) => e.id === id);