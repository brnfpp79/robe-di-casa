import { db } from "../firebase";
import { collection, doc, addDoc, getDocs, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";

/* Movimenti di un cassetto: savings/{scope}/movements/{id}
   Fondi (università, famiglia, fil, vale):
     { data, importo, categoria, valoreScadenza|null, createdAt }
   Contanti di Richi:
     { data, importo, categoria, tipo: "in"|"out", createdAt }              */

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

export const euro = (n) =>
  (n || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const oggi = () => new Date().toISOString().slice(0, 10);

export const dataIt = (iso) => {
  if (!iso) return "";
  const [a, m, g] = iso.split("-");
  return `${g}/${m}/${a}`;
};