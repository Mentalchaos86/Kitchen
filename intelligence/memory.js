const KEY="homehub.aware.snapshots";
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}};
export function getYesterdaySnapshot(){const d=new Date();d.setDate(d.getDate()-1);return read()[dayKey(d)]||null;}
export function saveTodaySnapshot(snapshot){const store=read();store[dayKey()]={...snapshot,savedAt:new Date().toISOString()};const keys=Object.keys(store).sort().slice(-14);localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(keys.map(k=>[k,store[k]]))));}
