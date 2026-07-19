import Matematica from "./Matematica";
import CostruisciParola from "./CostruisciParola";
import Sequenze from "./Sequenze";

/* =========================================================================
   REGISTRO ESERCIZI (zona Compiti)
   Aggiungere un esercizio = un file + una riga qui.
   Ogni esercizio è autonomo: gestisce da sé livelli, premi, persistenza.
   Props che riceve: onEsci() → torna al launcher dei compiti.
   ========================================================================= */
export const ESERCIZI = [
  { id: "matematica", nome: "Matematica",           emoji: "🔢", componente: Matematica },
  { id: "parola",     nome: "Costruisci la Parola", emoji: "🔤", componente: CostruisciParola },
  { id: "sequenze",   nome: "Cosa viene dopo?",     emoji: "🧩", componente: Sequenze },
];

export const esercizioById = (id) => ESERCIZI.find((e) => e.id === id);