import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { useUserProfile } from "../hooks/useUserProfile";
import Intestazione from "../components/Intestazione";

// --- iconcine SVG interne ---
const Ico = ({ size=16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const X = ({ size }) => <Ico size={size}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>;
const Plus = ({ size }) => <Ico size={size}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ico>;
const Search = ({ size }) => <Ico size={size}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ico>;
const EyeOff = ({ size }) => <Ico size={size}><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><line x1="2" y1="2" x2="22" y2="22"/></Ico>;
const Settings2 = ({ size }) => <Ico size={size}><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="9" cy="8" r="2.2" fill="currentColor" stroke="none"/><circle cx="15" cy="16" r="2.2" fill="currentColor" stroke="none"/></Ico>;
const Check = ({ size }) => <Ico size={size}><polyline points="20 6 9 17 4 12"/></Ico>;

const FIG = { verde_scuro:"#1E7A3C", verde_chiaro:"#7CB342", giallo:"#E3B008", arancio:"#EE852B", rosso:"#DE4636" };
const RUOLO = { carbo:"Carboidrati", carbo_proteico:"Carbo + proteine", proteine:"Proteine", proteico:"Proteine", grassi:"Grassi", verdura:"Verdura", topping:"Topping", dolce:"Dolce", boost:"Proteine isolate" };
const MACRO_DI = { carbo:"c", carbo_proteico:"c", proteine:"p", proteico:"p", boost:"p", grassi:"g" };
const MEALS = [["colazione","Colazione"],["pranzo","Pranzo"],["cena","Cena"]];
const ORD = { Colazione:0, Pranzo:1, Cena:2 };
const GIORNATE = [["riposo","Riposo",0],["sport","Sport",600],["intenso","Sport intenso",900],["cammino","Cammino lungo",1400]];
const TABS = [["fabbisogno","Fabbisogno"],["scheda","Scheda"],["settimana","Settimana"],["sport","Sport"]];
const PROFILI = [["fil","Fil"],["vale","Vale"]];
const PESO_DEFAULT = { fil:66, vale:60 };
const TETTO_FATTORE = 2.2;   // limite di scala per non tripicare i condimenti

function todayKey(){ const d=new Date(); const o=d.getTimezoneOffset(); return new Date(d-o*60000).toISOString().slice(0,10); }
function shiftDate(k,n){ const d=new Date(k+"T12:00:00"); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
const arrotonda = (g) => g>=40 ? Math.round(g/5)*5 : Math.max(1,Math.round(g));

// motore energetico: tutto deriva dal peso
function motore(peso, planned, deficit){
  const basale = peso*24, neat = basale*0.2, mant = basale+neat;
  const target = mant - deficit + planned;
  const prot = peso*2, grassi = peso*1;
  const carbo = Math.max(0,(target - prot*4 - grassi*9)/4);
  return { basale, neat, mant, target, prot, grassi, carbo };
}

export default function Nutrizione(){
  const { profileId } = useUserProfile();
  const [profilo,setProfilo] = useState("fil");
  const [tab,setTab] = useState("scheda");

  const [foods,setFoods] = useState(null);
  const [piano,setPiano] = useState(null);
  const [hidden,setHidden] = useState(()=>new Set());
  const [pesi,setPesi] = useState({});
  const [deficit,setDeficit] = useState(300);
  const [loading,setLoading] = useState(true);
  const [errore,setErrore] = useState(null);

  const [date,setDate] = useState(todayKey());
  const [edit,setEdit] = useState(false);

  const [dayType,setDayType] = useState("riposo");
  const [planned,setPlanned] = useState(0);
  const [garminReale,setGarminReale] = useState(0);
  const [diario,setDiario] = useState([]);

  const [meal,setMeal] = useState("pranzo");
  const [tpl,setTpl] = useState(0);
  const [sel,setSel] = useState({});
  const [veg,setVeg] = useState({ id:null, g:200 });
  const [extras,setExtras] = useState([]);
  const [picker,setPicker] = useState(false);
  const [pq,setPq] = useState("");
  const [pFood,setPFood] = useState(null);
  const [pG,setPG] = useState(100);
  const [pesoInput,setPesoInput] = useState("");

  useEffect(()=>{ if(profileId==="fil"||profileId==="vale") setProfilo(profileId); },[profileId]);

  // alimenti: condivisi, caricati una volta
  useEffect(()=>{ (async()=>{
    try{ const s=await getDocs(collection(db,"nutri_alimenti")); const m={}; s.forEach(d=>m[d.id]=d.data()); setFoods(m);
      const fv=Object.entries(m).find(([,f])=>f.categoria==="verdura"); setVeg(v=>({...v,id:fv?fv[0]:null}));
    }catch(e){ setErrore(e.message); }
  })(); },[]);

  // piano + config + pesi: per profilo
  useEffect(()=>{ (async()=>{
    setLoading(true);
    try{
      const [sp,sc,sw] = await Promise.all([
        getDoc(doc(db,"nutri_piano",profilo)),
        getDoc(doc(db,"nutri_config",profilo)),
        getDoc(doc(db,"nutri_peso",profilo)),
      ]);
      let p = sp.exists()? sp.data() : null;
      if(!p){ const old=await getDoc(doc(db,"nutri_piano","attuale")); p = old.exists()? old.data():null; }
      setPiano(p);
      setHidden(new Set((sc.exists()&&sc.data().nascosti)||[]));
      setDeficit((sc.exists()&&sc.data().deficit) ?? 300);
      setPesi((sw.exists()&&sw.data().pesi)||{});
    }catch(e){ setErrore(e.message); }
    setLoading(false);
  })(); },[profilo]);

  // giornata
  useEffect(()=>{ if(loading) return; (async()=>{
    const snap=await getDoc(doc(db,"nutri_diario",`${profilo}_${date}`));
    if(snap.exists()){ const d=snap.data();
      setDayType(d.dayType||"riposo"); setPlanned(d.planned||0);
      setGarminReale(d.garminReale||0); setDiario(d.diario||[]);
    } else { setDayType("riposo"); setPlanned(0); setGarminReale(0); setDiario([]); }
    setPesoInput(pesi[date]!=null?String(pesi[date]):"");
  })(); },[date,profilo,loading,pesi]);

  const FOODS = foods||{};
  const macroDi = (comps,fatt=1)=>{ let k=0,p=0,c=0,g=0;
    for(const x of comps){ const f=FOODS[x.alimentoId]; if(!f) continue; const r=arrotonda(x.g*fatt)/100;
      k+=f.kcal*r; p+=(f.proteine||0)*r; c+=(f.carbo||0)*r; g+=(f.grassi||0)*r; }
    return {k,p,c,g};
  };
  const primary = sc => FOODS[sc.componenti[0].alimentoId];
  const optLabel = sc => sc.label || primary(sc)?.nome || "?";
  const sharedWeight = gr => { let g=null; for(const sc of gr.scelte){ if(sc.componenti.length!==1) return null; if(g===null) g=sc.componenti[0].g; else if(g!==sc.componenti[0].g) return null; } return g; };

  const VEG = useMemo(()=>Object.entries(FOODS).filter(([,f])=>f.categoria==="verdura").map(([id,f])=>({id,...f})),[foods]);
  const ALL = useMemo(()=>Object.entries(FOODS).map(([id,f])=>({id,...f})).sort((a,b)=>a.nome.localeCompare(b.nome)),[foods]);

  // ---- peso: media mobile 7 giorni ----
  const pesoMedio = useMemo(()=>{
    const v=[]; for(let i=0;i<7;i++){ const k=shiftDate(date,-i); if(pesi[k]!=null) v.push(pesi[k]); }
    if(!v.length){ const past=Object.keys(pesi).filter(k=>k<=date).sort(); return past.length? pesi[past[past.length-1]] : PESO_DEFAULT[profilo]; }
    return v.reduce((a,b)=>a+b,0)/v.length;
  },[pesi,date,profilo]);

  const M = useMemo(()=>motore(pesoMedio,planned,deficit),[pesoMedio,planned,deficit]);

  // ---- scheda nominale: prima scelta di ogni slot obbligatorio ----
  const nominale = useMemo(()=>{
    if(!piano||!foods) return null;
    const tot={p:0,c:0,g:0}, slot={p:0,c:0,g:0};
    for(const mk of ["colazione","pranzo","cena"]){
      const t=piano[mk]?.templates?.[0]; if(!t) continue;
      for(const s of t.slots){
        if(s.libera){ const f=FOODS[veg.id]; if(f){ const r=2; tot.p+=(f.proteine||0)*r; tot.c+=(f.carbo||0)*r; tot.g+=(f.grassi||0)*r; } continue; }
        if(s.opzionale) continue;
        const sc=s.gruppi?.[0]?.scelte?.[0]; if(!sc) continue;
        const r=macroDi(sc.componenti);
        tot.p+=r.p; tot.c+=r.c; tot.g+=r.g;
        const mm=MACRO_DI[s.ruolo]; if(mm) slot[mm]+= mm==="p"?r.p: mm==="c"?r.c:r.g;
      }
    }
    return { tot, slot };
  },[piano,foods,veg.id]);

  // ---- fattori di scala: chiudono il divario fra scheda e target ----
  const fattori = useMemo(()=>{
    if(!nominale) return {p:1,c:1,g:1};
    const f={};
    for(const [m,t] of [["p",M.prot],["c",M.carbo],["g",M.grassi]]){
      const S=nominale.slot[m], I=nominale.tot[m]-S;
      f[m] = S>0 ? Math.min(TETTO_FATTORE, Math.max(0.3,(t-I)/S)) : 1;
    }
    return f;
  },[nominale,M]);

  const mealObj = piano? piano[meal] : null;
  const template = mealObj? mealObj.templates[Math.min(tpl,mealObj.templates.length-1)] : null;
  const fattoreSlot = s => fattori[MACRO_DI[s.ruolo]] ?? 1;

  const hideKey=(i,oid)=>`${meal}:${template.id}:${i}:${oid}`;
  function opzioni(slot,i,inclNasc=false){ const out=[];
    (slot.gruppi||[]).forEach((gr,gi)=>gr.scelte.forEach((sc,si)=>{
      const oid=`${gi}-${si}`; if(!inclNasc && hidden.has(hideKey(i,oid))) return; out.push({oid,sc});
    })); return out;
  }

  useEffect(()=>{ if(!template) return;
    const s={}; template.slots.forEach((slot,i)=>{ if(slot.libera) return;
      s[i]= slot.opzionale? null : (opzioni(slot,i)[0]?.oid ?? null); });
    setSel(s); setVeg(v=>({...v,g:200})); setExtras([]);
  },[meal,tpl,piano,hidden]);

  const meal_ = useMemo(()=>{
    if(!template) return {k:0,p:0,c:0,g:0};
    let k=0,p=0,c=0,g=0;
    template.slots.forEach((slot,i)=>{
      if(slot.libera){ const f=FOODS[veg.id]; if(f){ const r=veg.g/100; k+=f.kcal*r; p+=(f.proteine||0)*r; c+=(f.carbo||0)*r; g+=(f.grassi||0)*r; } return; }
      const oid=sel[i]; if(oid==null) return;
      const found=opzioni(slot,i,true).find(o=>o.oid===oid); if(!found) return;
      const r=macroDi(found.sc.componenti,fattoreSlot(slot)); k+=r.k; p+=r.p; c+=r.c; g+=r.g;
    });
    for(const e of extras){ const f=FOODS[e.alimentoId]; if(f){ const r=e.g/100; k+=f.kcal*r; p+=(f.proteine||0)*r; c+=(f.carbo||0)*r; g+=(f.grassi||0)*r; } }
    return {k:Math.round(k),p:Math.round(p),c:Math.round(c),g:Math.round(g)};
  },[template,sel,veg,extras,foods,fattori]);

  const dayK=diario.reduce((a,d)=>a+d.kcal,0);
  const dayP=diario.reduce((a,d)=>a+d.prot,0);
  const dayC=diario.reduce((a,d)=>a+(d.carbo||0),0);
  const dayG=diario.reduce((a,d)=>a+(d.grassi||0),0);
  const target=Math.round(M.target);
  const over=dayK>target;
  const realeTarget = garminReale>0? garminReale-deficit : null;
  const gia = diario.find(d=>d.pasto===mealObj?.nome);

  function persist(patch){
    setDoc(doc(db,"nutri_diario",`${profilo}_${date}`),
      { profilo, data:date, dayType, planned, garminReale, diario, ...patch, aggiornato:Date.now() },
      { merge:true }).catch(e=>setErrore(e.message));
  }
  function setGiornata(id,kc){ setDayType(id); setPlanned(kc); persist({dayType:id,planned:kc}); }
  function bumpPlanned(d){ const v=Math.max(0,planned+d); setPlanned(v); setDayType("manuale"); persist({dayType:"manuale",planned:v}); }
  function setReale(v){ setGarminReale(v); persist({garminReale:v}); }
  function pick(i,oid){ setSel(s=>({...s,[i]: s[i]===oid && template.slots[i].opzionale ? null : oid})); }
  function add(){ if(meal_.k<=0) return;
    const voce={id:Date.now(),pasto:mealObj.nome,kcal:meal_.k,prot:meal_.p,carbo:meal_.c,grassi:meal_.g};
    const next=[...diario.filter(x=>x.pasto!==mealObj.nome),voce];
    setDiario(next); persist({diario:next});
  }
  function rimuovi(id){ const next=diario.filter(y=>y.id!==id); setDiario(next); persist({diario:next}); }
  function addExtra(){ if(!pFood) return; setExtras(x=>[...x,{id:Date.now(),alimentoId:pFood,g:pG}]); setPicker(false); setPFood(null); setPG(100); setPq(""); }
  function toggleHide(i,oid){ const key=hideKey(i,oid); const n=new Set(hidden); n.has(key)?n.delete(key):n.add(key); setHidden(n);
    setDoc(doc(db,"nutri_config",profilo),{nascosti:[...n]},{merge:true}).catch(e=>setErrore(e.message)); }
  function salvaPeso(){ const v=parseFloat(String(pesoInput).replace(",",".")); if(!v||v<30||v>200) return;
    const next={...pesi,[date]:v}; setPesi(next);
    setDoc(doc(db,"nutri_peso",profilo),{pesi:next},{merge:true}).catch(e=>setErrore(e.message)); }
  function salvaDeficit(v){ setDeficit(v); setDoc(doc(db,"nutri_config",profilo),{deficit:v},{merge:true}).catch(e=>setErrore(e.message)); }

  const plist = ALL.filter(f=>f.nome.toLowerCase().includes(pq.toLowerCase())).slice(0,40);
  const storico = useMemo(()=>Object.keys(pesi).filter(k=>k<=date).sort().slice(-14).map(k=>({k,v:pesi[k]})),[pesi,date]);

  if(loading) return <div className="cfg-wrap"><style>{CSS}</style><div className="loader">Carico…</div></div>;
  if(!piano)  return <div className="cfg-wrap"><style>{CSS}</style><div className="loader">Nessun piano per {profilo}. Fai il seed.</div></div>;

  return (
    <div className="cfg-wrap">
      <style>{CSS}</style>

      <Intestazione to="/" />

      <header className="cfg-head">
        <div><div className="eyebrow">Il carburante di oggi</div><h1>Nutrizione</h1></div>
        <div className="hactions">
          <div className="pswitch">
            {PROFILI.map(([id,l])=>(
              <button key={id} className={profilo===id?"on":""} onClick={()=>setProfilo(id)}>{l}</button>
            ))}
          </div>
          {tab==="scheda" && (
            <button className={"editbtn"+(edit?" on":"")} onClick={()=>setEdit(e=>!e)}>{edit?<Check size={18}/>:<Settings2 size={18}/>}</button>
          )}
        </div>
      </header>

      <div className="datebar">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        {date!==todayKey() && <button className="oggi" onClick={()=>setDate(todayKey())}>Oggi</button>}
      </div>

      <nav className="maintabs">
        {TABS.map(([id,l])=>(
          <button key={id} className={"mtab"+(tab===id?" on":"")} onClick={()=>setTab(id)}>{l}</button>
        ))}
      </nav>

      {errore && <div className="errore">{errore}</div>}

      {tab==="fabbisogno" && (
        <>
          <section className="card">
            <div className="eyebrow">Peso di {date===todayKey()?"oggi":date}</div>
            <div className="pesorow">
              <input type="number" step="0.1" inputMode="decimal" placeholder="kg"
                     value={pesoInput} onChange={e=>setPesoInput(e.target.value)} />
              <button className="padd" onClick={salvaPeso}>Salva</button>
            </div>
            <div className="mediabox">
              <div><b>{pesoMedio.toFixed(1)} kg</b><span>media 7 giorni — è questa che guida i calcoli</span></div>
            </div>
            {storico.length>1 && (
              <div className="spark">
                {(()=>{ const vs=storico.map(s=>s.v), mn=Math.min(...vs), mx=Math.max(...vs), rg=(mx-mn)||1;
                  return storico.map((s,i)=>(
                    <div key={s.k} className="sbar" title={`${s.k}: ${s.v} kg`}>
                      <div className="sfill" style={{height:`${12+((s.v-mn)/rg)*76}%`}} />
                    </div>)); })()}
              </div>
            )}
          </section>

          <section className="card">
            <div className="eyebrow">Motore energetico</div>
            <div className="mrow"><span>Basale (peso × 24)</span><b>{Math.round(M.basale)}</b></div>
            <div className="mrow"><span>NEAT (+20%)</span><b>{Math.round(M.neat)}</b></div>
            <div className="mrow tot"><span>Mantenimento</span><b>{Math.round(M.mant)}</b></div>
            <div className="mrow"><span>Deficit</span>
              <div className="ministep">
                <button onClick={()=>salvaDeficit(Math.max(0,deficit-50))}>−</button><b>−{deficit}</b><button onClick={()=>salvaDeficit(deficit+50)}>+</button>
              </div>
            </div>
            <div className="mrow"><span>Attività prevista</span><b>+{planned}</b></div>
            <div className="mrow big"><span>Target di oggi</span><b>{target}</b></div>
          </section>

          <section className="card">
            <div className="eyebrow">Macro di oggi</div>
            <div className="macrogrid">
              <div className="mc p"><b>{Math.round(M.prot)} g</b><span>Proteine</span><em>peso × 2 — fisse</em></div>
              <div className="mc g"><b>{Math.round(M.grassi)} g</b><span>Grassi</span><em>peso × 1 — pavimento</em></div>
              <div className="mc c"><b>{Math.round(M.carbo)} g</b><span>Carboidrati</span><em>tutto il resto</em></div>
            </div>
            <div className="fattori">
              Porzioni della scheda scalate ×<b>{fattori.c.toFixed(2)}</b> sui carboidrati, ×<b>{fattori.p.toFixed(2)}</b> proteine, ×<b>{fattori.g.toFixed(2)}</b> grassi
              {fattori.g>=TETTO_FATTORE && <em> — grassi al tetto: usa avocado/olive o fonti più grasse per arrivare al target</em>}
            </div>
          </section>
        </>
      )}

      {tab==="scheda" && (
        <>
          <div className="daybar">
            <div className="eyebrow">Giornata di oggi — impostala stamattina</div>
            <div className="dchips">
              {GIORNATE.map(([id,l,kc])=>(
                <button key={id} className={"dchip"+(dayType===id?" on":"")} onClick={()=>setGiornata(id,kc)}>{l}</button>
              ))}
            </div>
            <label className="planned">
              <span>Attività prevista</span>
              <div className="pinput">
                <button onClick={()=>bumpPlanned(-100)}>−</button><b>{planned}</b><em>kcal</em><button onClick={()=>bumpPlanned(100)}>+</button>
              </div>
            </label>
          </div>

          <section className="gauge">
            <div className="gauge-top">
              <div className="gnum"><b>{dayK}</b><span>/ {target} kcal</span></div>
              <div className={"gstate"+(over?" over":"")}>{over?`+${dayK-target} oltre`:`${target-dayK} rimaste`}</div>
            </div>
            <div className="bar">
              <div className="fill preview" style={{width:`${target?Math.min((dayK+meal_.k)/target,1)*100:0}%`}} />
              <div className={"fill"+(over?" over":"")} style={{width:`${target?Math.min(dayK/target,1)*100:0}%`}} />
            </div>
            <div className="tri">
              {[["P",dayP,M.prot,"prot"],["C",dayC,M.carbo,"carb"],["G",dayG,M.grassi,"fat"]].map(([l,v,t,cl])=>(
                <div className="tri-i" key={l}>
                  <div className="tri-h"><span>{l}</span><em>{Math.round(v)}/{Math.round(t)}</em></div>
                  <div className="ptrack"><div className={"pfill "+cl} style={{width:`${t?Math.min(v/t,1)*100:0}%`}} /></div>
                </div>
              ))}
            </div>
            <div className="reale">
              <label><span>kcal reali Garmin (sera)</span>
                <input type="number" value={garminReale||""} placeholder="—" onChange={e=>setReale(+e.target.value||0)} />
              </label>
              {realeTarget!=null && <div className={"delta"+(dayK>realeTarget?" over":"")}>reale {realeTarget} · scarto {dayK-realeTarget>0?"+":""}{dayK-realeTarget}</div>}
            </div>
          </section>

          {edit && <div className="editnote">Modifica: tocca un alimento per nasconderlo o rimostrarlo.</div>}

          <nav className="tabs">
            {MEALS.map(([id,l])=>(
              <button key={id} className={"tab"+(meal===id?" on":"")} onClick={()=>{setMeal(id);setTpl(0);}}>{l}{diario.some(d=>d.pasto===l)&&<i className="tdot"/>}</button>
            ))}
          </nav>

          <div className="tpls">
            {mealObj.templates.map((t,i)=>(
              <button key={t.id} className={"chip"+(tpl===i?" on":"")} onClick={()=>setTpl(i)}>{t.label}</button>
            ))}
          </div>

          {template.slots.map((slot,i)=>{
            const fs=fattoreSlot(slot);
            return (
            <section className="slot" key={i}>
              <div className="slot-head">
                <span>{RUOLO[slot.ruolo]||slot.ruolo}</span>
                {slot.opzionale && <em>facoltativo</em>}
                {slot.libera && <em>{slot.libera.min}–{slot.libera.max} g</em>}
                {!slot.libera && Math.abs(fs-1)>0.03 && <i className="fbadge">×{fs.toFixed(2)}</i>}
              </div>
              {slot.libera ? (
                <div className="veg">
                  <div className="opts">
                    {VEG.map(v=>(
                      <button key={v.id} className={"opt"+(veg.id===v.id?" on":"")} onClick={()=>setVeg(x=>({...x,id:v.id}))}>
                        <span className="dot" style={{background:FIG[v.figBand]||"#C7CEC9"}} />{v.nome}
                      </button>
                    ))}
                  </div>
                  <div className="stepper">
                    <button onClick={()=>setVeg(x=>({...x,g:Math.max(slot.libera.min,x.g-10)}))}>−</button>
                    <b>{veg.g} g</b>
                    <button onClick={()=>setVeg(x=>({...x,g:Math.min(slot.libera.max,x.g+10)}))}>+</button>
                  </div>
                </div>
              ) : (
                (slot.gruppi||[]).map((gr,gi)=>{
                  const sw=gr.titolo?sharedWeight(gr):null;
                  const chips=gr.scelte.map((sc,si)=>{
                    const oid=`${gi}-${si}`, key=hideKey(i,oid), isH=hidden.has(key);
                    if(isH&&!edit) return null;
                    const f=primary(sc), r=macroDi(sc.componenti,fs);
                    const single=sc.componenti.length===1;
                    const gScal = single? arrotonda(sc.componenti[0].g*fs) : null;
                    const on = sel[i]===oid && !edit;
                    return (
                      <button key={oid} className={"opt"+(on?" on":"")+(isH?" hid":"")} onClick={()=>edit?toggleHide(i,oid):pick(i,oid)}>
                        {isH && <EyeOff size={12}/>}
                        {!isH && f?.figBand && <span className="dot" style={{background:FIG[f.figBand]}} />}
                        <span className="oname">{optLabel(sc)}</span>
                        <span className="okcal">{gScal!=null&&!sw?`${gScal} g · `:""}{Math.round(r.k)}</span>
                      </button>
                    );
                  });
                  return gr.titolo ? (
                    <div className="group" key={gi}>
                      <div className="group-head">{gr.titolo}{sw?<em>{arrotonda(sw*fs)} g</em>:null}</div>
                      <div className="opts">{chips}</div>
                    </div>
                  ) : <div className="opts" key={gi}>{chips}</div>;
                })
              )}
            </section>
          );})}

          <section className="slot extra">
            <div className="slot-head"><span>Extra</span><em>fuori piano</em></div>
            {extras.length>0 && (
              <div className="opts">
                {extras.map(e=>{ const f=FOODS[e.alimentoId]; return (
                  <span className="exchip" key={e.id}>{f?.nome} · {e.g} g · {Math.round((f?.kcal||0)*e.g/100)}
                    <button onClick={()=>setExtras(x=>x.filter(y=>y.id!==e.id))}><X size={13}/></button>
                  </span>); })}
              </div>
            )}
            {!picker ? (
              <button className="addextra" onClick={()=>setPicker(true)}><Plus size={15}/> Aggiungi extra</button>
            ) : (
              <div className="picker">
                <div className="psearch"><Search size={15}/><input autoFocus placeholder="cerca alimento" value={pq} onChange={e=>setPq(e.target.value)} /></div>
                <div className="plist">
                  {plist.map(f=>(
                    <button key={f.id} className={"prow"+(pFood===f.id?" on":"")} onClick={()=>setPFood(f.id)}>
                      {f.figBand && <span className="dot" style={{background:FIG[f.figBand]}} />}
                      <span>{f.nome}</span><em>{f.kcal}/100g</em>
                    </button>
                  ))}
                </div>
                <div className="pfoot">
                  <div className="stepper sm"><button onClick={()=>setPG(g=>Math.max(5,g-5))}>−</button><b>{pG} g</b><button onClick={()=>setPG(g=>g+5)}>+</button></div>
                  <button className="pcancel" onClick={()=>{setPicker(false);setPFood(null);setPq("");}}>Annulla</button>
                  <button className="padd" disabled={!pFood} onClick={addExtra}>Aggiungi</button>
                </div>
              </div>
            )}
          </section>

          <div className="total">
            <div>
              <div className="tnum"><b>{meal_.k}</b> kcal</div>
              <div className="ttarget">P {meal_.p} · C {meal_.c} · G {meal_.g} g</div>
            </div>
            <button className="add" onClick={add}><Plus size={17}/> {gia?`Aggiorna ${mealObj.nome}`:"Aggiungi"}</button>
          </div>

          {diario.length>0 && (
            <section className="diary">
              <div className="eyebrow">Diario</div>
              {[...diario].sort((a,b)=>(ORD[a.pasto]??9)-(ORD[b.pasto]??9)).map(d=>(
                <div className="ditem" key={d.id}>
                  <span className="dpasto">{d.pasto}</span>
                  <span className="dmac">{d.kcal} kcal · P {d.prot}</span>
                  <button onClick={()=>rimuovi(d.id)}><X size={15}/></button>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {tab==="settimana" && <div className="soon">La visione settimanale è il prossimo blocco.<br/><em>Intanto i dati si stanno accumulando: ogni giornata che registri finirà qui dentro.</em></div>}
      {tab==="sport" && <div className="soon">La sezione sport arriva subito dopo.<br/><em>Le 268 sessioni storiche sono già nel database, vanno solo mostrate.</em></div>}
    </div>
  );
}

const CSS = `
.cfg-wrap{ --surface:#EDF0EE; --card:#fff; --ink:#14171B; --muted:#6B7580; --line:#E0E5E1;
  --fuel:#E6A017; --fuelHi:#F2B233; --over:#D9503B; --prot:#0E8C7F; --box:#F5F7F5;
  max-width:440px; margin:0 auto; padding:18px 16px 40px; background:var(--surface); color:var(--ink);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; -webkit-tap-highlight-color:transparent; }
.cfg-wrap *{ box-sizing:border-box; }
.cfg-wrap button{ font-family:inherit; cursor:pointer; }
.eyebrow{ text-transform:uppercase; letter-spacing:.09em; font-size:10px; font-weight:700; color:var(--muted); }
.cfg-head h1{ margin:2px 0 0; font-size:26px; font-weight:800; letter-spacing:-.02em; }

.daybar{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:12px 13px; margin:14px 0 12px; }
.dchips{ display:flex; gap:6px; flex-wrap:wrap; margin:9px 0 11px; }
.dchip{ padding:8px 12px; border:1px solid var(--line); background:var(--surface); border-radius:20px; font-size:12.5px; font-weight:700; color:var(--muted); }
.dchip.on{ background:var(--ink); color:#fff; border-color:var(--ink); }
.planned{ display:flex; align-items:center; justify-content:space-between; }
.planned span{ font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); font-weight:700; }
.pinput{ display:flex; align-items:center; gap:10px; background:var(--surface); border:1px solid var(--line); border-radius:11px; padding:5px 8px; }
.pinput button{ width:28px; height:28px; border:none; background:var(--card); border-radius:8px; font-size:18px; font-weight:700; box-shadow:0 1px 2px rgba(0,0,0,.05); }
.pinput b{ font-variant-numeric:tabular-nums; min-width:44px; text-align:right; font-size:16px; }
.pinput em{ font-style:normal; font-size:11px; color:var(--muted); }

.gauge{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:15px 16px 12px; margin-bottom:18px; }
.gauge-top{ display:flex; justify-content:space-between; align-items:baseline; margin-bottom:9px; }
.gnum b{ font-size:30px; font-weight:800; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
.gnum span{ font-size:13px; color:var(--muted); margin-left:6px; font-weight:600; }
.gstate{ font-size:12px; font-weight:700; color:var(--prot); } .gstate.over{ color:var(--over); }
.bar{ position:relative; height:14px; background:#E8ECE8; border-radius:8px; overflow:hidden; }
.fill{ position:absolute; inset:0 auto 0 0; height:100%; border-radius:8px; transition:width .35s cubic-bezier(.2,.7,.2,1); }
.fill.preview{ background:repeating-linear-gradient(135deg,#F5DFA6 0 7px,#F0D488 7px 14px); }
.fill:not(.preview){ background:linear-gradient(90deg,var(--fuel),var(--fuelHi)); }
.fill.over{ background:linear-gradient(90deg,var(--over),#E7715C); }
.ptrack-row{ display:flex; align-items:center; gap:9px; margin-top:11px; }
.plabel{ font-size:10px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); font-weight:700; width:58px; }
.ptrack{ flex:1; height:6px; background:#E8ECE8; border-radius:4px; overflow:hidden; }
.pfill{ height:100%; background:var(--prot); border-radius:4px; transition:width .35s; }
.pval{ font-size:12px; color:var(--muted); font-variant-numeric:tabular-nums; } .pval b{ color:var(--ink); }
.reale{ display:flex; align-items:center; justify-content:space-between; margin-top:12px; padding-top:11px; border-top:1px solid var(--line); }
.reale label{ display:flex; align-items:center; gap:8px; } 
.reale span{ font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); font-weight:700; }
.reale input{ width:70px; text-align:right; border:1px solid var(--line); background:var(--surface); border-radius:8px; padding:6px 8px; font-size:14px; font-weight:700; font-variant-numeric:tabular-nums; }
.delta{ font-size:11px; font-weight:700; color:var(--prot); } .delta.over{ color:var(--over); }

.tabs{ display:flex; gap:6px; margin-bottom:12px; }
.tab{ flex:1; padding:10px; border:1px solid var(--line); background:var(--card); border-radius:11px; font-size:14px; font-weight:700; color:var(--muted); }
.tab.on{ background:var(--ink); color:#fff; border-color:var(--ink); }
.tab .tdot{ display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--fuel); margin-left:6px; vertical-align:middle; }
.tab.on .tdot{ background:var(--fuelHi); }
.tpls{ display:flex; gap:7px; overflow-x:auto; padding-bottom:4px; margin-bottom:14px; scrollbar-width:none; }
.tpls::-webkit-scrollbar{ display:none; }
.chip{ white-space:nowrap; padding:8px 13px; border:1px solid var(--line); background:var(--card); border-radius:20px; font-size:12.5px; font-weight:600; color:var(--muted); }
.chip.on{ background:#EAF4F1; color:var(--prot); border-color:var(--prot); }

.slot{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:11px 12px; margin-bottom:9px; }
.slot-head{ display:flex; align-items:center; gap:8px; margin-bottom:9px; }
.slot-head span{ font-size:11px; text-transform:uppercase; letter-spacing:.06em; font-weight:800; }
.slot-head em{ font-style:normal; font-size:10px; color:var(--muted); font-weight:600; }
.group{ background:var(--box); border:1px solid var(--line); border-radius:11px; padding:8px 9px; margin-bottom:7px; }
.group:last-child{ margin-bottom:0; }
.group-head{ display:flex; align-items:baseline; gap:7px; font-size:10px; text-transform:uppercase; letter-spacing:.05em; font-weight:800; color:var(--muted); margin-bottom:7px; }
.group-head em{ font-style:normal; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:6px; padding:1px 6px; font-size:10px; }
.opts{ display:flex; flex-wrap:wrap; gap:6px; }
.opt{ display:inline-flex; align-items:center; gap:6px; padding:7px 10px; border:1px solid var(--line); background:var(--card); border-radius:10px; font-size:12.5px; font-weight:600; color:var(--ink); }
.group .opt{ background:#fff; }
.opt.on{ background:var(--ink); color:#fff; border-color:var(--ink); }
.okcal{ font-size:11px; color:var(--muted); font-variant-numeric:tabular-nums; }
.opt.on .okcal{ color:#B9C0C4; }
.dot{ width:8px; height:8px; border-radius:50%; flex:none; }
.veg{ display:flex; flex-direction:column; gap:10px; }
.stepper{ display:flex; align-items:center; gap:14px; align-self:flex-start; background:var(--box); border:1px solid var(--line); border-radius:11px; padding:5px 8px; }
.stepper.sm{ gap:10px; padding:4px 6px; }
.stepper button{ width:30px; height:30px; border:none; background:var(--card); border-radius:8px; font-size:19px; font-weight:700; color:var(--ink); box-shadow:0 1px 2px rgba(0,0,0,.05); }
.stepper b{ font-variant-numeric:tabular-nums; min-width:52px; text-align:center; font-size:15px; }

.extra .addextra{ display:inline-flex; align-items:center; gap:5px; margin-top:2px; padding:8px 12px; border:1px dashed var(--muted); background:transparent; border-radius:10px; font-size:12.5px; font-weight:700; color:var(--muted); }
.exchip{ display:inline-flex; align-items:center; gap:6px; padding:6px 8px 6px 10px; background:#FBEFD6; border:1px solid #EAD3A0; border-radius:9px; font-size:12px; font-weight:600; font-variant-numeric:tabular-nums; }
.exchip button{ border:none; background:none; display:flex; color:#9A7B2E; padding:0; }
.picker{ margin-top:4px; }
.psearch{ display:flex; align-items:center; gap:7px; background:var(--box); border:1px solid var(--line); border-radius:10px; padding:7px 10px; color:var(--muted); }
.psearch input{ border:none; background:none; outline:none; font-size:14px; flex:1; color:var(--ink); }
.plist{ max-height:190px; overflow-y:auto; margin:8px 0; display:flex; flex-direction:column; gap:3px; }
.prow{ display:flex; align-items:center; gap:8px; padding:8px 10px; border:1px solid transparent; background:var(--box); border-radius:8px; font-size:13px; font-weight:600; text-align:left; }
.prow span{ flex:1; } .prow em{ font-style:normal; font-size:11px; color:var(--muted); font-variant-numeric:tabular-nums; }
.prow.on{ border-color:var(--ink); background:#fff; }
.pfoot{ display:flex; align-items:center; gap:8px; }
.pcancel{ margin-left:auto; border:none; background:none; color:var(--muted); font-size:13px; font-weight:700; padding:8px; }
.padd{ border:none; background:var(--ink); color:#fff; border-radius:10px; padding:9px 15px; font-size:13px; font-weight:700; }
.padd:disabled{ opacity:.4; }

.total{ display:flex; justify-content:space-between; align-items:center; margin-top:16px; padding:14px 16px; background:var(--ink); border-radius:15px; color:#fff; }
.tnum{ font-size:16px; font-weight:700; font-variant-numeric:tabular-nums; } .tnum b{ font-size:20px; }
.ttarget{ font-size:11px; color:#9AA2A8; margin-top:2px; }
.add{ display:inline-flex; align-items:center; gap:5px; background:var(--fuel); color:#3A2A00; border:none; padding:11px 15px; border-radius:11px; font-size:14px; font-weight:800; }
.diary{ margin-top:22px; } .diary .eyebrow{ margin-bottom:8px; }
.ditem{ display:flex; align-items:center; gap:10px; padding:11px 13px; background:var(--card); border:1px solid var(--line); border-radius:11px; margin-bottom:7px; }
.dpasto{ font-weight:700; font-size:14px; }
.dmac{ margin-left:auto; font-size:12.5px; color:var(--muted); font-variant-numeric:tabular-nums; }
.ditem button{ border:none; background:none; color:var(--muted); display:flex; padding:2px; }

.loader{ padding:60px 20px; text-align:center; color:var(--muted); font-size:15px; font-weight:600; }
.errore{ background:#FCEBE8; border:1px solid #F0C4BC; color:#B23A28; border-radius:10px; padding:9px 12px; font-size:12.5px; margin-bottom:12px; }
.editnote{ background:#EAF4F1; border:1px solid #BFE1DA; color:#0E6B60; border-radius:10px; padding:9px 12px; font-size:12.5px; font-weight:600; margin-bottom:12px; }
.cfg-head{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; }
.hactions{ display:flex; align-items:center; gap:8px; }
.pswitch{ display:flex; background:var(--card); border:1px solid var(--line); border-radius:11px; padding:3px; gap:2px; }
.pswitch button{ border:none; background:none; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:700; color:var(--muted); }
.pswitch button.on{ background:var(--ink); color:#fff; }
.editbtn{ width:40px; height:40px; border:1px solid var(--line); background:var(--card); border-radius:11px; color:var(--muted); display:flex; align-items:center; justify-content:center; }
.editbtn.on{ background:var(--prot); color:#fff; border-color:var(--prot); }
.datebar{ display:flex; align-items:center; gap:8px; margin:10px 0 12px; }
.datebar input{ border:1px solid var(--line); background:var(--card); border-radius:10px; padding:8px 10px; font-size:14px; font-weight:600; color:var(--ink); font-family:inherit; }
.oggi{ border:1px solid var(--line); background:var(--card); border-radius:10px; padding:8px 12px; font-size:12.5px; font-weight:700; color:var(--prot); }
.maintabs{ display:flex; gap:5px; margin-bottom:16px; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:4px; }
.mtab{ flex:1; padding:9px 4px; border:none; background:none; border-radius:9px; font-size:12.5px; font-weight:700; color:var(--muted); }
.mtab.on{ background:var(--ink); color:#fff; }
.opt.hid{ opacity:.55; border-style:dashed; }
.opt.hid .oname{ text-decoration:line-through; }
.card{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:14px 15px; margin-bottom:12px; }
.pesorow{ display:flex; gap:8px; margin:9px 0 12px; }
.pesorow input{ flex:1; border:1px solid var(--line); background:var(--surface); border-radius:10px; padding:11px 12px; font-size:19px; font-weight:800; color:var(--ink); font-variant-numeric:tabular-nums; }
.mediabox{ background:var(--box); border:1px solid var(--line); border-radius:11px; padding:11px 12px; }
.mediabox b{ font-size:23px; font-weight:800; letter-spacing:-.02em; }
.mediabox span{ display:block; font-size:11px; color:var(--muted); font-weight:600; margin-top:2px; }
.spark{ display:flex; align-items:flex-end; gap:3px; height:56px; margin-top:12px; }
.sbar{ flex:1; height:100%; display:flex; align-items:flex-end; }
.sfill{ width:100%; background:var(--prot); border-radius:3px 3px 0 0; opacity:.75; }
.mrow{ display:flex; justify-content:space-between; align-items:center; padding:8px 0; font-size:13.5px; border-bottom:1px solid var(--line); }
.mrow:last-child{ border-bottom:none; }
.mrow span{ color:var(--muted); font-weight:600; }
.mrow b{ font-variant-numeric:tabular-nums; font-weight:700; }
.mrow.tot b{ color:var(--ink); }
.mrow.big{ padding-top:11px; } .mrow.big span{ color:var(--ink); font-weight:800; } .mrow.big b{ font-size:24px; font-weight:800; }
.ministep{ display:flex; align-items:center; gap:9px; }
.ministep button{ width:26px; height:26px; border:1px solid var(--line); background:var(--surface); border-radius:7px; font-size:16px; font-weight:700; }
.macrogrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:10px 0 12px; }
.mc{ background:var(--box); border:1px solid var(--line); border-radius:11px; padding:10px 9px; text-align:center; }
.mc b{ display:block; font-size:19px; font-weight:800; letter-spacing:-.02em; }
.mc span{ display:block; font-size:11px; font-weight:700; margin-top:1px; }
.mc em{ display:block; font-style:normal; font-size:9.5px; color:var(--muted); margin-top:3px; line-height:1.3; }
.mc.p b{ color:var(--prot); } .mc.c b{ color:#C58A0E; } .mc.g b{ color:#8A6FB0; }
.fattori{ font-size:11.5px; color:var(--muted); line-height:1.5; background:var(--box); border-radius:9px; padding:9px 10px; }
.fattori b{ color:var(--ink); font-variant-numeric:tabular-nums; }
.fattori em{ font-style:normal; color:#B2761C; font-weight:600; }
.fbadge{ font-style:normal; margin-left:auto; font-size:10px; font-weight:800; color:#B2761C; background:#FBEFD6; border:1px solid #EAD3A0; border-radius:6px; padding:2px 6px; font-variant-numeric:tabular-nums; }
.tri{ display:flex; gap:10px; margin-top:12px; }
.tri-i{ flex:1; }
.tri-h{ display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px; }
.tri-h span{ font-size:10px; font-weight:800; letter-spacing:.05em; color:var(--muted); }
.tri-h em{ font-style:normal; font-size:10.5px; color:var(--muted); font-variant-numeric:tabular-nums; }
.pfill.prot{ background:var(--prot); } .pfill.carb{ background:var(--fuel); } .pfill.fat{ background:#8A6FB0; }
.soon{ background:var(--card); border:1px dashed var(--line); border-radius:14px; padding:34px 20px; text-align:center; color:var(--muted); font-size:14px; font-weight:600; line-height:1.6; }
.soon em{ font-style:normal; font-size:12px; opacity:.8; }

/* --- fix leggibilita input: forza tema chiaro anche in dark mode (Android) --- */
.cfg-wrap input, .cfg-wrap input[type="date"], .cfg-wrap input[type="number"], .cfg-wrap input[type="text"]{
  color-scheme: light !important;
  background-color: #fff !important;
  color: #14171B !important;
  -webkit-text-fill-color: #14171B !important;
  opacity: 1 !important;
}
.cfg-wrap input::placeholder{ color:#8A939C !important; -webkit-text-fill-color:#8A939C !important; opacity:1 !important; }
.cfg-wrap input::-webkit-date-and-time-value{ color:#14171B !important; -webkit-text-fill-color:#14171B !important; text-align:left; }
.cfg-wrap input::-webkit-calendar-picker-indicator{ filter:none; opacity:.7; }
/* contrasto generale piu' marcato sui testi secondari */
.cfg-wrap{ --muted:#5A6570; }
.okcal, .tri-h em, .mc em, .fattori, .eyebrow, .slot-head em, .group-head{ color:#5A6570; }
.opt.on .okcal{ color:#C6CDD2 !important; }
.ttarget{ color:#A8B0B6 !important; }
`;