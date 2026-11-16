// Home OS shell: header, tabs/views, automatic day/night look, idle return to
// Home, connection status and device-only connection settings.

import { config } from "../core/config.js";
import { $ } from "../core/dom.js";
import { getDeviceSecret, setDeviceSecret } from "../core/secrets.js";
import { getHomeData, homeAssistantConfigured, startHomeData } from "../services/homeassistant.js";
import { startEnergyPrices } from "../services/energy-prices.js";
import { startRain } from "../services/rain.js";
import { startForecast } from "../services/forecast.js";
import { icon } from "./os-icons.js";
import { longDate, timeNl } from "./os-format.js";

const VIEWS = ["home", "agenda", "energy", "household", "smarthome"];
const APPEARANCE_KEY = "homehub-os-appearance-v1";
const os = () => config.homeOs || {};

let currentView = null;
let idleTimer = null;
let calendarOk = null;

function readAppearance() {
  try {
    return localStorage.getItem(APPEARANCE_KEY) || os().appearance || "auto";
  } catch {
    return os().appearance || "auto";
  }
}

function applyTone() {
  const choice = readAppearance();
  let tone = choice;
  if (choice !== "light" && choice !== "dark") {
    const hour = new Date().getHours();
    const dayStart = os().dayStartHour ?? 7;
    const nightStart = os().nightStartHour ?? 20;
    tone = hour >= dayStart && hour < nightStart ? "light" : "dark";
  }
  document.body.dataset.osTone = tone;
}

export function showView(name) {
  const view = VIEWS.includes(name) ? name : "home";
  if (view === currentView) return;
  currentView = view;
  document.body.dataset.osView = view;

  document.querySelectorAll("[data-os-panel]").forEach(panel => {
    panel.hidden = panel.dataset.osPanel !== view;
  });
  document.querySelectorAll("[data-os-view]").forEach(tab => {
    const active = tab.dataset.osView === view;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  window.dispatchEvent(new CustomEvent("homehub:view-change", { detail: { view } }));
}

function scheduleIdleReturn() {
  clearTimeout(idleTimer);
  const minutes = Number(os().returnHomeAfterMinutes);
  if (!minutes || minutes <= 0) return;
  idleTimer = setTimeout(() => {
    if (!document.body.classList.contains("settings-dialog-open")) showView("home");
  }, minutes * 60000);
}

function updateClock() {
  const now = new Date();
  const time = $("osTime");
  const date = $("osDate");
  if (time) time.textContent = timeNl(now);
  if (date) date.textContent = longDate(now);
}

function updateStatus(homeData) {
  const status = $("osStatus");
  if (!status) return;
  const parts = [];
  let level = "ok";

  if (calendarOk === false) { level = "error"; parts.push("Agenda niet bereikbaar"); }
  else if (calendarOk) parts.push("Agenda verbonden");

  if (!homeData || homeData.mode === "demo") {
    if (level === "ok") level = "demo";
    parts.push("Home Assistant: demo-gegevens");
  } else if (homeData.mode === "error") {
    level = "error";
    parts.push(`Home Assistant: ${homeData.error || "fout"}`);
  } else {
    parts.push("Home Assistant verbonden");
  }

  status.className = `os-status is-${level}`;
  status.title = parts.join(" · ");
  status.setAttribute("aria-label", parts.join(" · "));
}

function bindConnectionSettings() {
  const calendarKey = $("settingsCalendarKey");
  const haUrl = $("settingsHaUrl");
  const haToken = $("settingsHaToken");
  const appearance = $("settingsAppearance");
  const clear = $("settingsConnectionsClear");
  const haStatus = $("settingsHaStatus");

  const showStored = () => {
    if (calendarKey) {
      calendarKey.value = "";
      calendarKey.placeholder = getDeviceSecret("calendarKey") ? "Opgeslagen — typ om te vervangen" : "Niet ingesteld";
    }
    if (haUrl) haUrl.value = getDeviceSecret("haUrl");
    if (haToken) {
      haToken.value = "";
      haToken.placeholder = getDeviceSecret("haToken") ? "Opgeslagen — typ om te vervangen" : "Long-lived access token";
    }
    if (appearance) appearance.value = readAppearance();
  };

  calendarKey?.addEventListener("change", () => {
    if (calendarKey.value.trim()) setDeviceSecret("calendarKey", calendarKey.value);
    showStored();
  });
  haUrl?.addEventListener("change", () => {
    setDeviceSecret("haUrl", haUrl.value);
    showStored();
  });
  haToken?.addEventListener("change", () => {
    if (haToken.value.trim()) setDeviceSecret("haToken", haToken.value);
    showStored();
  });
  // On the TV, Back (to close the keyboard) reloads the dashboard before the
  // field loses focus, so also save shortly after typing stops.
  [[calendarKey, "calendarKey", true], [haUrl, "haUrl", false], [haToken, "haToken", true]]
    .forEach(([field, name, requireValue]) => {
      let timer;
      field?.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (!requireValue || field.value.trim()) setDeviceSecret(name, field.value);
        }, 600);
      });
    });
  appearance?.addEventListener("change", () => {
    try { localStorage.setItem(APPEARANCE_KEY, appearance.value); } catch {}
    applyTone();
  });
  clear?.addEventListener("click", () => {
    ["calendarKey", "haUrl", "haToken"].forEach(name => setDeviceSecret(name, ""));
    showStored();
  });

  window.addEventListener("homehub:home-data-change", event => {
    if (!haStatus) return;
    const data = event.detail;
    haStatus.textContent = !homeAssistantConfigured()
      ? "Nog niet gekoppeld: Energy en Smart Home tonen demo-gegevens."
      : data?.mode === "live"
        ? "Verbonden met Home Assistant."
        : `Geen verbinding: ${data?.error || "onbekende fout"}`;
  });

  showStored();
}

function decorate() {
  document.querySelectorAll("[data-os-icon]").forEach(element => {
    element.insertAdjacentHTML("afterbegin", icon(element.dataset.osIcon));
  });
}

export function initOsShell() {
  decorate();
  applyTone();
  updateClock();

  document.querySelectorAll("[data-os-view]").forEach(tab => {
    tab.addEventListener("click", () => showView(tab.dataset.osView));
  });
  document.addEventListener("click", event => {
    const opener = event.target.closest?.("[data-os-open]");
    if (opener) showView(opener.dataset.osOpen);
  });
  // TV remote / keyboard: Enter or Space on a focused Home card opens it.
  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const opener = event.target.closest?.("[data-os-open]");
    if (!opener || opener !== event.target) return;
    event.preventDefault();
    showView(opener.dataset.osOpen);
  });
  $("osSettings")?.addEventListener("click", () => $("settingsOpen")?.click());

  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(type =>
    document.addEventListener(type, scheduleIdleReturn, { passive: true })
  );

  window.addEventListener("homehub:calendar-status", event => {
    calendarOk = Boolean(event.detail?.ok);
    updateStatus(getHomeData());
  });
  window.addEventListener("homehub:home-data-change", event => updateStatus(event.detail));

  bindConnectionSettings();
  showView(os().defaultView || "home");
  scheduleIdleReturn();
  startHomeData();
  startEnergyPrices();
  startRain();
  startForecast();

  setInterval(updateClock, 1000);
  setInterval(applyTone, 60000);
}

