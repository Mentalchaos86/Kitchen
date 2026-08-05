import { config } from "../core/config.js";
import { $, escapeHtml } from "../core/dom.js";
import { markUpdated } from "../core/status.js";
import { loadCalendarJsonp } from "../services/calendar-api.js";
import { analyzeEvents } from "../core/intelligence.js";

let cursor = new Date();
cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
let requestToken = 0;

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function eventDateKeys(event) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const keys = [];
  const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const finalDate = event.allDay
    ? new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1)
    : new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (day <= finalDate && keys.length < 40) {
    keys.push(localDateKey(day));
    day.setDate(day.getDate() + 1);
  }

  return keys;
}

function monthRange(date) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const mondayIndex = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - mondayIndex);

  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridStart.getDate() + 41);
  gridEnd.setHours(23, 59, 59, 999);

  return { gridStart, gridEnd };
}

function eventTime(event) {
  if (event.allDay) return "";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(event.start));
}

function render(events) {
  const { gridStart } = monthRange(cursor);
  const todayKey = localDateKey(new Date());
  const currentMonth = cursor.getMonth();
  const byDay = new Map();

  for (const event of events || []) {
    for (const key of eventDateKeys(event)) {
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(event);
    }
  }

  for (const dayEvents of byDay.values()) {
    dayEvents.sort((a, b) => {
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
      return new Date(a.start) - new Date(b.start);
    });
  }

  $("calendarMonthLabel").textContent = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric"
  }).format(cursor);

  const cells = [];

  for (let index = 0; index < 42; index++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    const key = localDateKey(date);
    const dayEvents = byDay.get(key) || [];
    const visible = dayEvents.slice(0, config.calendar?.maxEventsPerDay || 3);
    const overflow = dayEvents.length - visible.length;
    const classes = [
      "calendar-day",
      date.getMonth() !== currentMonth ? "outside-month" : "",
      key === todayKey ? "is-today" : ""
    ].filter(Boolean).join(" ");

    const now = new Date();
    const upcomingEvents = dayEvents.filter(event => new Date(event.end) > now);
    const nextUpcomingId = upcomingEvents[0]?.id || null;

    cells.push(`
      <div class="${classes}">
        <div class="calendar-day-header">
          <div class="calendar-day-number">${date.getDate()}</div>
          ${key === todayKey ? `<div class="calendar-today-label">TODAY</div>` : ""}
        </div>
        <div class="calendar-day-events">
          ${visible.map(event => `
            <div class="calendar-event ${event.id === nextUpcomingId ? "calendar-event-next" : ""}"
                 style="--event-color:${escapeHtml(event.color || "#ff7a00")}"
                 title="${escapeHtml(event.title || "")}">
              <span class="calendar-event-dot"></span>
              <span class="calendar-event-text">
                ${eventTime(event) ? `<strong>${eventTime(event)}</strong> ` : ""}
                ${escapeHtml(event.title || "Untitled event")}
              </span>
            </div>
          `).join("")}
          ${overflow > 0 ? `<div class="calendar-more">+${overflow} more</div>` : ""}
        </div>
      </div>
    `);
  }

  $("calendarGrid").innerHTML = cells.join("");
}

export async function loadCalendar() {
  const token = ++requestToken;
  const { gridStart, gridEnd } = monthRange(cursor);
  $("calendarGrid").classList.add("is-loading");

  try {
    const data = await loadCalendarJsonp({
      start: gridStart.toISOString(),
      end: gridEnd.toISOString()
    });

    if (token !== requestToken) return;
    if (!data || data.ok === false) {
      throw new Error(data?.error || "Calendar unavailable");
    }

    render(data.events || []);
    analyzeEvents(data.events || []);
    markUpdated();
  } catch (error) {
    if (token !== requestToken) return;

    $("calendarGrid").innerHTML = `
      <div class="empty-state">
        Calendar could not load.<br>
        Check the Google Apps Script deployment.
      </div>`;
    console.error("[Calendar]", error);
  } finally {
    if (token === requestToken) {
      $("calendarGrid").classList.remove("is-loading");
    }
  }
}

export function initCalendar() {
  $("calendarPreviousButton").addEventListener("click", () => {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    loadCalendar();
  });

  $("calendarNextButton").addEventListener("click", () => {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    loadCalendar();
  });

  $("calendarTodayButton").addEventListener("click", () => {
    const now = new Date();
    cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    loadCalendar();
  });

  loadCalendar();
  setInterval(loadCalendar, 5 * 60000);
}
