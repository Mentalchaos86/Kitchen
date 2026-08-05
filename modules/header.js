import { config } from "../core/config.js";
import { $ } from "../core/dom.js";
import { getAgendaState } from "../core/state.js";
import { automaticScene } from "./scenes.js";
import { getIntelligenceContext } from "../core/context.js";

function greetingForHour(hour) {
  if (hour < 5) return { icon: "🌙", text: "Good night" };
  if (hour < 12) return { icon: "☀️", text: "Good morning" };
  if (hour < 18) return { icon: "👋", text: "Good afternoon" };
  return { icon: "🌙", text: "Good evening" };
}

function eventIsActive(event, now = new Date()) {
  if (!event) return false;
  return now >= new Date(event.start) && now <= new Date(event.end);
}

function eventFocusText(event) {
  if (!event) return "Enjoy your day";
  const title = event.title || "Next appointment";
  if (event.allDay) return title;

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(event.start));

  return `${title} at ${time}`;
}


function sameLocalDay(dateA, dateB) {
  return dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();
}

function tomorrowPreview(nextEvent, now) {
  if (!nextEvent || now.getHours() < 18) return null;

  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );
  const start = new Date(nextEvent.start);

  if (!sameLocalDay(start, tomorrow)) {
    return "Tomorrow · No appointments";
  }

  if (nextEvent.allDay) {
    return `Tomorrow · ${nextEvent.title || "All-day event"}`;
  }

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(start);

  return `Tomorrow · ${nextEvent.title || "Next event"} at ${time}`;
}

function classifyFocusEvent(events) {
  const active = events.find(event => eventIsActive(event));
  if (active) return { event: active, prefix: "Happening now" };

  const priorityPatterns = [
    /flight|airport|tokyo|travel|hotel|trip/i,
    /hyrox|showdown|throwdown|competition|wedstrijd/i,
    /gym|crossfit|training|workout|wod/i,
    /birthday|jarig|verjaardag/i
  ];

  for (const pattern of priorityPatterns) {
    const match = events.find(event => pattern.test(event.title || ""));
    if (match) return { event: match, prefix: "" };
  }

  return events.length ? { event: events[0], prefix: "" } : null;
}

export function updatePersonalHeader() {
  const title = $("dashboardTitle");
  const subtitle = $("dashboardSubtitle");
  const focus = $("dailyFocusValue");
  if (!title || !subtitle || !focus) return;

  const now = new Date();
  const name = config.profile?.name || "";
  const scene = document.body.dataset.scene || automaticScene();
  const agenda = getAgendaState();
  const todayEvents = agenda.today || [];
  const nextEvent = agenda.next || null;
  const greeting = greetingForHour(now.getHours());

  let heading = `${greeting.icon} ${greeting.text}${name ? `, ${name}` : ""}`;

  if (scene === "vacation") {
    heading = `✈️ Welcome to vacation mode${name ? `, ${name}` : ""}`;
  } else if (scene === "work") {
    heading = `💼 ${greeting.text}${name ? `, ${name}` : ""}`;
  }

  const dateText = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(now);

  const eventCountText =
    todayEvents.length === 0
      ? "No appointments today"
      : todayEvents.length === 1
        ? "1 event today"
        : `${todayEvents.length} events today`;

  const intelligence = getIntelligenceContext();
  const focusChoice = classifyFocusEvent(todayEvents);
  let focusText;

  if (intelligence.focus) {
    focusText = `${intelligence.focus.icon} ${intelligence.focus.title} · ${intelligence.focus.subtitle}`;
  } else if (focusChoice?.event) {
    focusText = focusChoice.prefix
      ? `${focusChoice.prefix}: ${eventFocusText(focusChoice.event)}`
      : eventFocusText(focusChoice.event);
  } else if (nextEvent) {
    const start = new Date(nextEvent.start);
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const nextDay = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );

    const when =
      nextDay.getTime() === tomorrow.getTime()
        ? "Tomorrow"
        : new Intl.DateTimeFormat("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short"
          }).format(start);

    focusText = `${nextEvent.title || "Next event"} · ${when}`;
  } else {
    focusText = scene === "evening" ? "Time to unwind" : "Enjoy your clear day";
  }

  const eveningPreview = tomorrowPreview(nextEvent, now);

  title.textContent = heading;
  subtitle.textContent = eveningPreview
    ? `${dateText} · ${eventCountText} · ${eveningPreview}`
    : `${dateText} · ${eventCountText}`;
  focus.textContent = focusText;
  document.title = `${config.title || "Home Hub"} · ${greeting.text}`;
}

export function initHeader() {
  updatePersonalHeader();

  window.addEventListener("homehub:agenda-change", updatePersonalHeader);
  window.addEventListener("homehub:scene-change", updatePersonalHeader);
  window.addEventListener("homehub:intelligence-change", updatePersonalHeader);

  setInterval(updatePersonalHeader, 60000);
}
