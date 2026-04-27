import { useState, useEffect } from "react";

const MEDS = [
  { id: "hrt",     label: "HRT",             icon: "🌸", color: "#7b3f7c", light: "#f5eef8", takenBorder: "#ce93d8" },
  { id: "antidep", label: "Antidepressant",  icon: "☀️", color: "#1565c0", light: "#e3f2fd", takenBorder: "#90caf9" },
  { id: "adhd",    label: "ADHD Medication", icon: "⚡", color: "#2e7d32", light: "#e8f5e9", takenBorder: "#a5d6a7" },
];

const SYMPTOMS = [
  { id: "exhaustion",   label: "Exhaustion / Fatigue",      icon: "😴", category: "energy" },
  { id: "sleep",        label: "Poor Sleep",                 icon: "🌙", category: "energy" },
  { id: "bloating",     label: "Bloating",                   icon: "🫃", category: "gut" },
  { id: "cramping",     label: "Abdominal Cramping",         icon: "⚡", category: "gut" },
  { id: "diarrhea",     label: "Diarrhea / Loose Stool",    icon: "🚽", category: "gut" },
  { id: "constipation", label: "Constipation",               icon: "🧱", category: "gut" },
  { id: "hotflash",     label: "Hot Flash / Night Sweat",   icon: "🔥", category: "menopause" },
  { id: "mood",         label: "Mood Swings / Irritability", icon: "🌊", category: "menopause" },
  { id: "brainfog",     label: "Brain Fog",                  icon: "🌫️", category: "menopause" },
  { id: "jointpain",    label: "Joint / Muscle Pain",        icon: "🦴", category: "pain" },
  { id: "anxiety",      label: "Anxiety",                    icon: "💭", category: "mental" },
  { id: "focus",        label: "Poor Focus / Concentration", icon: "🎯", category: "mental" },
];

const CATEGORIES = [
  { id: "energy",    label: "Energy & Sleep" },
  { id: "pain",      label: "Pain" },
  { id: "gut",       label: "Gut / IBS" },
  { id: "menopause", label: "Menopause Symptoms" },
  { id: "mental",    label: "Mental & Emotional" },
];

const HEADACHE_LOCATIONS = ["Forehead","Temples","Back of head","One side only","Top of head","Behind eyes","Whole head"];
const HEADACHE_TYPES     = ["Throbbing","Pressure / tight band","Stabbing","Dull ache","Burning","Post-concussion (familiar feeling)"];
const HEADACHE_TRIGGERS  = ["Missed HRT dose","Missed antidepressant","Missed ADHD med","Stress","Hormones","Poor sleep","Dehydration","Bright light","Strong smells","Food / caffeine","Screen time","Weather change","Neck tension","Physical activity","Unknown"];

const SEV_LABELS = ["None","Mild","Moderate","Severe"];
const SEV_COLORS = ["#e8f5e9","#fff9c4","#ffe0b2","#ffcdd2"];
const SEV_TEXT   = ["#388e3c","#f9a825","#e65100","#c62828"];

function today() { return new Date().toISOString().split("T")[0]; }
function fmtDate(ds) {
  return new Date(ds + "T00:00:00").toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
}
function calcStreak(medsData, medId) {
  let n = 0;
  const d = new Date(today() + "T00:00:00");
  while (true) {
    const k = d.toISOString().split("T")[0];
    if (medsData[k]?.[medId]) { n++; d.setDate(d.getDate()-1); } else break;
  }
  return n;
}

