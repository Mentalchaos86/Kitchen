import { findRoutineFor } from "./routine-engine.js";

function durationText(minutes) {
  const absolute = Math.abs(minutes);
  if (absolute >= 60) {
    const hours = Math.round(absolute / 60);
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${absolute} minutes`;
}

export function detectRoutineDeviation(event) {
  const routine = findRoutineFor(event);

  if (!routine || routine.confidence < 65) return null;

  const date = new Date(event.start);
  const currentMinute = date.getHours() * 60 + date.getMinutes();
  const difference = currentMinute - routine.usualMinute;

  if (Math.abs(difference) < 15) {
    return {
      routine,
      changed: false,
      text: `${event.title} follows your usual routine.`
    };
  }

  return {
    routine,
    changed: true,
    differenceMinutes: difference,
    icon: difference < 0 ? "⏪" : "⏩",
    text: `${event.title} starts ${durationText(difference)} ${difference < 0 ? "earlier" : "later"} than usual.`
  };
}