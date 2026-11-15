// Home OS — Home overview (four cards, as in the Home OS design).
import { $, escapeHtml } from "../core/dom.js";
import { getAgendaState } from "../core/state.js";
import { getFocusResult } from "../intelligence/context.js";
import { getHomeData } from "../services/homeassistant.js";
import { getHousehold } from "../services/household.js";
import { icon } from "./os-icons.js";
import { batteryState, count, dayTitle, decimal, euroPerKwh, kw, timeNl } from "./os-format.js";

let weather = null;

function demoBadge(data) {
  if (!data || data.mode === "live") return "";
  return data.mode === "error"
    ? `<span class="os-badge is-error">GEEN VERBINDING</span>`
    : `<span class="os-badge">DEMO</span>`;
}

function row(iconName, label, value, extraClass = "") {
  return `<div class="os-row ${extraClass}">${icon(iconName)}<span class="os-row-label">${escapeHtml(label)}</span><span class="os-row-value">${escapeHtml(value)}</span></div>`;
}

function renderToday() {
  const root = $("osCardToday");
  if (!root) return;
  const now = new Date();
  const agenda = getAgendaState();
  const events = (agenda.today || []).filter(event => event.allDay || new Date(event.end) > now);
  const focus = getFocusResult().focus;

  const weatherChip = weather
    ? `<span class="os-chip">${escapeHtml(weather.icon)} ${Math.round(weather.temperature)}°</span>`
    : "";

  const list = events.slice(0, 3).map(event => `
    <div class="os-event" style="--event-color:${escapeHtml(event.color || "var(--os-accent)")}">
      <span class="os-event-time">${event.allDay ? "Hele dag" : timeNl(new Date(event.start))}</span>
      <span class="os-event-title">${escapeHtml(event.title || "Afspraak")}</span>
    </div>`).join("");

  const summary = events.length
    ? count(events.length, "afspraak", "afspraken") + " vandaag"
    : agenda.next
      ? `Geen afspraken meer · Volgende: ${escapeHtml(agenda.next.title || "afspraak")}`
      : "Geen afspraken vandaag";

  root.innerHTML = `
    <div class="os-card-head"><h2>Vandaag</h2>${weatherChip}</div>
    <div class="os-card-big">${escapeHtml(dayTitle(now))}</div>
    <div class="os-card-sub">${summary}</div>
    ${list ? `<div class="os-events">${list}</div>` : ""}
    <div class="os-divider"></div>
    <div class="os-card-section">${focus && ["tomorrow", "future"].includes(focus.state) ? "Volgende missie" : "Missie van vandaag"}</div>
    <div class="os-mission">${icon("check")}<span>${escapeHtml(focus?.title || "Rustige dag — geen missie nodig")}</span></div>`;
}

function renderEnergy() {
  const root = $("osCardEnergy");
  if (!root) return;
  const data = getHomeData();
  const energy = data?.energy || {};
  const batteries = (energy.batteries || []).map(battery =>
    row("battery", battery.name, `${Number.isFinite(battery.level) ? Math.round(battery.level) + "%" : "—"} · ${batteryState(battery.powerW)}`, "is-battery")
  ).join("");

  root.innerHTML = `
    <div class="os-card-head"><h2>Energy</h2>${demoBadge(data)}</div>
    <div class="os-card-big">${kw(energy.powerW)}</div>
    <div class="os-card-sub">Live verbruik${Number.isFinite(energy.priceEur) ? ` · Stroom nu ${euroPerKwh(energy.priceEur)}` : ""}</div>
    ${energy.cheapest ? `<div class="os-hint">${icon("euro")}Goedkoopst vandaag ${escapeHtml(energy.cheapest.from)}–${escapeHtml(energy.cheapest.to)}</div>` : ""}
    <div class="os-divider"></div>
    <div class="os-card-section">Batterijen</div>
    ${batteries || row("battery", "Anker / Zendure", "na koppeling")}`;
}

function renderSmartHome() {
  const root = $("osCardSmartHome");
  if (!root) return;
  const data = getHomeData();
  const lights = data?.lights || [];
  const climate = data?.climate || [];
  const devices = data?.devices || [];
  const lightsOn = lights.filter(light => light.on).length;
  const devicesOn = devices.filter(device => device.on).length;
  const temperature = climate.find(item => Number.isFinite(item.value));

  root.innerHTML = `
    <div class="os-card-head"><h2>Smart Home</h2>${demoBadge(data)}</div>
    ${row("bulb", "Verlichting", lights.length ? `${lightsOn} van ${lights.length} aan` : "—")}
    ${row("thermometer", "Temperatuur", temperature ? `${decimal(temperature.value)}${temperature.unit || "°"}` : "—")}
    ${row("plug", "Apparaten", devices.length ? `${devicesOn} actief` : "—")}`;
}

function renderHousehold() {
  const root = $("osCardHousehold");
  if (!root) return;
  const household = getHousehold();
  root.innerHTML = `
    <div class="os-card-head"><h2>Household</h2></div>
    ${row("cart", "Boodschappen", household.shopping.length ? count(household.shopping.length, "item", "items") : "leeg")}
    ${row("tasks", "Huishoudtaken", household.chores.length ? `${household.chores.length} open` : "alles gedaan")}
    ${row("wrench", "Onderhoud", household.maintenance.length ? `${household.maintenance.length} gepland` : "niets gepland")}`;
}

function renderAll() {
  renderToday();
  renderEnergy();
  renderSmartHome();
  renderHousehold();
}

export function initOsHome() {
  renderAll();
  window.addEventListener("homehub:agenda-change", renderToday);
  window.addEventListener("homehub:focus-change", renderToday);
  window.addEventListener("homehub:weather-change", event => { weather = event.detail; renderToday(); });
  window.addEventListener("homehub:home-data-change", () => { renderEnergy(); renderSmartHome(); });
  window.addEventListener("homehub:household-change", renderHousehold);
  setInterval(renderToday, 60000);
}
