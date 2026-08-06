import { settings } from "../settings/index.js";

function minutesBetween(later, earlier) {
  return Math.floor((later - earlier) / 60000);
}

function formatGap(totalMinutes) {
  const minutes = Math.max(0, totalMinutes);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours && remainder) return `${hours}h ${remainder}m`;
  if (hours) return `${hours}h`;
  return `${remainder} min`;
}

function gapCategory(minutes) {
  if (minutes < 90) return "short";
  if (minutes < 180) return "medium";
  return "long";
}

function chooseIdeas(minutes) {
  const category = gapCategory(minutes);
  const ideas = settings.moments.ideasByGap?.[category] || [];
  const limit = minutes >= 120 ? 3 : 2;
  return ideas.slice(0, limit);
}

export function visibleTodayEvents(events = [], now = new Date()) {
  const retention =
    (settings.moments.completedEventRetentionMinutes || 120) * 60000;

  return events.filter(event => {
    if (event.allDay) return true;

    const end = new Date(event.end || event.start);
    if (Number.isNaN(end.getTime())) return true;

    return now - end < retention;
  });
}

export function buildMoment(events = [], now = new Date()) {
  const timed = events
    .filter(event => !event.allDay && event?.start)
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  const active = timed.find(event => {
    const start = new Date(event.start);
    const end = new Date(event.end || event.start);
    return now >= start && now <= end;
  });

  if (active) return null;

  const next = timed.find(event => new Date(event.start) > now);
  if (!next) return null;

  const gapMinutes = minutesBetween(new Date(next.start), now);
  const minimum = settings.moments.minimumGapMinutes || 45;
  const hideBefore =
    settings.moments.hideBeforeNextEventMinutes || 30;

  if (gapMinutes < minimum || gapMinutes <= hideBefore) return null;

  return {
    icon: gapMinutes >= 120 ? "🌿" : "☕",
    label: "MOMENT",
    title: `You have ${formatGap(gapMinutes)} free`,
    subtitle: `Before ${next.title || "your next event"}`,
    nextEventId: next.id || next.title,
    gapMinutes,
    ideas: chooseIdeas(gapMinutes)
  };
}