const NAV_BTN = { width:40,height:40,borderRadius:"50%",border:"1px solid #e0d0e8",background:"white",fontSize:22,cursor:"pointer",color:"#7b3f7c" };
const CARD    = { background:"white",borderRadius:14,padding:18,marginBottom:14,boxShadow:"0 2px 10px rgba(123,63,124,0.08)" };
const SEC_LBL = { fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#7b3f7c",fontFamily:"sans-serif",marginBottom:10,paddingBottom:4,borderBottom:"1px solid #e8d5f0" };
const SAVE_BTN = (saved) => ({ width:"100%",padding:16,borderRadius:12,border:"none",background:saved?"#388e3c":"linear-gradient(135deg,#7b3f7c,#c2687c)",color:"white",fontSize:16,fontFamily:"inherit",cursor:"pointer",transition:"all 0.3s" });

export default function App() {
  const [entries,   setEntries]   = useState({});
  const [headaches, setHeadaches] = useState({});
  const [medsLog,   setMedsLog]   = useState({});
  const [notes,     setNotes]     = useState({});
  const [date,      setDate]      = useState(today());
  const [view,      setView]      = useState("log");
  const [saved,     setSaved]     = useState(false);
  const [pulse,     setPulse]     = useState({});
  const [summary,   setSummary]   = useState(null);
  const [genning,   setGenning]   = useState(false);

  useEffect(() => {
    (async () => {
      try { const r=await window.storage.get("v2-entries");   if(r) setEntries(JSON.parse(r.value));   } catch{}
      try { const r=await window.storage.get("v2-headaches"); if(r) setHeadaches(JSON.parse(r.value)); } catch{}
      try { const r=await window.storage.get("v2-meds");      if(r) setMedsLog(JSON.parse(r.value));   } catch{}
      try { const r=await window.storage.get("v2-notes");     if(r) setNotes(JSON.parse(r.value));     } catch{}
    })();
  }, []);

  const dayEntry    = entries[date]   || {};
  const EMPTY_H     = { severity:0,locations:[],types:[],triggers:[],startTime:"",medication:"",relieved:"" };
  const dayH        = headaches[date] || EMPTY_H;
  const dayMeds     = medsLog[date]   || {};
  const dayNotes    = notes[date]     || "";
  const hasH        = dayH.severity > 0;
  const allTaken    = MEDS.every(m => dayMeds[m.id]);
  const missedToday = date===today() && MEDS.filter(m=>!dayMeds[m.id]);

  const allDates = [...new Set([...Object.keys(entries),...Object.keys(headaches),...Object.keys(medsLog)])].sort((a,b)=>b.localeCompare(a));

  function toggleMed(id) {
    const next = !dayMeds[id];
    setMedsLog(p=>({...p,[date]:{...(p[date]||{}),[id]:next}}));
    if(next){ setPulse(p=>({...p,[id]:true})); setTimeout(()=>setPulse(p=>({...p,[id]:false})),600); }
  }
  function setSev(id,lv)   { setEntries(p=>({...p,[date]:{...(p[date]||{}),[id]:lv}})); }
  function setHSev(lv)     { setHeadaches(p=>({...p,[date]:{...(p[date]||EMPTY_H),severity:lv}})); }
  function toggleChip(f,v) {
    const cur=dayH[f]||[]; const next=cur.includes(v)?cur.filter(x=>x!==v):[...cur,v];
    setHeadaches(p=>({...p,[date]:{...(p[date]||EMPTY_H),[f]:next}}));
  }
  function setHF(f,v) { setHeadaches(p=>({...p,[date]:{...(p[date]||EMPTY_H),[f]:v}})); }

  async function save() {
    await window.storage.set("v2-entries",   JSON.stringify(entries));
    await window.storage.set("v2-headaches", JSON.stringify(headaches));
    await window.storage.set("v2-meds",      JSON.stringify(medsLog));
    await window.storage.set("v2-notes",     JSON.stringify(notes));
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  }

  async function generateSummary() {
    setGenning(true); setSummary(null); setView("summary");

    // Build data snapshot for Claude to summarize
    const headacheDays = allDates.filter(d=>headaches[d]?.severity>0);
    const postConcussionDays = headacheDays.filter(d=>headaches[d]?.types?.includes("Post-concussion (familiar feeling)"));
    const symptomTotals = {};
    SYMPTOMS.forEach(s=>{ symptomTotals[s.id]=0; });
    allDates.forEach(d=>{ SYMPTOMS.forEach(s=>{ symptomTotals[s.id]+=(entries[d]?.[s.id]||0); }); });
    const topSymptoms = SYMPTOMS.map(s=>({...s,total:symptomTotals[s.id]})).filter(s=>s.total>0).sort((a,b)=>b.total-a.total);

    const medAdherence = MEDS.map(m=>{
      const loggedDays = allDates.filter(d=>medsLog[d]?.[m.id]!==undefined);
      const takenDays  = allDates.filter(d=>medsLog[d]?.[m.id]===true);
      return { ...m, taken:takenDays.length, logged:loggedDays.length, pct: loggedDays.length>0?Math.round(takenDays.length/loggedDays.length*100):null };
    });

    const dailyLog = allDates.slice(0,30).map(d=>{
      const daySyms = SYMPTOMS.filter(s=>(entries[d]?.[s.id]||0)>0).map(s=>`${s.label}: ${SEV_LABELS[entries[d][s.id]]}`);
      const h = headaches[d];
      const m = medsLog[d];
      return {
        date: fmtDate(d),
        symptoms: daySyms,
        headache: h?.severity>0 ? { severity:SEV_LABELS[h.severity], locations:h.locations, types:h.types, triggers:h.triggers, medication:h.medication, relieved:h.relieved, startTime:h.startTime } : null,
        meds: MEDS.map(med=>({ name:med.label, taken:m?.[med.id]??null })),
        notes: notes[d]||"",
      };
    });

    const prompt = `You are a medical scribe helping a patient prepare a summary for their doctor. 

Patient profile:
- Female, 51, menopausal
- Overweight
- On HRT, antidepressant, and ADHD medication (often forgets doses)
- History of concussion in 2016
- Reporting: exhaustion, headaches (some feel like post-concussion), IBS symptoms

Tracked data summary:
- Days tracked: ${allDates.length}
- Headache days: ${headacheDays.length}
- Post-concussion type headaches: ${postConcussionDays.length}
- Top symptoms by severity: ${topSymptoms.slice(0,5).map(s=>`${s.label} (${s.total} pts)`).join(", ")||"none logged yet"}
- Medication adherence: ${medAdherence.map(m=>m.pct!==null?`${m.label}: ${m.pct}% (${m.taken}/${m.logged} days)`:`${m.label}: not yet tracked`).join(", ")}

Daily log (most recent first):
${JSON.stringify(dailyLog, null, 2)}

Write a clear, professional health summary a doctor would find useful. Structure it with these sections:
1. Patient Overview (2-3 sentences)
2. Primary Concerns (bullet points)
3. Symptom Patterns (what you notice across the data)
4. Medication Adherence (per med, with any observed correlations between missed doses and symptoms)
5. Headache Analysis (frequency, types, triggers, post-concussion flag if relevant)
6. Suggested Discussion Points for Appointment (5-7 questions the patient should raise)

Be specific, cite actual numbers from the data, and flag the concussion history prominently if post-concussion headaches were logged. Keep it concise but thorough. Use plain language the patient can also understand.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1500,
          messages:[{role:"user",content:prompt}]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text || "Could not generate summary.";
      setSummary(text);
    } catch(e) {
      setSummary("Error generating summary. Please try again.");
    }
    setGenning(false);
  }

  // Reusable chip style
  const chip = (active, warn) => ({
    padding:"7px 13px",borderRadius:20,border:"none",fontSize:12,cursor:"pointer",
    fontFamily:"sans-serif",transition:"all 0.15s",
    background: active?(warn?"#c62828":"#7b3f7c"):"#f0eaf5",
    color: active?"white":"#888",
    fontWeight: active?"bold":"normal",
  });

  // Med panel — appears on log + headache tabs
  const MedPanel = () => (
    <div style={{...CARD,padding:"16px 18px"}}>
      <div style={SEC_LBL}>Daily Medications</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {MEDS.map(med=>{
          const taken  = dayMeds[med.id]||false;
          const streak = calcStreak(medsLog, med.id);
          return (
            <div key={med.id} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              background:taken?med.light:"#fffaf4",
              border:`1.5px solid ${taken?med.takenBorder:"#ffcc80"}`,
              borderRadius:12,padding:"11px 14px",transition:"all 0.2s",
            }}>
              <div>
                <div style={{fontSize:13,marginBottom:2}}>
                  {med.icon} <strong>{med.label}</strong>
                  {taken&&streak>1&&<span style={{marginLeft:8,fontSize:11,color:"#999",fontFamily:"sans-serif"}}>🔥 {streak}-day streak</span>}
                </div>
                <div style={{fontSize:11,fontFamily:"sans-serif",color:taken?"#666":"#e65100"}}>
                  {taken?"Taken ✓":date===today()?"⚠️ Not logged yet":"Not logged"}
                </div>
              </div>
              <button onClick={()=>toggleMed(med.id)} style={{
                padding:"9px 16px",borderRadius:20,border:"none",cursor:"pointer",
                fontFamily:"sans-serif",fontSize:12,fontWeight:"bold",transition:"all 0.25s",
                background:taken?med.color:"#e65100",color:"white",
                transform:pulse[med.id]?"scale(1.15)":"scale(1)",
              }}>{taken?"✓ Taken":"Mark Taken"}</button>
            </div>
          );
        })}
      </div>
      {allTaken&&<div style={{marginTop:12,textAlign:"center",fontSize:12,fontFamily:"sans-serif",color:"#388e3c",fontWeight:"bold"}}>🎉 All medications taken today!</div>}
    </div>
  );

  const DateNav = () => (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
      <button onClick={()=>{const d=new Date(date);d.setDate(d.getDate()-1);setDate(d.toISOString().split("T")[0]);}} style={NAV_BTN}>‹</button>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:17,fontWeight:"bold",color:"#7b3f7c"}}>{fmtDate(date)}</div>
        {date===today()&&<div style={{fontSize:11,color:"#c2687c",letterSpacing:1}}>TODAY</div>}
      </div>
      <button onClick={()=>{const d=new Date(date);d.setDate(d.getDate()+1);const n=d.toISOString().split("T")[0];if(n<=today())setDate(n);}}
        style={{...NAV_BTN,opacity:date===today()?0.3:1}} disabled={date===today()}>›</button>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#fdf6f0 0%,#fce8e8 50%,#f0e8f8 100%)",fontFamily:"'Georgia','Times New Roman',serif",color:"#2d1b2e"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#7b3f7c 0%,#c2687c 100%)",color:"white",padding:"22px 24px 16px",textAlign:"center",boxShadow:"0 4px 20px rgba(123,63,124,0.3)"}}>
        <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",opacity:0.85,marginBottom:3}}>Women's Health</div>
        <h1 style={{margin:0,fontSize:23,fontWeight:"normal",letterSpacing:1}}>Symptom Journal</h1>
        <p style={{margin:"3px 0 0",fontSize:12,opacity:0.8}}>Track · Understand · Share with your doctor</p>
        {missedToday?.length>0&&(
          <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
            {missedToday.map(m=>(
              <span key={m.id} style={{background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"3px 11px",fontSize:11}}>
                {m.icon} Take your {m.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{display:"flex",borderBottom:"1px solid #e0d0e8",background:"white"}}>
        {[{key:"log",label:"📝 Symptoms"},{key:"headache",label:"🤕 Headache"},{key:"history",label:"📅 History"},{key:"summary",label:"📋 Summary"}].map(tab=>(
          <button key={tab.key} onClick={()=>setView(tab.key)} style={{
            flex:1,padding:"12px 4px",border:"none",background:"none",cursor:"pointer",
            fontSize:11,fontFamily:"inherit",
            borderBottom:view===tab.key?"3px solid #7b3f7c":"3px solid transparent",
            color:view===tab.key?"#7b3f7c":"#888",
            fontWeight:view===tab.key?"bold":"normal",transition:"all 0.2s",
          }}>{tab.label}</button>
        ))}
      </div>

      <div style={{maxWidth:560,margin:"0 auto",padding:"20px 16px 80px"}}>

        {/* ── SYMPTOMS TAB ── */}
        {view==="log"&&(<>
          <DateNav/>
          <MedPanel/>

          {/* Headache quick-link */}
          <div onClick={()=>setView("headache")} style={{
            ...CARD,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",
            border:hasH?"1.5px solid #e57373":"1.5px dashed #ddd",
            background:hasH?"#fff5f5":"white",
          }}>
            <div>
              <div style={{fontSize:14}}>🤕 Headache</div>
              <div style={{fontSize:12,color:hasH?"#c62828":"#bbb",fontFamily:"sans-serif",marginTop:3}}>
                {hasH?`${SEV_LABELS[dayH.severity]}${dayH.types?.includes("Post-concussion (familiar feeling)")?" · ⚠️ Post-concussion":""} · tap to edit`:"Tap to log headache →"}
              </div>
            </div>
            <div style={{fontSize:20}}>{hasH?"🔴":"➕"}</div>
          </div>

          {CATEGORIES.map(cat=>{
            const catS=SYMPTOMS.filter(s=>s.category===cat.id);
            return(
              <div key={cat.id} style={{marginBottom:18}}>
                <div style={SEC_LBL}>{cat.label}</div>
                {catS.map(s=>{
                  const val=dayEntry[s.id]||0;
                  return(
                    <div key={s.id} style={{...CARD,border:val>0?`1px solid ${SEV_COLORS[val]}`:"1px solid transparent",marginBottom:8,padding:"12px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:13}}>{s.icon} {s.label}</span>
                        {val>0&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:SEV_COLORS[val],color:SEV_TEXT[val],fontFamily:"sans-serif"}}>{SEV_LABELS[val]}</span>}
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        {[0,1,2,3].map(lv=>(
                          <button key={lv} onClick={()=>setSev(s.id,lv)} style={{
                            flex:1,padding:"7px 2px",border:"none",borderRadius:8,cursor:"pointer",
                            fontFamily:"sans-serif",fontSize:11,transition:"all 0.15s",
                            background:val===lv?(lv===0?"#e8f5e9":SEV_COLORS[lv]):"#f5f0f8",
                            color:val===lv?(lv===0?"#388e3c":SEV_TEXT[lv]):"#999",
                            fontWeight:val===lv?"bold":"normal",
                          }}>{SEV_LABELS[lv]}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div style={{marginBottom:20}}>
            <div style={SEC_LBL}>Notes for this day</div>
            <textarea value={dayNotes} onChange={e=>setNotes(p=>({...p,[date]:e.target.value}))}
              placeholder="Food, water, stress, exercise, how you're feeling…"
              style={{width:"100%",minHeight:85,padding:14,borderRadius:12,border:"1px solid #e0d0e8",fontFamily:"inherit",fontSize:14,background:"white",color:"#2d1b2e",resize:"vertical",boxSizing:"border-box",outline:"none"}}/>
          </div>
          <button onClick={save} style={SAVE_BTN(saved)}>{saved?"✓ Saved!":"Save Entry"}</button>
        </>)}

        {/* ── HEADACHE TAB ── */}
        {view==="headache"&&(<>
          <DateNav/>
          <MedPanel/>

          <div style={{background:"#fff3e0",border:"1px solid #ffb74d",borderRadius:12,padding:"12px 16px",marginBottom:14,fontFamily:"sans-serif",fontSize:12,color:"#e65100"}}>
            <strong>⚠️ Concussion history noted (2016).</strong> If this feels like your post-concussion headaches, select that type below.
          </div>

          <div style={CARD}>
            <div style={SEC_LBL}>Headache severity</div>
            <div style={{display:"flex",gap:8}}>
              {[0,1,2,3].map(lv=>(
                <button key={lv} onClick={()=>setHSev(lv)} style={{
                  flex:1,padding:"13px 4px",border:"none",borderRadius:10,cursor:"pointer",
                  fontFamily:"sans-serif",fontSize:12,transition:"all 0.15s",
                  background:dayH.severity===lv?(lv===0?"#e8f5e9":SEV_COLORS[lv]):"#f5f0f8",
                  color:dayH.severity===lv?(lv===0?"#388e3c":SEV_TEXT[lv]):"#999",
                  fontWeight:dayH.severity===lv?"bold":"normal",
                  transform:dayH.severity===lv?"scale(1.04)":"scale(1)",
                }}>{lv===0?"None":["😐","😣","😫"][lv-1]+" "+SEV_LABELS[lv]}</button>
              ))}
            </div>
          </div>

          {hasH&&(<>
            <div style={CARD}>
              <div style={SEC_LBL}>Where is the pain? <span style={{color:"#bbb",textTransform:"none",letterSpacing:0}}>(all that apply)</span></div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {HEADACHE_LOCATIONS.map(loc=><button key={loc} onClick={()=>toggleChip("locations",loc)} style={chip(dayH.locations?.includes(loc))}>{loc}</button>)}
              </div>
            </div>

            <div style={CARD}>
              <div style={SEC_LBL}>What does it feel like?</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {HEADACHE_TYPES.map(t=>{
                  const isPC=t==="Post-concussion (familiar feeling)";
                  const active=dayH.types?.includes(t);
                  return(
                    <button key={t} onClick={()=>toggleChip("types",t)} style={{
                      ...chip(active,isPC&&active),
                      border:isPC&&!active?"1px dashed #ffb74d":"none",
                      color:isPC&&!active?"#e65100":(active?"white":"#888"),
                      background:isPC&&!active?"#fff8f0":(active?(isPC?"#c62828":"#7b3f7c"):"#f0eaf5"),
                    }}>{isPC?"⚠️ "+t:t}</button>
                  );
                })}
              </div>
              {dayH.types?.includes("Post-concussion (familiar feeling)")&&(
                <div style={{marginTop:10,padding:"8px 12px",background:"#ffebee",borderRadius:8,fontSize:11,color:"#c62828",fontFamily:"sans-serif"}}>
                  This will be flagged prominently in your doctor summary.
                </div>
              )}
            </div>

            <div style={CARD}>
              <div style={SEC_LBL}>Possible triggers?</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {HEADACHE_TRIGGERS.map(t=>{
                  const isMed=t.startsWith("Missed");
                  const active=dayH.triggers?.includes(t);
                  return(
                    <button key={t} onClick={()=>toggleChip("triggers",t)} style={{
                      ...chip(active),
                      border:isMed&&!active?"1px dashed #ffb74d":"none",
                      color:isMed&&!active?"#e65100":(active?"white":"#888"),
                      background:isMed&&!active?"#fff8f0":(active?"#7b3f7c":"#f0eaf5"),
                    }}>{isMed?"💊 "+t:t}</button>
                  );
                })}
              </div>
            </div>

            <div style={CARD}>
              <div style={SEC_LBL}>More details</div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,color:"#888",fontFamily:"sans-serif",display:"block",marginBottom:6}}>Approx. start time</label>
                <input type="time" value={dayH.startTime||""} onChange={e=>setHF("startTime",e.target.value)}
                  style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid #e0d0e8",fontFamily:"inherit",fontSize:14,boxSizing:"border-box",outline:"none"}}/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,color:"#888",fontFamily:"sans-serif",display:"block",marginBottom:6}}>Pain relief taken</label>
                <input type="text" value={dayH.medication||""} onChange={e=>setHF("medication",e.target.value)}
                  placeholder="e.g. Ibuprofen 400mg, Tylenol, none"
                  style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid #e0d0e8",fontFamily:"inherit",fontSize:14,boxSizing:"border-box",outline:"none"}}/>
              </div>
              <div>
                <label style={{fontSize:12,color:"#888",fontFamily:"sans-serif",display:"block",marginBottom:8}}>Did it resolve?</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {["Yes — fully","Partially","No","Still ongoing"].map(opt=>(
                    <button key={opt} onClick={()=>setHF("relieved",opt)} style={chip(dayH.relieved===opt)}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </>)}

          {!hasH&&<div style={{textAlign:"center",color:"#ccc",fontFamily:"sans-serif",padding:"24px 0",fontSize:14}}>Select a severity above to log details</div>}
          <button onClick={save} style={SAVE_BTN(saved)}>{saved?"✓ Saved!":"Save Headache Entry"}</button>
        </>)}

        {/* ── HISTORY TAB ── */}
        {view==="history"&&(<>
          <h2 style={{fontSize:18,fontWeight:"normal",marginBottom:8,color:"#7b3f7c"}}>Symptom History</h2>

          {/* Med adherence bars */}
          {Object.keys(medsLog).length>0&&(
            <div style={{...CARD,padding:"16px 18px",marginBottom:20}}>
              <div style={SEC_LBL}>Medication Adherence</div>
              {MEDS.map(med=>{
                const logged=allDates.filter(d=>medsLog[d]?.[med.id]!==undefined);
                const taken=allDates.filter(d=>medsLog[d]?.[med.id]===true);
                const pct=logged.length>0?Math.round(taken.length/logged.length*100):0;
                const streak=calcStreak(medsLog,med.id);
                return(
                  <div key={med.id} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:12,fontFamily:"sans-serif"}}>{med.icon} {med.label}</span>
                      <span style={{fontSize:12,fontFamily:"sans-serif",fontWeight:"bold",color:pct>=80?"#388e3c":pct>=50?"#f9a825":"#c62828"}}>{logged.length>0?`${pct}%`:"Not tracked"}</span>
                    </div>
                    {logged.length>0&&(
                      <div style={{background:"#f0eaf5",borderRadius:8,height:10,overflow:"hidden",marginBottom:3}}>
                        <div style={{width:`${pct}%`,height:"100%",background:pct>=80?"#388e3c":pct>=50?"#f9a825":"#c62828",borderRadius:8,transition:"width 0.5s"}}/>
                      </div>
                    )}
                    <div style={{fontSize:10,color:"#aaa",fontFamily:"sans-serif"}}>{taken.length}/{logged.length} days logged{streak>0?` · 🔥 ${streak}-day streak`:""}</div>
                  </div>
                );
              })}
            </div>
          )}

          {allDates.length===0&&<div style={{textAlign:"center",color:"#aaa",fontFamily:"sans-serif",padding:40}}>No entries yet — start logging!</div>}

          {allDates.map(d=>{
            const dy=entries[d]||{};
            const ha=headaches[d];
            const md=medsLog[d]||{};
            const active=SYMPTOMS.filter(s=>(dy[s.id]||0)>0);
            const nt=notes[d];
            const isPC=ha?.types?.includes("Post-concussion (familiar feeling)");
            if(active.length===0&&!ha?.severity&&!nt&&Object.keys(md).length===0) return null;
            return(
              <div key={d} style={{...CARD,border:isPC?"1.5px solid #ffb74d":"1px solid transparent"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:15,fontWeight:"bold",color:"#7b3f7c"}}>{fmtDate(d)}</div>
                  <div style={{display:"flex",gap:5}}>
                    {MEDS.map(m=>(
                      <span key={m.id} style={{fontSize:10,padding:"2px 7px",borderRadius:10,fontFamily:"sans-serif",
                        background:md[m.id]===true?m.light:md[m.id]===false?"#fff3e0":"#f5f5f5",
                        color:md[m.id]===true?m.color:md[m.id]===false?"#e65100":"#bbb",
                      }}>{m.icon}{md[m.id]===true?"✓":md[m.id]===false?"✗":"—"}</span>
                    ))}
                  </div>
                </div>

                {ha?.severity>0&&(
                  <div style={{background:isPC?"#fff3e0":"#fff5f5",border:`1px solid ${isPC?"#ffb74d":"#ffcdd2"}`,borderRadius:10,padding:"10px 14px",marginBottom:10}}>
                    <div style={{fontFamily:"sans-serif",fontSize:12,color:isPC?"#e65100":"#c62828",fontWeight:"bold",marginBottom:4}}>
                      {isPC?"⚠️":"🤕"} Headache — {SEV_LABELS[ha.severity]}{isPC?" · POST-CONCUSSION TYPE":""}
                      {ha.startTime&&<span style={{fontWeight:"normal",color:"#999"}}> · {ha.startTime}</span>}
                    </div>
                    {ha.locations?.length>0&&<div style={{fontSize:11,color:"#777",fontFamily:"sans-serif"}}>📍 {ha.locations.join(", ")}</div>}
                    {ha.types?.length>0&&<div style={{fontSize:11,color:"#777",fontFamily:"sans-serif"}}>💢 {ha.types.join(", ")}</div>}
                    {ha.triggers?.length>0&&<div style={{fontSize:11,color:"#777",fontFamily:"sans-serif"}}>⚡ {ha.triggers.join(", ")}</div>}
                    {ha.medication&&<div style={{fontSize:11,color:"#777",fontFamily:"sans-serif"}}>💊 {ha.medication}</div>}
                    {ha.relieved&&<div style={{fontSize:11,color:"#777",fontFamily:"sans-serif"}}>✅ {ha.relieved}</div>}
                  </div>
                )}

                {active.map(s=>(
                  <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #f5f0f8"}}>
                    <span style={{fontSize:13}}>{s.icon} {s.label}</span>
                    <span style={{fontSize:10,padding:"2px 10px",borderRadius:20,background:SEV_COLORS[dy[s.id]],color:SEV_TEXT[dy[s.id]],fontFamily:"sans-serif"}}>{SEV_LABELS[dy[s.id]]}</span>
                  </div>
                ))}
                {nt&&<div style={{marginTop:8,fontSize:12,color:"#777",fontStyle:"italic",fontFamily:"sans-serif"}}>📝 {nt}</div>}
              </div>
            );
          })}
        </>)}

        {/* ── SUMMARY TAB ── */}
        {view==="summary"&&(<>
          <h2 style={{fontSize:18,fontWeight:"normal",marginBottom:6,color:"#7b3f7c"}}>Doctor Summary</h2>
          <p style={{fontSize:13,color:"#888",fontFamily:"sans-serif",marginBottom:20}}>
            AI-generated from your logged data. Review before sharing with your doctor.
          </p>

          {!summary&&!genning&&(
            <div style={{...CARD,textAlign:"center",padding:"40px 24px"}}>
              <div style={{fontSize:48,marginBottom:16}}>📋</div>
              <div style={{fontSize:16,marginBottom:8,color:"#7b3f7c"}}>Create Your Doctor Summary</div>
              <div style={{fontSize:13,color:"#888",fontFamily:"sans-serif",marginBottom:24,lineHeight:1.6}}>
                Claude will analyze all your logged symptoms, headaches, and medication data and generate a clear summary you can share at your next appointment.
              </div>
              {allDates.length===0?(
                <div style={{fontSize:13,color:"#e65100",fontFamily:"sans-serif"}}>Log some symptoms first, then come back to generate your summary.</div>
              ):(
                <button onClick={generateSummary} style={{
                  padding:"14px 32px",borderRadius:12,border:"none",cursor:"pointer",
                  background:"linear-gradient(135deg,#7b3f7c,#c2687c)",color:"white",
                  fontSize:16,fontFamily:"inherit",fontWeight:"bold",
                }}>✨ Generate Summary</button>
              )}
            </div>
          )}

          {genning&&(
            <div style={{...CARD,textAlign:"center",padding:"48px 24px"}}>
              <div style={{fontSize:36,marginBottom:16,animation:"spin 1s linear infinite"}}>⏳</div>
              <div style={{fontSize:15,color:"#7b3f7c",marginBottom:8}}>Analyzing your data…</div>
              <div style={{fontSize:12,color:"#aaa",fontFamily:"sans-serif"}}>Claude is reviewing your symptoms, headaches, and medications</div>
            </div>
          )}

          {summary&&!genning&&(
            <>
              <div style={{...CARD,padding:"20px 22px",whiteSpace:"pre-wrap",fontFamily:"sans-serif",fontSize:13,lineHeight:1.75,color:"#2d1b2e"}}>
                {summary}
              </div>

              <div style={{background:"#fff3e0",border:"1px solid #ffcc80",borderRadius:12,padding:"12px 16px",marginBottom:16,fontFamily:"sans-serif",fontSize:12,color:"#e65100"}}>
                ⚠️ This summary is for informational purposes and to help you communicate with your doctor. It is not medical advice.
              </div>

              <button onClick={generateSummary} style={{
                width:"100%",padding:14,borderRadius:12,border:"1px solid #e0d0e8",
                background:"white",color:"#7b3f7c",fontSize:14,fontFamily:"inherit",cursor:"pointer",marginBottom:10,
              }}>🔄 Regenerate Summary</button>

              <button onClick={()=>{
                const el=document.createElement("a");
                const blob=new Blob([summary],{type:"text/plain"});
                el.href=URL.createObjectURL(blob);
                el.download="health-summary-for-doctor.txt";
                el.click();
              }} style={{
                width:"100%",padding:14,borderRadius:12,border:"none",
                background:"linear-gradient(135deg,#7b3f7c,#c2687c)",color:"white",
                fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:"bold",
              }}>⬇️ Download Summary (.txt)</button>
            </>
          )}
        </>)}

      </div>
    </div>
  );
}
