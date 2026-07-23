import { useState, useEffect } from "react";
import { leggiMovimenti, aggiungiMovimento, eliminaMovimento, leggiLiquidita, salvaLiquidita, leggiBtc, salvaBtc, euro, eurDec, oggi, dataIt } from "./movimenti";
import { prezzoBtcEur } from "./btc";
import { leggiMediaSpeseMensile, calcolaAutonomia, calcolaEta } from "./pensione";

/* =========================================================================
   FONDO — vista adulti di un cassetto di risparmio.
   Totali onesti: "Versato finora" (certo) e "Valore atteso 2038" (solo buoni
   postali, dichiarato a mano). Il sistema non proietta nulla.
   Conto deposito: si annotano anche banca e tasso di interesse.
   ========================================================================= */

export const CATEGORIE = [
  { id: "posta",    nome: "Posta",          emoji: "📮", scadenza: true },
  { id: "etf",      nome: "ETF",            emoji: "📈" },
  { id: "deposito", nome: "Conto deposito", emoji: "🏦", banca: true },
  { id: "oro",      nome: "Oro",            emoji: "🪙" },
];
const catById = (id) => CATEGORIE.find((c) => c.id === id) || CATEGORIE[0];

const BANCHE = [
  { id: "bbva",     nome: "BBVA" },
  { id: "revolut",  nome: "Revolut" },
];
const bancaNome = (id) => (BANCHE.find((b) => b.id === id) || {}).nome || "";

