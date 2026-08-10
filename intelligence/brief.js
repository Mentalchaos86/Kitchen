import { settings } from "../settings/index.js";
import { getPrediction } from "./prediction-store.js";
import { getAwareState } from "./aware.js";
import { getFocusResult } from "./context.js";

function fmtTime(value, allDay=false){
  if(!value) return "";
  if(allDay) return "all day";
  return new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));
}
const item=(icon,text,priority)=>({icon,text,priority});

export function buildMorningBrief(now=new Date()){
  if(!settings.morningBrief?.enabled) return null;
  const h=now.getHours(), start=settings.morningBrief.startHour ?? 5, end=settings.morningBrief.endHour ?? 11;
  if(h<start || h>=end) return null;

  const prediction=getPrediction();
  const aware=getAwareState();
  const focus=getFocusResult().focus;
  const lines=[];

  if(aware?.changes?.length) lines.push(item("🆕",aware.changes[0].text,100));

  if(focus){
    const t=focus.allDay ? "all day" : fmtTime(focus.start,focus.allDay);
    lines.push(item(focus.icon||"🎯",`${focus.title}${t?` · ${t}`:""}`,95));
  } else if(prediction?.next){
    lines.push(item(prediction.next.icon||"📌",`${prediction.next.title} · ${fmtTime(prediction.next.start,prediction.next.allDay)}`,90));
  }

  const prep=prediction?.prepare;
  if(prep?.state==="leave-now") lines.push(item("🚗","You need to leave now.",110));
  else if(prep?.state==="leave-soon") lines.push(item("⏰",`Leave in ${prep.readable?.leavesIn||"a few minutes"}.`,105));
  else if(prep?.state==="prepare") lines.push(item("🎒",`Get ready. Leave in ${prep.readable?.leavesIn||"soon"}.`,100));

  if(prediction?.gap?.useful){
    const m=prediction.gap.minutes, hh=Math.floor(m/60), mm=m%60;
    const txt=hh?`${hh}h${mm?` ${mm}m`:""}`:`${mm} min`;
    lines.push(item("🌿",`${txt} of free space before the next event.`,60));
  }

  if(!lines.length){
    const count=[prediction?.now,prediction?.next,...(prediction?.later||[])].filter(Boolean).length;
    lines.push(item(count>=4?"⚡":"☀️",count>=4?settings.morningBrief.busyDayText:settings.morningBrief.quietDayText,50));
  }

  return {
    title: settings.morningBrief.labels?.title || "MORNING BRIEF",
    mode: prediction?.mode || "home",
    lines: lines.sort((a,b)=>b.priority-a.priority).slice(0,settings.morningBrief.maxLines||3),
    generatedAt: now.toISOString()
  };
}
