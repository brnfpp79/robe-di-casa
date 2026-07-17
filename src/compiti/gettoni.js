import { db } from "../firebase";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";

/* Stato compiti: gettoni/{player} = { count, livello, livelloMax }
   - livello    → livello di lavoro (sale/scende, guida la difficoltà, nascosto)
   - livelloMax → massimo mai raggiunto (mostrato, non scende mai)             */

const LIVELLO_DEFAULT = 2;

export async function leggiStato(player) {
  const snap = await getDoc(doc(db, "gettoni", player));
  if (!snap.exists()) return { count: 0, livello: LIVELLO_DEFAULT, livelloMax: LIVELLO_DEFAULT };
  const d = snap.data();
  const livello = d.livello || LIVELLO_DEFAULT;
  return { count: d.count || 0, livello, livelloMax: d.livelloMax || livello };
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