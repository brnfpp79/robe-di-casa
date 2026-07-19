import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/* Livelli dell'esercizio Sequenze, nello stesso doc gettoni/{player} ma su
   campi PROPRI: non interferiscono con quelli della matematica.
     livelloSeq    → livello di lavoro (può scendere, invisibile)
     livelloSeqMax → massimo mai raggiunto (mostrato, non scende mai)        */

const DEFAULT = 1;

export async function leggiLivelliSeq(player) {
  const snap = await getDoc(doc(db, "gettoni", player));
  if (!snap.exists()) return { livello: DEFAULT, livelloMax: DEFAULT };
  const d = snap.data();
  const livello = d.livelloSeq || DEFAULT;
  return { livello, livelloMax: d.livelloSeqMax || livello };
}

export async function salvaLivelloSeq(player, livelloSeq) {
  await setDoc(doc(db, "gettoni", player), { livelloSeq }, { merge: true });
}

export async function salvaLivelloSeqMax(player, livelloSeqMax) {
  await setDoc(doc(db, "gettoni", player), { livelloSeqMax }, { merge: true });
}