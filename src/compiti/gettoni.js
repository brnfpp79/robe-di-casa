import { db } from "../firebase";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";

/* Stato compiti: gettoni/{player} = { count, livello, livelloMax } */

const LIVELLO_DEFAULT = 2;

export async function leggiStato(player) {
  const snap = await getDoc(doc(db, "gettoni", player));
  if (!snap.exists()) return { count: 0, livello: LIVELLO_DEFAULT, livelloMax: LIVELLO_DEFAULT, diag: {} };
  const d = snap.data();
  const livello = d.livello || LIVELLO_DEFAULT;
  return { count: d.count || 0, livello, livelloMax: d.livelloMax || livello, diag: d.diagMate || {} };
}

export async function aggiungiGettoni(player, n) {
  await setDoc(doc(db, "gettoni", player), { count: increment(n) }, { merge: true });
}

export async function salvaLivello(player, livello) {
  await setDoc(doc(db, "gettoni", player), { livello }, { merge: true });
}

export async function salvaLivelloMax(player, livelloMax) {
  await setDoc(doc(db, "gettoni", player), { livelloMax }, { merge: true });
}

/* Diagnostica matematica: { risolte, primoColpo } aggregate. Come le sequenze. */
export async function salvaDiagMate(player, diagMate) {
  await setDoc(doc(db, "gettoni", player), { diagMate }, { merge: true });
}

/* Azzera SOLO i livelli della matematica. I gettoni guadagnati restano:
   sono lavoro fatto, non un punteggio da resettare. */
export async function azzeraMatematica(player) {
  await setDoc(doc(db, "gettoni", player),
    { livello: LIVELLO_DEFAULT, livelloMax: LIVELLO_DEFAULT }, { merge: true });
}