import { config } from "../core/config.js";
import { $, escapeHtml } from "../core/dom.js";
import { markUpdated } from "../core/status.js";
import { setAgendaState } from "../core/state.js";
import { analyzeEvents } from "../core/intelligence.js";
import { getIntelligenceContext } from "../core/context.js";
import { buildFocusResult } from "../intelligence/engine.js";
import { updateAwareState } from "../intelligence/aware.js";
import { updateLearning } from "../intelligence/learning.js";
import { visibleTodayEvents, buildMoment } from "../intelligence/moments.js";
import { loadCalendarJsonp } from "../services/calendar-api.js";

function agendaTime(event) {
  if (event.allDay) return "ALL DAY";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(event.start));
}

function plural(value, word) {
  return `${value} ${word}${value === 1 ? "" : "s"}`;
}

function eventTiming(event) {
  if (event.allDay) {
    return {
      badge: "ALL DAY",
      message: "Scheduled for the whole day",
      state: "all-day"
    };
  }

  const now = new Date();
  const start = new Date(event.start);
  const end = new Date(event.end);
  const untilStartMinutes = Math.round((start - now) / 60000);
  const sinceEndMinutes = Math.round((now - end) / 60000);

  if (now >= start && now <= end) {
    const minutesLeft = Math.max(1, Math.ceil((end - now) / 60000));
    const message = minutesLeft < 60
      ? `${plural(minutesLeft, "minute")} remaining`
      : `${plural(Math.ceil(minutesLeft / 60), "hour")} remaining`;

    return {
      badge: "NOW",
      message,
      state: "active"
    };
  }

  if (untilStartMinutes > 0) {
    let message;
    let badge;

    if (untilStartMinutes <= 15) {
      badge = "SOON";
      message = `Starts in ${plural(untilStartMinutes, "minute")}`;
    } else if (untilStartMinutes < 60) {
      badge = "UP NEXT";
      message = `Starts in ${plural(untilStartMinutes, "minute")}`;
    } else {
      const hours = Math.floor(untilStartMinutes / 60);
      const minutes = untilStartMinutes % 60;
      badge = "LATER";
      message = minutes
        ? `Starts in ${hours}h ${minutes}m`
        : `Starts in ${plural(hours, "hour")}`;
    }

    return { badge, message, state: "upcoming" };
  }

  return {
    badge: "DONE",
    message: sinceEndMinutes < 60
      ? `Finished ${plural(Math.max(1, sinceEndMinutes), "minute")} ago`
      : "Completed today",
    state: "finished"
  };
}

function nextEventWhen(event) {
  const start = new Date(event.start);
  const today = new Date();
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((startDay - todayDay) / 86400000);

  let dayText;
  if (days === 0) dayText = "Today";
  else if (days === 1) dayText = "Tomorrow";
  else {
    dayText = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short"
    }).format(start);
  }

  return event.allDay
    ? `${dayText} · All day`
    : `${dayText} · ${agendaTime(event)}`;
}

function intelligenceFor(event) {
  const analyzed = getIntelligenceContext().analyzedEvents || [];
  const match = analyzed.find(item =>
    item.id === event.id ||
    (
      item.title === event.title &&
      item.start === event.start
    )
  );

  return match?.intelligence || {
    icon: "📌",
    label: "EVENT",
    type: "personal"
  };
}

function eventCard(event) {
  const timing = eventTiming(event);
  const intelligence = intelligenceFor(event);

  return `
    <div class="today-event today-event-${timing.state}"
         style="--event-color:${escapeHtml(event.color || "#ff7a00")}">
      <div class="today-event-accent"></div>

      <div class="today-event-time-column">
        <div class="today-event-time">${agendaTime(event)}</div>
        <div class="today-event-badge">${timing.badge}</div>
      </div>

      <div class="today-event-copy">
        <div class="today-event-heading">
          <span class="today-event-icon">${intelligence.icon}</span>
          <div class="today-event-title">${escapeHtml(event.title || "Untitled event")}</div>
        </div>

        <div class="today-event-status">${escapeHtml(timing.message)}</div>

        ${event.location
          ? `<div class="today-event-location">📍 ${escapeHtml(event.location)}</div>`
          : ""}
      </div>
    </div>`;
}

