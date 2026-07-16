import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";

/* Accesso Firestore ai punteggi. Ordinamento fatto lato client, così non
   serve creare indici compositi su Firestore. */

export async function salvaPunteggio({ game, player, name, value }) {
  return addDoc(collection(db, "scores"), {
    game,
    player,
    name,
    value,
    createdAt: serverTimestamp(),
  });
}

// game opzionale: se assente, ritorna TUTTI i punteggi (per la generale).
export async function leggiPunteggi(game) {
  const base = collection(db, "scores");
  const q = game ? query(base, where("game", "==", game)) : base;
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}