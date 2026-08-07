const TYPE_WEIGHTS = {
  flight:100, competition:95, work:90, meeting:88,
  travel:85, gym:80, training:80, birthday:60,
  personal:50, gaming:45
};
const clamp = value => Math.max(0, Math.min(100, value));

export function scoreEventPrediction(event, now = new Date()) {
  if (!event?.start) return 0;
  const type = event.type || event.intelligence?.type || "personal";
  const base = TYPE_WEIGHTS[type] ?? TYPE_WEIGHTS.personal;
  const start = new Date(event.start);
  const end = new Date(event.end || event.start);
  if (now > end) return 0;
  const mins = Math.max(0, Math.ceil((start - now) / 60000));
  let urgency = 0;
  if (now >= start && now <= end) urgency = 35;
  else if (mins <= 30) urgency = 30;
  else if (mins <= 60) urgency = 22;
  else if (mins <= 180) urgency = 12;
  else if (mins <= 720) urgency = 5;
  return clamp(base * 0.7 + urgency);
}

export function overallPredictionConfidence({
  missionConfidence=80, routineConfidence=0,
  gapConfidence=100, preparationConfidence=85
} = {}) {
  const routineWeight = routineConfidence > 0 ? 0.20 : 0;
  const remaining = 1 - routineWeight;
  return Math.round(
    missionConfidence * (remaining * 0.45) +
    gapConfidence * (remaining * 0.25) +
    preparationConfidence * (remaining * 0.30) +
    routineConfidence * routineWeight
  );
}
