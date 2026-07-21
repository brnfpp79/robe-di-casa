import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/* Tempo di gioco giornaliero, per giocatore e per gioco.
   Sta nel doc gettoni/{player} (già scrivibile da Richi): nessuna regola nuova.
     tempoGioco = { "<gameId>": { giorno: "2026-07-20", secondi: 480 } }
   Cambiando giorno il conteggio riparte da zero.

   NOTA ONESTA: è un patto interno all'app, non una serratura di sistema.
   Family Link resta il limite vero; questo è un freno in più, tarato su un
   bambino che non ha modo di aggirarlo.                                     */

const oggiISO = () => new Date().toISOString().slice(0, 10);

export async function leggiSecondiOggi(player, gameId) {
  try {
    const snap = await getDoc(doc(db, "gettoni", player));
    const t = snap.exists() ? (snap.data().tempoGioco || {})[gameId] : null;
    if (!t || t.giorno !== oggiISO()) return 0;
    return t.secondi || 0;
  } catch (e) {
    console.error("[tempoGioco] lettura fallita:", e);
    return 0;   // in caso di errore non blocchiamo il gioco
  }
}

export async function aggiungiSecondi(player, gameId, secondi) {
  if (!secondi || secondi <= 0) return;
  const ref = doc(db, "gettoni", player);
  const snap = await getDoc(ref);
  const tutti = snap.exists() ? (snap.data().tempoGioco || {}) : {};
  const prec = tutti[gameId];
  const base = prec && prec.giorno === oggiISO() ? (prec.secondi || 0) : 0;
  await setDoc(ref, { tempoGioco: { ...tutti, [gameId]: { giorno: oggiISO(), secondi: base + Math.round(secondi) } } }, { merge: true });
}

export const mmss = (sec) => {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};