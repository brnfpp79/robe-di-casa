// seedFirestore.js
// Carica UNA VOLTA SOLA lo storico e il piano dentro Firestore.
// Uso: importa seedNutri in un componente, chiamalo da un bottone nascosto,
// controlla in console che sia finito, poi togli il bottone.
//
import { db } from "../firebase";
import { writeBatch, doc } from "firebase/firestore";

import alimenti from "./nutriAlimenti.json";
import sportLog from "./sportLog.json";
import piano from "./nutriPiano.json";

// Firestore consente max 500 operazioni per batch: spezziamo a 400.
async function commitInChunks(operazioni) {
  for (let i = 0; i < operazioni.length; i += 400) {
    const batch = writeBatch(db);
    for (const op of operazioni.slice(i, i + 400)) {
      batch.set(doc(db, op.coll, op.id), op.data);
    }
    await batch.commit();
    console.log(`  ...scritte ${Math.min(i + 400, operazioni.length)}/${operazioni.length}`);
  }
}

export async function seedNutri() {
  const ops = [];

  // 1) Alimenti  ->  collection "nutri_alimenti", id = food.id
  alimenti.forEach((a) => ops.push({ coll: "nutri_alimenti", id: a.id, data: a }));

  // 2) Storico allenamenti  ->  collection "sport_log", id progressivo (idempotente)
  sportLog.forEach((s, i) =>
    ops.push({ coll: "sport_log", id: `s${String(i).padStart(4, "0")}`, data: s })
  );

  console.log(`Seed avviato: ${alimenti.length} alimenti + ${sportLog.length} sessioni...`);
  await commitInChunks(ops);

  // 3) Piano alimentare  ->  documento singolo "nutri_piano/attuale"
  const batch = writeBatch(db);
  batch.set(doc(db, "nutri_piano", "attuale"), piano);
  await batch.commit();

  console.log("✅ Seed completato. Puoi rimuovere il bottone di seeding.");
}
