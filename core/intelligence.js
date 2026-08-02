import { EVENT_RULES, COLOR_HINTS, DESTINATIONS } from "./rules.js";
import { setIntelligenceContext } from "./context.js";

function searchableText(event) {
  return `${event.title || ""} ${event.location || ""}`.toLowerCase();
}

function findRule(type) {
  return EVENT_RULES.find(rule => rule.type === type);
}

function classifyEvent(event) {
  const text = searchableText(event);

  let matchedRule = EVENT_RULES
    .filter(rule => rule.keywords.length)
    .find(rule => rule.keywords.some(keyword => text.includes(keyword)));

  if (!matchedRule && event.colorId && COLOR_HINTS[event.colorId]) {
    matchedRule = findRule(COLOR_HINTS[event.colorId]);
  }

  matchedRule ||= findRule("personal");

  return {
    ...event,
    intelligence: {
      type: matchedRule.type,
      label: matchedRule.label,
      icon: matchedRule.icon,
      priority: matchedRule.priority,
      scene: matchedRule.scene
    }
  };
}

function isActive(event, now) {
  return now >= new Date(event.start) && now <= new Date(event.end);
}

function isFuture(event, now) {
  return new Date(event.end) > now;
}

function daysUntil(event, now) {
  const start = new Date(event.start);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((startDay - nowDay) / 86400000);
}

function eventTime(event) {
  if (event.allDay) return "All day";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(event.start));
}

function findDestination(event) {
  if (!event) return null;
  const text = searchableText(event);

  return DESTINATIONS.find(destination =>
    destination.keywords.some(keyword => text.includes(keyword))
  ) || null;
}

function chooseFocus(events, now) {
  const active = events
    .filter(event => isActive(event, now))
    .sort((a, b) => b.intelligence.priority - a.intelligence.priority)[0];

  if (active) {
    return {
      event: active,
      icon: active.intelligence.icon,
      label: "HAPPENING NOW",
      title: active.title,
      subtitle: eventTime(active)
    };
  }

  const todayKey = now.toDateString();
  const today = events
    .filter(event => new Date(event.start).toDateString() === todayKey)
    .sort((a, b) =>
      b.intelligence.priority - a.intelligence.priority ||
      new Date(a.start) - new Date(b.start)
    );

  const focus = today[0];
  if (focus) {
    return {
      event: focus,
      icon: focus.intelligence.icon,
      label: focus.intelligence.label,
      title: focus.title,
      subtitle: eventTime(focus)
    };
  }

  return null;
}

function chooseCountdown(events, now) {
  const candidates = events
    .filter(event => isFuture(event, now))
    .filter(event => ["travel", "competition", "gaming", "birthday"].includes(event.intelligence.type))
    .sort((a, b) =>
      b.intelligence.priority - a.intelligence.priority ||
      new Date(a.start) - new Date(b.start)
    );

  const event = candidates[0];
  if (!event) return null;

  const active = isActive(event, now);
  return {
    event,
    icon: event.intelligence.icon,
    label: event.title.toUpperCase(),
    active,
    days: active ? 0 : Math.max(0, daysUntil(event, now))
  };
}

export function analyzeEvents(rawEvents = []) {
  const now = new Date();
  const events = rawEvents
    .map(classifyEvent)
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  const focus = chooseFocus(events, now);
  const countdown = chooseCountdown(events, now);
  const dominant = focus?.event || countdown?.event || events.find(event => isFuture(event, now)) || null;
  const destination = findDestination(dominant);
  const scene = dominant?.intelligence?.scene || null;

  const context = {
    mode: dominant?.intelligence?.type || "personal",
    scene,
    activeEvent: events.find(event => isActive(event, now)) || null,
    focus,
    countdown,
    weather: destination,
    analyzedEvents: events
  };

  setIntelligenceContext(context);
  return context;
}