export default function Fondo({ scope, titolo, mostraScadenza, mostraBtc, dataNascita, onEsci }) {
  const [movs, setMovs] = useState(null);
  const [form, setForm] = useState(false);
  const [liquidita, setLiquidita] = useState(null);
  const [editLiq, setEditLiq] = useState(false);
  const [btc, setBtc] = useState(null);
  const [editBtc, setEditBtc] = useState(false);
  const [prezzoBtc, setPrezzoBtc] = useState(null);   // null = non ancora, 0 = errore
  const [pensione, setPensione] = useState(null);      // null finché non calcolato

  const carica = () => {
    leggiMovimenti(scope).then(setMovs).catch((e) => { console.error(e); setMovs([]); });
    leggiLiquidita(scope).then(setLiquidita).catch((e) => { console.error(e); setLiquidita(0); });
    if (mostraBtc) {
      leggiBtc(scope).then(setBtc).catch((e) => { console.error(e); setBtc(0); });
      caricaPrezzo();
    }
  };
  const caricaPrezzo = () => {
    setPrezzoBtc(null);
    prezzoBtcEur().then(setPrezzoBtc).catch((e) => { console.error("Prezzo BTC:", e); setPrezzoBtc(0); });
  };
  useEffect(() => { carica(); /* eslint-disable-next-line */ }, [scope]);

  useEffect(() => {
    if (!dataNascita) return;
    leggiMediaSpeseMensile().then((r) => setPensione({ loading: false, ...r })).catch((e) => { console.error("Spese:", e); setPensione({ loading: false, media: 0, mesiConDati: 0 }); });
  }, [dataNascita]);

  const aggiornaLiquidita = async (v) => {
    setLiquidita(v); setEditLiq(false);
    try { await salvaLiquidita(scope, v); } catch (e) { console.error("Liquidità non salvata:", e); }
  };
  const aggiornaBtc = async (v) => {
    setBtc(v); setEditBtc(false);
    try { await salvaBtc(scope, v); } catch (e) { console.error("BTC non salvato:", e); }
  };

  const versato = (movs || []).reduce((s, m) => s + (m.importo || 0), 0);
  const atteso  = (movs || []).reduce((s, m) => s + (m.valoreScadenza || 0), 0);
  const perCat  = CATEGORIE.map((c) => ({
    ...c, tot: (movs || []).filter((m) => m.categoria === c.id).reduce((s, m) => s + (m.importo || 0), 0),
  })).filter((c) => c.tot > 0);

  const salva = async (mov) => { await aggiungiMovimento(scope, mov); setForm(false); carica(); };
  const elimina = async (id) => {
    if (!window.confirm("Eliminare questo movimento?")) return;
    await eliminaMovimento(scope, id); carica();
  };

  return (
    <>
      <div style={S.top}>
        <button onClick={onEsci} style={S.back}>←</button>
        <span style={S.titolo}>{titolo}</span>
        <span style={{ width: 46 }} />
      </div>

      <div style={S.totali}>
        <div style={S.totBox}>
          <span style={S.totLbl}>Versato finora</span>
          <span style={S.totVal}>{euro(versato)}</span>
        </div>

        <div style={{ ...S.totBox, ...S.totClic }} onClick={() => setEditLiq(true)}>
          <span style={S.totLbl}>Liquidità attuale ✎</span>
          <span style={{ ...S.totVal, color: "#8A5A16" }}>{liquidita === null ? "…" : euro(liquidita)}</span>
          <span style={S.totNota}>aggiornala a mano</span>
        </div>

        {mostraBtc && (
          <div style={{ ...S.totBox, ...S.totBtc }}>
            <span style={S.totLbl} onClick={() => setEditBtc(true)}>Bitcoin ✎</span>
            <span style={{ ...S.totVal, color: "#E08A1E" }} onClick={() => setEditBtc(true)}>
              {btc === null ? "…" : `₿ ${btc}`}
            </span>
            <span style={S.totNota}>
              {prezzoBtc === null ? "carico prezzo…"
                : prezzoBtc === 0 ? "controvalore non disponibile"
                : <>≈ {eurDec((btc || 0) * prezzoBtc)} <span onClick={caricaPrezzo} style={S.refresh}>⟳</span></>}
            </span>
          </div>
        )}
        {mostraScadenza && (
          <div style={{ ...S.totBox, background: "#EAF3EE" }}>
            <span style={S.totLbl}>Valore atteso 2038</span>
            <span style={{ ...S.totVal, color: "#2E7D52" }}>{euro(atteso)}</span>
            <span style={S.totNota}>solo buoni postali</span>
          </div>
        )}
      </div>

      {perCat.length > 0 && (
        <div style={S.chips}>
          {perCat.map((c) => (
            <span key={c.id} style={S.chip}>{c.emoji} {c.nome} · <b>{euro(c.tot)}</b></span>
          ))}
        </div>
      )}

      {dataNascita && (
        <PensioneBox
          pensione={pensione}
          fondiInput={{
            liquidita: liquidita || 0,
            versato,
            btcEur: mostraBtc && prezzoBtc > 0 ? (btc || 0) * prezzoBtc : 0,
            etaAttuale: calcolaEta(dataNascita),
          }}
        />
      )}

      <button onClick={() => setForm(true)} style={S.aggiungi}>+ Aggiungi versamento</button>

      {movs === null ? (
        <p style={S.info}>Carico…</p>
      ) : movs.length === 0 ? (
        <p style={S.info}>Nessun versamento registrato.</p>
      ) : (
        <div style={S.lista}>
          {movs.map((m) => {
            const c = catById(m.categoria);
            const extra = [
              m.banca ? bancaNome(m.banca) : null,
              m.tasso ? `${String(m.tasso).replace(".", ",")}%` : null,
            ].filter(Boolean).join(" · ");
            return (
              <div key={m.id} style={S.riga}>
                <span style={S.rEmoji}>{c.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={S.rCat}>{c.nome}{extra ? <span style={S.rExtra}> · {extra}</span> : null}</div>
                  <div style={S.rData}>{dataIt(m.data)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={S.rImp}>{euro(m.importo)}</div>
                  {m.valoreScadenza ? <div style={S.rScad}>→ {euro(m.valoreScadenza)}</div> : null}
                </div>
                <button onClick={() => elimina(m.id)} style={S.rDel}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {form && <FormVersamento onSalva={salva} onAnnulla={() => setForm(false)} />}
      {editLiq && <FormLiquidita valore={liquidita || 0} onSalva={aggiornaLiquidita} onAnnulla={() => setEditLiq(false)} />}
      {editBtc && <FormBtc valore={btc || 0} prezzo={prezzoBtc} onSalva={aggiornaBtc} onAnnulla={() => setEditBtc(false)} />}
    </>
  );
}

function FormBtc({ valore, prezzo, onSalva, onAnnulla }) {
  const [v, setV] = useState(valore ? String(valore) : "");
  const q = parseFloat(String(v).replace(",", ".")) || 0;
  const conferma = () => onSalva(q < 0 ? 0 : q);
  return (
    <div style={S.overlay}>
      <div style={S.dialog}>
        <h2 style={S.dTit}>Quanti Bitcoin</h2>
        <p style={S.dNota}>Inserisci la quantità di BTC che possiedi (es. 0,05). Il controvalore in euro è calcolato sul prezzo attuale, non salvato.</p>
        <label style={S.lbl}>Quantità (BTC)</label>
        <input type="number" inputMode="decimal" step="0.00000001" value={v} autoFocus
          onChange={(e) => setV(e.target.value)} style={S.input} placeholder="0" />
        {prezzo > 0 && <p style={S.dNota}>≈ {eurDec(q * prezzo)} al prezzo di ora</p>}
        <button onClick={conferma} style={S.dOk}>Salva</button>
        <button onClick={onAnnulla} style={S.dNo}>Annulla</button>
      </div>
    </div>
  );
}

function PensioneBox({ pensione, fondiInput }) {
  if (!pensione || pensione.loading === undefined) {
    return <div style={S.pensBox}><p style={S.pensCarico}>Calcolo l'autonomia finanziaria…</p></div>;
  }
  if (pensione.mesiConDati === 0) {
    return (
      <div style={S.pensBox}>
        <p style={S.pensCarico}>Ancora nessuna spesa registrata: non riesco a stimare una media mensile.</p>
      </div>
    );
  }

  const r = calcolaAutonomia({ mediaSpese: pensione.media, ...fondiInput });
  const etaTonda = Math.floor(r.etaUscita);
  const meseFraz = Math.round((r.etaUscita - etaTonda) * 12);

  return (
    <div style={S.pensBox}>
      <div style={S.pensHead}>
        <span style={S.pensTitolo}>🎯 Quando puoi smettere di lavorare?</span>
        <span style={S.pensBadge}>gioco, non un piano</span>
      </div>

      <p style={S.pensRiga}>
        Spese di famiglia: media <b>{euro(pensione.media)}</b>/mese
        {pensione.mesiConDati < 3 && <span style={S.pensNotaInline}> (solo {pensione.mesiConDati} {pensione.mesiConDati === 1 ? "mese" : "mesi"} di dati — poco affidabile)</span>}
        , divise in due con Vale → la tua quota è <b>{euro(r.quotaSpese)}</b>
      </p>
      <p style={S.pensRiga}>
        + 300 € margine personale (università, moto, varie) = spesa mensile da coprire <b>{euro(r.speseConMargine)}</b>
      </p>
      <p style={S.pensRiga}>
        Fondi liquidabili: liquidità {euro(fondiInput.liquidita)} + versato {euro(fondiInput.versato)}
        {fondiInput.btcEur > 0 && <> + BTC netto tasse {euro(fondiInput.btcEur)}</>} = <b>{euro(r.fondiTotali)}</b>
      </p>
      <p style={S.pensRiga}>
        Con questi fondi potresti coprire <b>{r.mesiAutonomia.toFixed(1)} mesi</b> ({r.anniAutonomia.toFixed(1)} anni) di spese.
      </p>

      <div style={S.pensEsito}>
        {etaTonda >= 67 ? (
          <>I tuoi fondi attuali non anticipano la pensione a 67 anni: al ritmo di oggi ci arriveresti comunque.</>
        ) : (
          <>Puoi smettere di lavorare a circa <b>{etaTonda} anni e {meseFraz} mesi</b> — mancano <b>{r.mesiMancanti} mesi</b> da oggi.</>
        )}
      </div>
    </div>
  );
}

function FormLiquidita({ valore, onSalva, onAnnulla }) {
  const [v, setV] = useState(valore ? String(valore) : "");
  const conferma = () => {
    const n = parseFloat(String(v).replace(",", "."));
    onSalva(isNaN(n) || n < 0 ? 0 : n);
  };
  return (
    <div style={S.overlay}>
      <div style={S.dialog}>
        <h2 style={S.dTit}>Liquidità attuale</h2>
        <p style={S.dNota}>Quanto vale oggi questo fondo. È una fotografia che aggiorni tu: non viene calcolata dai versamenti.</p>
        <label style={S.lbl}>Valore (€)</label>
        <input type="number" inputMode="decimal" value={v} autoFocus
          onChange={(e) => setV(e.target.value)} style={S.input} placeholder="0" />
        <button onClick={conferma} style={S.dOk}>Salva</button>
        <button onClick={onAnnulla} style={S.dNo}>Annulla</button>
      </div>
    </div>
  );
}

function FormVersamento({ onSalva, onAnnulla }) {
  const [data, setData] = useState(oggi());
  const [categoria, setCategoria] = useState("posta");
  const [importo, setImporto] = useState("");
  const [scad, setScad] = useState("");
  const [banca, setBanca] = useState("bbva");
  const [tasso, setTasso] = useState("");
  const cat = catById(categoria);

  const conferma = () => {
    const imp = parseFloat(String(importo).replace(",", "."));
    if (!imp || imp <= 0) return;
    const sc = parseFloat(String(scad).replace(",", "."));
    const tx = parseFloat(String(tasso).replace(",", "."));
    onSalva({
      data, categoria, importo: imp,
      valoreScadenza: cat.scadenza && sc > 0 ? sc : null,
      banca: cat.banca ? banca : null,
      tasso: cat.banca && tx > 0 ? tx : null,
    });
  };

  return (
    <div style={S.overlay}>
      <div style={S.dialog}>
        <h2 style={S.dTit}>Nuovo versamento</h2>

        <label style={S.lbl}>Categoria</label>
        <div style={S.catGrid}>
          {CATEGORIE.map((c) => (
            <button key={c.id} onClick={() => setCategoria(c.id)}
              style={{ ...S.catBtn, ...(categoria === c.id ? S.catOn : {}) }}>
              <span style={{ fontSize: 24 }}>{c.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{c.nome}</span>
            </button>
          ))}
        </div>

        <label style={S.lbl}>Importo versato (€)</label>
        <input type="number" inputMode="decimal" value={importo}
          onChange={(e) => setImporto(e.target.value)} style={S.input} placeholder="0" />

        {cat.scadenza && (
          <>
            <label style={S.lbl}>Valore a scadenza 2038 (€)</label>
            <input type="number" inputMode="decimal" value={scad}
              onChange={(e) => setScad(e.target.value)} style={S.input} placeholder="quanto varrà" />
          </>
        )}

        {cat.banca && (
          <>
            <label style={S.lbl}>Banca</label>
            <div style={S.bancaRow}>
              {BANCHE.map((b) => (
                <button key={b.id} onClick={() => setBanca(b.id)}
                  style={{ ...S.bancaBtn, ...(banca === b.id ? S.catOn : {}) }}>{b.nome}</button>
              ))}
            </div>
            <label style={S.lbl}>Interessi (%)</label>
            <input type="number" inputMode="decimal" step="0.01" value={tasso}
              onChange={(e) => setTasso(e.target.value)} style={S.input} placeholder="es. 3,5" />
          </>
        )}

        <label style={S.lbl}>Data</label>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={S.input} />

        <button onClick={conferma} style={S.dOk}>Salva</button>
        <button onClick={onAnnulla} style={S.dNo}>Annulla</button>
      </div>
    </div>
  );
}

/* Campi di input: forzo tema chiaro, altrimenti il dark mode di Android
   inverte lo sfondo e il testo diventa illeggibile. */
const campo = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 17,
  borderRadius: 12, border: "2px solid #E6DCC4", marginBottom: 14,
  fontWeight: 600, color: "#23201b", background: "#fff", colorScheme: "light",
  WebkitTextFillColor: "#23201b",
};

const S = {
  top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  back: { background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, fontSize: 26, width: 46, height: 46, cursor: "pointer", color: "#1F4A46" },
  titolo: { color: "#fff", fontSize: 20, fontWeight: 700 },
  totali: { display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" },
  totBox: { flex: "1 1 150px", background: "#fff", borderRadius: 16, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 2 },
  totClic: { cursor: "pointer", background: "#FDF6E7", border: "2px solid #EFC873" },
  totBtc: { background: "#FFF4E2", border: "2px solid #F2B84B" },
  refresh: { cursor: "pointer", marginLeft: 4, color: "#E08A1E", fontWeight: 800 },
  totLbl: { fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "#9a917f", fontWeight: 700 },
  totVal: { fontSize: 24, fontWeight: 800, color: "#1F4A46" },
  totNota: { fontSize: 10, color: "#9a917f" },
  chips: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: { background: "rgba(255,255,255,0.9)", borderRadius: 14, padding: "6px 12px", fontSize: 13, color: "#3B352A" },
  aggiungi: { width: "100%", background: "linear-gradient(145deg,#3E7F79,#1F4A46)", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 16 },
  info: { color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 20 },
  lista: { display: "flex", flexDirection: "column", gap: 8 },
  riga: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.93)", borderRadius: 14, padding: "12px 14px" },
  rEmoji: { fontSize: 24 },
  rCat: { fontWeight: 700, color: "#3B352A", fontSize: 15 },
  rExtra: { fontWeight: 600, color: "#5C7C77", fontSize: 13 },
  rData: { fontSize: 12, color: "#9a917f" },
  rImp: { fontWeight: 800, color: "#1F4A46", fontSize: 16 },
  rScad: { fontSize: 12, color: "#2E7D52", fontWeight: 700 },
  rDel: { background: "none", border: "none", color: "#c9bfac", fontSize: 22, cursor: "pointer", padding: "0 4px" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", zIndex: 20, padding: 20, overflowY: "auto" },
  dialog: { background: "#fff", borderRadius: 24, padding: "24px 22px", maxWidth: 420, width: "100%", boxShadow: "0 20px 50px -12px rgba(0,0,0,.5)", colorScheme: "light" },
  dTit: { margin: "0 0 16px", fontSize: 22, color: "#1F4A46", textAlign: "center" },
  dNota: { margin: "-8px 0 16px", fontSize: 13, color: "#9a917f", textAlign: "center", lineHeight: 1.45 },
  lbl: { display: "block", fontSize: 12, color: "#9a917f", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 },
  catGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 },
  catBtn: { border: "2px solid #E6DCC4", background: "#FAF7F0", borderRadius: 14, padding: "10px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: "#3B352A" },
  catOn: { borderColor: "#1F4A46", background: "#E4ECEA" },
  bancaRow: { display: "flex", gap: 8, marginBottom: 14 },
  bancaBtn: { flex: 1, border: "2px solid #E6DCC4", background: "#FAF7F0", borderRadius: 12, padding: "12px 8px", cursor: "pointer", fontSize: 15, fontWeight: 700, color: "#3B352A" },
  input: campo,
  dOk: { width: "100%", background: "linear-gradient(145deg,#3E7F79,#1F4A46)", color: "#fff", border: "none", borderRadius: 14, padding: "13px", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 8 },
  dNo: { width: "100%", background: "none", border: "none", color: "#9a917f", padding: "8px", fontSize: 14, cursor: "pointer" },

  pensBox: { background: "linear-gradient(145deg,#FDF6E7,#FBEACB)", border: "2px solid #EFC873", borderRadius: 18, padding: "16px 18px", marginBottom: 16 },
  pensCarico: { margin: 0, color: "#8A6A4A", fontSize: 14, textAlign: "center" },
  pensHead: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  pensTitolo: { fontSize: 16, fontWeight: 800, color: "#8A5A16" },
  pensBadge: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", color: "#B08A4E", background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "3px 8px" },
  pensRiga: { margin: "0 0 6px", fontSize: 13.5, color: "#5c4a2c", lineHeight: 1.5 },
  pensNotaInline: { color: "#B0704A", fontWeight: 600 },
  pensEsito: { marginTop: 10, paddingTop: 10, borderTop: "1px dashed #E4C97F", fontSize: 15, color: "#7A4A12", fontWeight: 600, lineHeight: 1.5 },
};