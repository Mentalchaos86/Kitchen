import { PREDICTION_TYPES } from "./prediction-types.js";
import { determineFocusMode } from "./prediction-context.js";
import { scoreEventPrediction, overallPredictionConfidence } from "./prediction-score.js";
import { setPrediction } from "./prediction-store.js";
import { findRoutineFor } from "./routine-engine.js";

const normalize = event => event ? ({
  id:event.id || event.title,
  title:event.title || "Untitled",
  start:event.start, end:event.end || event.start,
  allDay:Boolean(event.allDay),
  type:event.type || event.intelligence?.type || "personal",
  icon:event.icon || event.intelligence?.icon || "📌",
  score:scoreEventPrediction(event)
}) : null;

export function buildPrediction(events=[], now=new Date()){
  const upcoming = events
    .filter(event => event?.start)
    .filter(event => new Date(event.end || event.start) >= now)
    .sort((a,b) => new Date(a.start)-new Date(b.start));

  const currentRaw = upcoming.find(event => {
    const start=new Date(event.start), end=new Date(event.end || event.start);
    return now >= start && now <= end;
  }) || null;

  const nextRaw = upcoming.find(event => new Date(event.start) > now) || null;
  const laterRaw = upcoming.filter(event => event!==currentRaw && event!==nextRaw).slice(0,3);

  const current=normalize(currentRaw), next=normalize(nextRaw), later=laterRaw.map(normalize);

  const gapMinutes = next
    ? Math.floor((new Date(next.start) - (current?.end ? new Date(current.end) : now))/60000)
    : 0;

  const gap = gapMinutes > 0
    ? {minutes:gapMinutes, useful:gapMinutes>=45,
       category:gapMinutes>=180?"long":gapMinutes>=90?"medium":gapMinutes>=45?"short":"none"}
    : null;

  const startsIn = next ? Math.floor((new Date(next.start)-now)/60000) : null;
  const prepare = (next && !next.allDay && startsIn > 0)
    ? {startsIn, leaveIn:null, shouldPrepare:startsIn<=60}
    : null;

  const mode = determineFocusMode({current,next,now});
  const routine = nextRaw ? findRoutineFor(nextRaw) : null;
  const confidence = overallPredictionConfidence({
    missionConfidence:Math.round(Math.max(current?.score||0,next?.score||0)),
    routineConfidence:routine?.confidence||0,
    gapConfidence:gap?100:80,
    preparationConfidence:prepare?95:80
  });

  let predictionType = PREDICTION_TYPES.NONE;
  if (current) predictionType = mode==="travel" ? PREDICTION_TYPES.TRAVEL : PREDICTION_TYPES.FOCUS;
  else if (prepare?.shouldPrepare) predictionType = PREDICTION_TYPES.PREPARE;
  else if (gap?.useful) predictionType = PREDICTION_TYPES.FREE_TIME;
  else if (mode==="recovery") predictionType = PREDICTION_TYPES.RECOVERY;
  else if (next && mode==="travel") predictionType = PREDICTION_TYPES.TRAVEL;

  return setPrediction({
    now:current, next, later, gap, prepare, mode,
    predictionType, confidence, generatedAt:now.toISOString()
  });
}
