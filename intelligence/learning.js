import { addRoutineObservation } from "./routine-store.js";
import { buildRoutines } from "./routine-engine.js";
import { detectRoutineDeviation } from "./deviation-engine.js";
import { buildHealthScore } from "./health.js";

let state = {
  routines: [],
  deviation: null,
  health: buildHealthScore()
};

export function getLearningState() {
  return state;
}

export function updateLearning(events = [], focus = null) {
  for (const event of events) addRoutineObservation(event);

  const routines = buildRoutines();
  const deviation = focus ? detectRoutineDeviation(focus) : null;

  state = {
    routines,
    deviation,
    health: buildHealthScore({
      calendar: events.length >= 0,
      scheduler: true,
      memory: typeof localStorage !== "undefined",
      patterns: routines.length > 0,
      focus: Boolean(focus) || events.length === 0
    })
  };

  window.dispatchEvent(new CustomEvent("homehub:learning-change", {
    detail: state
  }));

  return state;
}