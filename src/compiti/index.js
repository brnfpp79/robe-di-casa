import Matematica from "./Matematica";
import CostruisciParola from "./CostruisciParola";
import Sequenze from "./Sequenze";
import { azzeraMatematica } from "./gettoni";
import { azzeraSequenze } from "./livelliSeq";

/* =========================================================================
   REGISTRO ESERCIZI (zona Compiti)
   Aggiungere un esercizio = un file + una riga qui.
   Campo opzionale `azzera(player)`: se presente, nel launcher compare il
   tasto "Azzera avanzamento" (visibile SOLO agli adulti, mai a Riccardo).
   Gli esercizi senza avanzamento persistente non lo hanno.
   ========================================================================= */
export const ESERCIZI = [
  { id: "matematica", nome: "Matematica",           emoji: "🔢", componente: Matematica,      azzera: azzeraMatematica },
  { id: "parola",     nome: "Costruisci la Parola", emoji: "🔤", componente: CostruisciParola },
  { id: "sequenze",   nome: "Cosa viene dopo?",     emoji: "🧩", componente: Sequenze,        azzera: azzeraSequenze },
];

export const esercizioById = (id) => ESERCIZI.find((e) => e.id === id);