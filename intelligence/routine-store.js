const KEY = "homehub.learn.routineObservations";
const LIMIT = 400;

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addRoutineObservation(event) {
  if (!event?.start) return;

  const date = new Date(event.start);
  const history = read();

  history.push({
    id: event.id || event.title,
    title: event.title || "Untitled",
    type: event.type || event.intelligence?.type || "personal",
    weekday: date.getDay(),
    minuteOfDay: date.getHours() * 60 + date.getMinutes(),
    recordedAt: new Date().toISOString()
  });

  localStorage.setItem(KEY, JSON.stringify(history.slice(-LIMIT)));
}

export function getRoutineObservations() {
  return read();
}