import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/* Livelli + diagnostica Sequenze, nel doc gettoni/{player} su campi propri. */

const DEFAULT = 1;

export async function leggiLivelliSeq(player) {
  const snap = await getDoc(doc(db, "gettoni", player));
  if (!snap.exists()) return { livello: DEFAULT, livelloMax: DEFAULT, diag: {} };
  const d = snap.data();
  const livello = d.livelloSeq || DEFAULT;
  return { livello, livelloMax: d.livelloSeqMax || livello, diag: d.diagSeq || {} };
}

export async function salvaLivelloSeq(player, livelloSeq) {
  await setDoc(doc(db, "gettoni", player), { livelloSeq }, { merge: true });
}

export async function salvaLivelloSeqMax(player, livelloSeqMax) {
  await setDoc(doc(db, "gettoni", player), { livelloSeqMax }, { merge: true });
}

export async function salvaDiagSeq(player, diagSeq) {
  await setDoc(doc(db, "gettoni", player), { diagSeq }, { merge: true });
}

/* Azzera livelli E diagnostica: riparte da zero, contro-test pulito. */
export async function azzeraSequenze(player) {
  await setDoc(doc(db, "gettoni", player),
    { livelloSeq: DEFAULT, livelloSeqMax: DEFAULT, diagSeq: {} }, { merge: true });
}