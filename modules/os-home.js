// Home OS — Home overview (four cards, as in the Home OS design).
import { $, escapeHtml } from "../core/dom.js";
import { getAgendaState } from "../core/state.js";
import { getFocusResult } from "../intelligence/context.js";
import { getHomeData } from "../services/homeassistant.js";
import { getHousehold } from "../services/household.js";
import { getPriceCurve, priceAdvice } from "../services/energy-prices.js";
import { getRain } from "../services/rain.js";
import { icon } from "./os-icons.js";
import { batteryState, count, dayLabel, dayTitle, decimal, euro, euroPerKwh, kw, timeNl } from "./os-format.js";

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

// One line about rain in the next two hours (Buienradar).
export function rainText(rain) {
  if (!rain) return null;
  if (rain.state === "dry") return { wet: false, text: "Droog de komende 2 uur" };
  if (rain.state === "raining") {
    return { wet: true, text: rain.until ? `Het regent · droog vanaf ${timeNl(rain.until)}` : "Het regent de komende 2 uur" };
  }
  const minutes = Math.max(0, Math.round((rain.from.getTime() - Date.now()) / 60000));
  return { wet: true, soon: minutes <= 60, text: minutes <= 5 ? "Regen begint zo" : `Regen over ${minutes} min (vanaf ${timeNl(rain.from)})` };
}

// The first upcoming waste pickup, e.g. "Morgen: GFT".
export function nextWaste(waste) {
  const first = (waste || [])[0];
  if (!first) return null;
  const sameDay = (waste || []).filter(item => item.date.getTime() === first.date.getTime()).map(item => item.name);
  return { date: first.date, label: dayLabel(first.date), names: sameDay.join(" + ") };
}

function renderBanners() {
  const root = $("osBanners");
  if (!root) return;
  const data = getHomeData();
  const items = [];

  if (data?.mode === "live") {
    const curve = getPriceCurve(data.energy?.priceEur);
    const advice = priceAdvice(curve);
    const price = euroPerKwh(curve?.current?.price ?? data.energy?.priceEur);
    if (advice?.level === "low") {
      items.push({ tone: "good", icon: "energy", text: `Stroom is nu goedkoop (${price}) · tot ${timeNl(advice.until)}` });
    } else if (advice?.level === "high") {
      const when = advice.from ? `${dayLabel(advice.from) === "Vandaag" ? "" : dayLabel(advice.from).toLowerCase() + " "}${timeNl(advice.from)}` : null;
      items.push({ tone: "bad", icon: "energy", text: `Stroom is nu duur (${price})${when ? ` · goedkoper vanaf ${when}` : ""}` });
    }

    const waste = nextWaste(data.waste);
    const hour = new Date().getHours();
    if (waste && ((waste.label === "Morgen" && hour >= 12) || (waste.label === "Vandaag" && hour < 12))) {
      items.push({ tone: "info", icon: "trash", text: `${waste.label}: ${waste.names} aan de straat` });
    }
  }

  const rain = rainText(getRain());
  if (rain?.wet && (getRain()?.state === "raining" || rain.soon)) {
    items.push({ tone: "info", icon: "rain", text: rain.text });
  }

  root.hidden = !items.length;
  root.innerHTML = items.map(item =>
    `<div class="os-banner is-${item.tone}">${icon(item.icon)}<span>${escapeHtml(item.text)}</span></div>`
  ).join("");
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
    ${rainLine()}
    ${list ? `<div class="os-events">${list}</div>` : ""}
    <div class="os-divider"></div>
    <div class="os-split">
      <div>
        <div class="os-card-section">${focus && ["tomorrow", "future"].includes(focus.state) ? "Volgende missie" : "Missie van vandaag"}</div>
        <div class="os-mission">${icon("check")}<span>${escapeHtml(focus?.title || "Rustige dag — geen missie nodig")}</span></div>
      </div>
      ${milestone()}
    </div>`;
}

function rainLine() {
  const rain = rainText(getRain());
  if (!rain) return "";
  return `<div class="os-hint ${rain.wet ? "is-rain" : "is-dry"}">${icon("rain")}${escapeHtml(rain.text)}</div>`;
}

// Mirrors the existing countdown (Agenda top bar, now hidden there) so the
// next milestone stays visible on Home without duplicating its logic.
function milestone() {
  const label = $("countdownLabel")?.textContent?.trim();
  const value = $("countdownValue")?.textContent?.trim().toUpperCase();
  if (!label || !value || value.startsWith("--") || value === "ALL CLEAR") return "";
  const iconText = $("countdownIcon")?.textContent?.trim() || "📅";
  const pretty = label.toLowerCase().replace(/(^|\s)\S/g, letter => letter.toUpperCase());
  let match;
  let when = value.toLowerCase();
  if (value === "HAPPENING NOW") when = "nu bezig";
  else if (value === "TODAY") when = "vandaag";
  else if (value === "TOMORROW") when = "morgen";
  else if ((match = value.match(/^IN (\d+) HOURS?$/))) when = `over ${match[1]} uur`;
  else if ((match = value.match(/^IN (\d+) DAYS?$/))) when = `over ${match[1]} ${match[1] === "1" ? "dag" : "dagen"}`;
  return `
    <div>
      <div class="os-card-section">Volgende mijlpaal</div>
      <div class="os-mission"><span>${escapeHtml(iconText)}</span><span>${escapeHtml(pretty)} · ${escapeHtml(when)}</span></div>
    </div>`;
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
    <div class="os-card-sub">Live verbruik${Number.isFinite(energy.priceEur) ? ` · Stroom nu ${euroPerKwh(energy.priceEur)}` : ""}${Number.isFinite(energy.gas?.priceEur) ? ` · Gas ${euro(energy.gas.priceEur)}/m³` : ""}</div>
    ${energy.cheapest ? `<div class="os-hint">${icon("euro")}Goedkoopst ${escapeHtml(energy.cheapest.day || "vandaag")} ${escapeHtml(energy.cheapest.from)}–${escapeHtml(energy.cheapest.to)}</div>` : ""}
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
    ${row("wrench", "Onderhoud", household.maintenance.length ? `${household.maintenance.length} gepland` : "niets gepland")}
    ${wasteRow()}`;
}

function wasteRow() {
  const data = getHomeData();
  if (data?.mode !== "live") return row("trash", "Afval", "na koppeling");
  const waste = nextWaste(data.waste);
  return row("trash", "Afval", waste ? `${waste.label}: ${waste.names}` : "na koppeling", waste && ["Vandaag", "Morgen"].includes(waste.label) ? "is-on" : "");
}

function renderAll() {
  renderBanners();
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
  window.addEventListener("homehub:home-data-change", () => { renderBanners(); renderEnergy(); renderSmartHome(); renderHousehold(); });
  window.addEventListener("homehub:household-change", renderHousehold);
  window.addEventListener("homehub:prices-change", renderBanners);
  window.addEventListener("homehub:rain-change", () => { renderBanners(); renderToday(); });
  setInterval(() => { renderBanners(); renderToday(); }, 60000);
  const countdown = $("countdownValue");
  if (countdown && "MutationObserver" in window) {
    new MutationObserver(renderToday).observe(countdown, { childList: true, characterData: true, subtree: true });
  }
}
