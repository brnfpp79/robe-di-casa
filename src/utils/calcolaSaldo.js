export function calcolaSaldo(spese) {
  let saldo = 0 // positivo = Vale deve a Fil, negativo = Fil deve a Vale

  spese.forEach(s => {
    if (s.pagatoDa === "Fil") saldo += s.importo / 2
    if (s.pagatoDa === "Vale") saldo -= s.importo / 2
  })

  if (saldo > 0) return { debitore: "Vale", creditore: "Fil", importo: saldo }
  if (saldo < 0) return { debitore: "Fil", creditore: "Vale", importo: Math.abs(saldo) }
  return null // pari
}