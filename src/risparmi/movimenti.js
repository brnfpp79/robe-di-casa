import { db } from "../firebase";
import { collection, doc, addDoc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";

/* Movimenti: savings/{scope}/movements/{id}
   Info cassetto: savings/{scope} = { liquidita }  ← valore attuale, a mano   */

const coll = (scope) => collection(db, "savings", scope, "movements");

export async function leggiMovimenti(scope) {
  const snap = await getDocs(query(coll(scope), orderBy("data", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function aggiungiMovimento(scope, mov) {
  return addDoc(coll(scope), { ...mov, createdAt: serverTimestamp() });
}

// Solo adulti (le regole bloccano Richi).
export async function eliminaMovimento(scope, id) {
  return deleteDoc(doc(db, "savings", scope, "movements", id));
}

/* Liquidità attuale: fotografia del valore odierno, aggiornata a mano.
   NON è la somma dei versamenti: serve come ordine di grandezza. */
export async function leggiLiquidita(scope) {
  const snap = await getDoc(doc(db, "savings", scope));
  return snap.exists() ? (snap.data().liquidita || 0) : 0;
}

export async function salvaLiquidita(scope, liquidita) {
  await setDoc(doc(db, "savings", scope), { liquidita, liquiditaAgg: new Date().toISOString().slice(0, 10) }, { merge: true });
}

// Quantità di BTC posseduta (numero di bitcoin, non euro). Solo profilo Fil.
export async function leggiBtc(scope) {
  const snap = await getDoc(doc(db, "savings", scope));
  return snap.exists() ? (snap.data().btc || 0) : 0;
}
export async function salvaBtc(scope, btc) {
  await setDoc(doc(db, "savings", scope), { btc }, { merge: true });
}

export const eurDec = (n) =>
  (n || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR" });

export const euro = (n) =>
  (n || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const oggi = () => new Date().toISOString().slice(0, 10);

export const dataIt = (iso) => {
  if (!iso) return "";
  const [a, m, g] = iso.split("-");
  return `${g}/${m}/${a}`;
};