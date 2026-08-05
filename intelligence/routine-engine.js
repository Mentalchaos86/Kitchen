import { getRoutineObservations } from "./routine-store.js";
import { confidenceFor, confidenceLabel } from "./confidence.js";

function keyFor(item) {
  return `${item.type}|${item.title.toLowerCase()}|${item.weekday}`;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function averageDeviation(values, center) {
  if (!values.length) return 0;
  return Math.round(
    values.reduce((sum, value) => sum + Math.abs(value - center), 0) /
    values.length
  );
}

export function buildRoutines() {
  const groups = new Map();

  for (const observation of getRoutineObservations()) {
    const key = keyFor(observation);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(observation);
  }

  return [...groups.values()]
    .map(items => {
      const minutes = items.map(item => item.minuteOfDay);
      const usualMinute = median(minutes);
      const spread = averageDeviation(minutes, usualMinute);
      const confidence = confidenceFor(items.length, spread);
      const sample = items[0];

      return {
        key: keyFor(sample),
        title: sample.title,
        type: sample.type,
        weekday: sample.weekday,
        usualMinute,
        spreadMinutes: spread,
        observations: items.length,
        confidence,
        confidenceLabel: confidenceLabel(confidence)
      };
    })
    .filter(routine => routine.observations >= 3)
    .sort((a, b) => b.confidence - a.confidence);
}

export function findRoutineFor(event) {
  if (!event?.start) return null;

  const date = new Date(event.start);
  const type = event.type || event.intelligence?.type || "personal";
  const key = `${type}|${(event.title || "Untitled").toLowerCase()}|${date.getDay()}`;

  return buildRoutines().find(routine => routine.key === key) || null;
}