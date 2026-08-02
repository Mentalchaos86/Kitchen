import { $ } from "../core/dom.js";

export function updateClock() {
  const now = new Date();

  $("time").textContent = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(now);

  $("date").textContent = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(now);
}

export function updateDisplayMode() {
  const hour = new Date().getHours();
  const isNight = hour < 7 || hour >= 20;

  document.body.classList.toggle("night-mode", isNight);
  document.body.classList.toggle("day-mode", !isNight);
}

export function initClock() {
  updateClock();
  updateDisplayMode();

  setInterval(updateClock, 1000);
  setInterval(updateDisplayMode, 60000);
}
