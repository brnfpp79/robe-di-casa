import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";

/* Accesso Firestore ai punteggi. Ordinamento lato client (niente indici). */

export async function salvaPunteggio({ game, variant, player, name, value }) {
  return addDoc(collection(db, "scores"), {
    game,
    variant: variant || null,   // livello di difficoltà, se il gioco ne ha
    player,
    name,
    value,
    createdAt: serverTimestamp(),
  });
}

export async function leggiPunteggi(game) {
  const base = collection(db, "scores");
  const q = game ? query(base, where("game", "==", game)) : base;
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}