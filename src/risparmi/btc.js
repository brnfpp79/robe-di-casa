/* Prezzo BTC in EUR da CoinGecko (endpoint pubblico, senza chiave).
   Cache in memoria di 2 minuti per non tempestare l'API pubblica. */

let cache = { prezzo: null, ts: 0 };

export async function prezzoBtcEur() {
  const ora = Date.now();
  if (cache.prezzo && ora - cache.ts < 120000) return cache.prezzo;   // 2 min
  const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur");
  if (!r.ok) throw new Error("CoinGecko " + r.status);
  const d = await r.json();
  const p = d?.bitcoin?.eur;
  if (!p) throw new Error("prezzo mancante");
  cache = { prezzo: p, ts: ora };
  return p;
}