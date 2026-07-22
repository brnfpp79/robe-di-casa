import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

/* Calcolo "giocoso" di autonomia finanziaria, a partire dalle spese reali.
   NON è pianificazione previdenziale: ignora inflazione, rendimenti nel
   tempo, pensione pubblica; usa un'unica spesa mensile piatta per sempre.
   Va trattato come un cruscotto-lampo, non come una decisione di vita.    */

const TASSE_BTC = 0.33;
const MARGINE_MENSILE = 300;   // 100 fondo università + 100 moto + 100 varie

export async function leggiMediaSpeseMensile() {
  const snap = await getDocs(collection(db, "spese"));
  const perMese = {};
  snap.docs.forEach((d) => {
    const s = d.data();
    if (!s.data || typeof s.importo !== "number") return;
    const mese = s.data.slice(0, 7);           // "YYYY-MM"
    perMese[mese] = (perMese[mese] || 0) + s.importo;
  });
  const mesi = Object.keys(perMese);
  const totale = mesi.reduce((sum, m) => sum + perMese[m], 0);
  return {
    media: mesi.length > 0 ? totale / mesi.length : 0,
    mesiConDati: mesi.length,
  };
}

export function calcolaAutonomia({ mediaSpese, liquidita, versato, btcEur, etaAttuale, etaPensione = 70 }) {
  const btcNetto = (btcEur || 0) * (1 - TASSE_BTC);
  const fondiTotali = (liquidita || 0) + (versato || 0) + btcNetto;

  // Le spese di famiglia sono condivise in due: ognuno copre solo la propria metà.
  // Il margine personale (università, moto, varie) invece non si divide: è tuo.
  const quotaSpese = mediaSpese / 2;
  const speseConMargine = quotaSpese + MARGINE_MENSILE;

  const mesiAutonomia = speseConMargine > 0 ? fondiTotali / speseConMargine : 0;
  const anniAutonomia = mesiAutonomia / 12;

  const etaUscita = etaPensione - anniAutonomia;
  const mesiMancanti = Math.max(0, Math.round((etaUscita - etaAttuale) * 12));

  return { fondiTotali, btcNetto, quotaSpese, speseConMargine, mesiAutonomia, anniAutonomia, etaUscita, mesiMancanti };
}

// Età esatta in anni con decimali (giorni reali / 365.25), semplice e verificabile.
export function calcolaEta(dataNascitaISO) {
  const oggi = new Date();
  const nascita = new Date(dataNascitaISO);
  const giorni = (oggi - nascita) / 86400000;
  return giorni / 365.25;
}