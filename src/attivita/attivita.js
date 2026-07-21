import { db } from "../firebase";
import { doc, getDoc, setDoc, getDocs, collection, query, where, increment } from "firebase/firestore";

/* Attività giornaliera per profilo: attivita/{profilo}_{data}
     = { profilo, data, sezioni: { matematica: secondi, sequenze, ape, ... } }
   Il tempo è "schermata aperta": ordine di grandezza, non misura precisa.   */

const oggiISO = () => new Date().toISOString().slice(0, 10);
const docId = (profilo, data) => `${profilo}_${data}`;

// Accumula secondi su una sezione, nel documento di oggi.
export async function registraTempo(profilo, sezione, secondi) {
  if (!profilo || !secondi || secondi < 1) return;
  const id = docId(profilo, oggiISO());
  await setDoc(doc(db, "attivita", id),
    { profilo, data: oggiISO(), sezioni: { [sezione]: increment(Math.round(secondi)) } },
    { merge: true });
}

// Ultimi N giorni per un profilo (per la dashboard). Filtra per profilo,
// ordina lato client per non richiedere indici compositi.
export async function leggiStorico(profilo, giorni = 30) {
  const soglia = new Date(Date.now() - giorni * 86400000).toISOString().slice(0, 10);
  const q = query(collection(db, "attivita"), where("profilo", "==", profilo));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data())
    .filter((d) => d.data >= soglia)
    .sort((a, b) => (a.data < b.data ? 1 : -1));
}