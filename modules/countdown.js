import { config } from "../core/config.js";
import { $ } from "../core/dom.js";
import { getIntelligenceContext } from "../core/context.js";

export function updateCountdown() {
  const intelligentCountdown = getIntelligenceContext().countdown;

  if (intelligentCountdown) {
    $("countdownIcon").textContent = intelligentCountdown.icon;
    $("countdownLabel").textContent = intelligentCountdown.label;
    $("countdownValue").textContent = intelligentCountdown.active
      ? "HAPPENING NOW"
      : `IN ${intelligentCountdown.days} DAY${intelligentCountdown.days === 1 ? "" : "S"}`;
    return;
  }

  const events = (config.events || [])
    .map(event => ({
      ...event,
      start: new Date(event.startDate),
      end: new Date(event.endDate || event.startDate)
    }))
    .filter(event =>
      !Number.isNaN(event.start.getTime()) &&
      !Number.isNaN(event.end.getTime())
    )
    .sort((a, b) => a.start - b.start);

  const now = new Date();
  const activeEvent = events.find(event => now >= event.start && now <= event.end);
  const nextEvent = events.find(event => event.start > now);
  const event = activeEvent || nextEvent;

  if (!event) {
    $("countdownIcon").textContent = "✓";
    $("countdownLabel").textContent = "EVENTS";
    $("countdownValue").textContent = "ALL DONE";
    return;
  }

  $("countdownIcon").textContent = event.icon || "📅";
  $("countdownLabel").textContent = event.label || "NEXT EVENT";

  if (activeEvent) {
    const remainingDays = Math.ceil((event.end - now) / 86400000);
    $("countdownValue").textContent =
      remainingDays <= 1
        ? "HAPPENING NOW"
        : `NOW · ${remainingDays} DAYS LEFT`;
    return;
  }

  const difference = event.start - now;
  const days = Math.ceil(difference / 86400000);

  if (days <= 1) {
    const hours = Math.max(1, Math.ceil(difference / 3600000));
    $("countdownValue").textContent =
      `IN ${hours} HOUR${hours === 1 ? "" : "S"}`;
  } else {
    $("countdownValue").textContent = `IN ${days} DAYS`;
  }
}

export function initCountdown() {
  updateCountdown();
  window.addEventListener("homehub:intelligence-change", updateCountdown);
  setInterval(updateCountdown, 60000);
}