function renderTodayAgenda(data) {
  setAgendaState(data);

  const focusEvents =
    data.events ||
    [...(data.today || []), ...(data.next ? [data.next] : [])];

  analyzeEvents(focusEvents);
  buildFocusResult(
    getIntelligenceContext().analyzedEvents || focusEvents
  );

  const root = $("todayAgenda");
  const allTodayEvents = data.today || [];
  const todayEvents = visibleTodayEvents(allTodayEvents)
    .slice(0, config.agenda?.maxTodayEvents || 5);
  const nextEvent = data.next || null;
  const moment = buildMoment(allTodayEvents);

  let content = "";

  if (todayEvents.length) {
    const activeCount = todayEvents.filter(event => {
      const now = new Date();
      return !event.allDay &&
        now >= new Date(event.start) &&
        now <= new Date(event.end);
    }).length;

    content += `
      <div class="today-summary">
        <span>${todayEvents.length} relevant event${todayEvents.length === 1 ? "" : "s"}</span>
        ${activeCount ? `<strong>${activeCount} happening now</strong>` : ""}
      </div>`;

    content += `<div class="today-events">`;
    content += todayEvents.map(eventCard).join("");
    content += `</div>`;
  } else {
    content += `
      <div class="today-empty">
        <div>
          <div class="today-empty-icon">✓</div>
          <div class="today-empty-title">Your day is clear</div>
          <div class="today-empty-copy">
            No appointments today. Enjoy the breathing room.
          </div>
        </div>
      </div>`;
  }


  if (moment) {
    content += `
      <div class="homehub-moment">
        <div class="homehub-moment-topline">
          <div class="homehub-moment-icon">${moment.icon}</div>
          <div class="homehub-moment-label">${moment.label}</div>
        </div>

        <div class="homehub-moment-title">${escapeHtml(moment.title)}</div>
        <div class="homehub-moment-subtitle">${escapeHtml(moment.subtitle)}</div>

        ${moment.ideas.length
          ? `<div class="homehub-moment-ideas">
              ${moment.ideas.map(idea =>
                `<span class="homehub-moment-idea">${escapeHtml(idea)}</span>`
              ).join("")}
            </div>`
          : ""}
      </div>`;
  }

  if (nextEvent) {
    const intelligence = intelligenceFor(nextEvent);

    content += `
      <div class="next-agenda-event"
           style="--event-color:${escapeHtml(nextEvent.color || "#ff7a00")}">
        <div class="next-agenda-header">
          <div class="next-agenda-label">NEXT</div>
          <div class="next-agenda-icon">${intelligence.icon}</div>
        </div>
        <div class="next-agenda-title">${escapeHtml(nextEvent.title || "Untitled event")}</div>
        <div class="next-agenda-time">${nextEventWhen(nextEvent)}</div>
      </div>`;
  }

  root.innerHTML = content;
  $("todayStatus").textContent = "LIVE";
  markUpdated();
}

export async function loadTodayAgenda() {
  try {
    const data = await loadCalendarJsonp({});
    if (!data || data.ok === false) {
      throw new Error(data?.error || "Agenda unavailable");
    }

    renderTodayAgenda(data);
  } catch (error) {
    $("todayAgenda").innerHTML = `
      <div class="empty-state">
        Today’s agenda could not load.<br>
        HomeHub will retry automatically.
      </div>`;
    $("todayStatus").textContent = "OFFLINE";
    console.error("[Today]", error);
  }
}

export function initToday() {
  loadTodayAgenda();
  setInterval(loadTodayAgenda, 60000);
}
