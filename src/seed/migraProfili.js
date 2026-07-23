// migraProfili.js
// Da lanciare UNA VOLTA. Prepara Firestore per i due profili:
//  - copia nutri_piano/attuale  ->  nutri_piano/fil  e  nutri_piano/vale (clone)
//  - copia nutri_piano/config   ->  nutri_config/fil
//  - rinomina nutri_diario/{data} -> nutri_diario/fil_{data}
//  - marca le sessioni sport esistenti come profilo "fil"
// Idempotente: rilanciarlo non crea doppioni.
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import piano from "./nutriPiano.json";

export async function migraProfili() {
  console.log("Migrazione profili avviata…");

  // 1) piano per i due profili (Vale = clone, cambierà a settembre dopo la sua visita)
  const b1 = writeBatch(db);
  b1.set(doc(db, "nutri_piano", "fil"), piano);
  b1.set(doc(db, "nutri_piano", "vale"), piano);
  await b1.commit();
  console.log("  piano scritto per fil e vale");

  // 2) alimenti nascosti: dal vecchio doc condiviso al config di Fil
  const cfg = await getDoc(doc(db, "nutri_piano", "config"));
  if (cfg.exists()) {
    await setDoc(doc(db, "nutri_config", "fil"), { nascosti: cfg.data().nascosti || [] }, { merge: true });
    console.log("  alimenti nascosti trasferiti a nutri_config/fil");
  }

  // 3) diario: i documenti con id "AAAA-MM-GG" sono di Fil -> "fil_AAAA-MM-GG"
  const snap = await getDocs(collection(db, "nutri_diario"));
  let n = 0;
  const b2 = writeBatch(db);
  snap.forEach((d) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d.id)) {
      b2.set(doc(db, "nutri_diario", `fil_${d.id}`), { ...d.data(), profilo: "fil", data: d.id });
      n++;
    }
  });
  if (n) await b2.commit();
  console.log(`  ${n} giornate di diario spostate su fil_`);

  // 4) sessioni sport storiche: sono tutte di Fil
  const sp = await getDocs(collection(db, "sport_log"));
  const docs = [];
  sp.forEach((d) => { if (!d.data().profilo) docs.push(d.id); });
  for (let i = 0; i < docs.length; i += 400) {
    const b = writeBatch(db);
    docs.slice(i, i + 400).forEach((id) => b.set(doc(db, "sport_log", id), { profilo: "fil" }, { merge: true }));
    await b.commit();
  }
  console.log(`  ${docs.length} sessioni sport marcate come fil`);

  console.log("✅ Migrazione completata. I vecchi documenti non sono stati cancellati: controlla che tutto ci sia, poi puoi eliminarli a mano.");
}
