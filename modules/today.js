import { config } from "../core/config.js";
import { $, escapeHtml } from "../core/dom.js";
import { markUpdated } from "../core/status.js";
import { setAgendaState } from "../core/state.js";
import { loadCalendarJsonp } from "../services/calendar-api.js";

function agendaTime(event) {
  if (event.allDay) return "ALL DAY";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(event.start));
}

function nextEventWhen(event) {
  const start = new Date(event.start);
  const today = new Date();
  const startDay = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
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

function renderTodayAgenda(data) {
  setAgendaState(data);

  const root = $("todayAgenda");
  const todayEvents = (data.today || [])
    .slice(0, config.agenda?.maxTodayEvents || 5);
  const nextEvent = data.next || null;

  let content = "";

  if (todayEvents.length) {
    content += `<div class="today-summary">${todayEvents.length} event${
      todayEvents.length === 1 ? "" : "s"
    } today</div>`;
    content += `<div class="today-events">`;
    content += todayEvents.map(event => `
      <div class="today-event" style="--event-color: ${escapeHtml(event.color || "#ff7a00")}">
        <div class="today-event-accent"></div>
        <div class="today-event-time">${agendaTime(event)}</div>
        <div class="today-event-copy">
          <div class="today-event-title">${escapeHtml(event.title || "Untitled event")}</div>
          ${event.location
            ? `<div class="today-event-location">📍 ${escapeHtml(event.location)}</div>`
            : ""}
        </div>
      </div>
    `).join("");
    content += `</div>`;
  } else {
    content += `
      <div class="today-empty">
        <div>
          <div class="today-empty-icon">✓</div>
          <div class="today-empty-title">No events today</div>
          <div class="today-empty-copy">Your calendar is clear.</div>
        </div>
      </div>`;
  }

  if (nextEvent) {
    content += `
      <div class="next-agenda-event" style="--event-color: ${escapeHtml(nextEvent.color || "#ff7a00")}">
        <div class="next-agenda-label">NEXT</div>
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
        Today’s agenda could not load.<br>Check the Apps Script deployment.
      </div>`;
    $("todayStatus").textContent = "OFFLINE";
    console.error("[Today]", error);
  }
}

export function initToday() {
  loadTodayAgenda();
  setInterval(loadTodayAgenda, 5 * 60000);
}
