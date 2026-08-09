import { settings } from "../settings/index.js";

const typeFor = e => e?.type || e?.intelligence?.type || "personal";
const getMinutes = (map,type,fallback=0) => Number.isFinite(map?.[type]) ? map[type] : fallback;

function fmt(total){
  const m = Math.max(0, Math.ceil(total));
  const h = Math.floor(m/60), r = m%60;
  if (h && r) return `${h}h ${r}m`;
  if (h) return `${h}h`;
  return `${r} min`;
}

export function buildPreparationWindow(event, now=new Date()){
  if (!event?.start || event.allDay) return null;
  const start = new Date(event.start);
  const type = typeFor(event);
  const prepMinutes = getMinutes(settings.preparation?.preparationMinutes,type,10);
  const travelMinutes = getMinutes(settings.preparation?.travelMinutes,type,0);
  const leaveAt = new Date(start.getTime()-travelMinutes*60000);
  const prepareAt = new Date(leaveAt.getTime()-prepMinutes*60000);

  const startsIn = Math.ceil((start-now)/60000);
  const leavesIn = Math.ceil((leaveAt-now)/60000);
  const preparesIn = Math.ceil((prepareAt-now)/60000);
  if (startsIn <= 0) return null;

  const t = settings.preparation?.thresholds || {};
  let state="later", label="COMING UP", action=`Prepare in ${fmt(preparesIn)}`;

  if (leavesIn <= (t.leaveNowMinutes ?? 3)) {
    state="leave-now"; label="LEAVE NOW"; action="Time to go.";
  } else if (leavesIn <= (t.leaveSoonMinutes ?? 10)) {
    state="leave-soon"; label="LEAVE SOON"; action=`Leave in ${fmt(leavesIn)}`;
  } else if (preparesIn <= (t.prepareSoonMinutes ?? 20)) {
    state="prepare"; label="GET READY"; action=`Leave in ${fmt(leavesIn)}`;
  }

  return {
    state,label,
    headline:`Starts in ${fmt(startsIn)}`,
    action,type,
    start:start.toISOString(),
    prepareAt:prepareAt.toISOString(),
    leaveAt:leaveAt.toISOString(),
    prepMinutes,travelMinutes,startsIn,leavesIn,preparesIn,
    readable:{startsIn:fmt(startsIn),leavesIn:fmt(leavesIn),preparesIn:fmt(preparesIn)}
  };
}
