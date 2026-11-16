// Home OS — Home screen (glass layout): status chips, camera or price chart,
// weather, energy ring, rooms, shortcuts, agenda + month, and a bottom dock.
import { $, escapeHtml } from "../core/dom.js";
import { getAgendaState } from "../core/state.js";
import { getFocusResult } from "../intelligence/context.js";
import { getHomeData } from "../services/homeassistant.js";
import { getHousehold } from "../services/household.js";
import { getPriceCurve, priceAdvice } from "../services/energy-prices.js";
import { getRain } from "../services/rain.js";
import { getForecast, weatherLabel } from "../services/forecast.js";
import { icon } from "./os-icons.js";
import { priceChart } from "./os-views.js";
import { batteryState, count, dayLabel, decimal, euro, euroPerKwh, kw, timeNl } from "./os-format.js";

let monthEvents = null;
const LEVEL_NL = { low: "Laag", normal: "Normaal", high: "Hoog" };

// ---------- Shared helpers (also used by os-views.js) ----------

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

function live() {
  const data = getHomeData();
  return data?.mode === "live" ? data : null;
}

function demoBadge() {
  const data = getHomeData();
  if (!data || data.mode === "live") return "";
  return data.mode === "error"
    ? `<span class="os-badge is-error">GEEN VERBINDING</span>`
    : `<span class="os-badge">DEMO</span>`;
}

function mainBattery(energy) {
  return (energy?.batteries || []).find(battery => Number.isFinite(battery.level)) || null;
}

// ---------- Status chips (top row) ----------

// Mirrors the existing countdown (Agenda top bar) so the next milestone shows on Home.
function milestone() {
  const label = $("countdownLabel")?.textContent?.trim();
  const value = $("countdownValue")?.textContent?.trim().toUpperCase();
  if (!label || !value || value.startsWith("--") || value === "ALL CLEAR") return null;
  const pretty = label.toLowerCase().replace(/(^|\s)\S/g, letter => letter.toUpperCase());
  let match;
  let when = value.toLowerCase();
  if (value === "HAPPENING NOW") when = "nu bezig";
  else if (value === "TODAY") when = "vandaag";
  else if (value === "TOMORROW") when = "morgen";
  else if ((match = value.match(/^IN (\d+) HOURS?$/))) when = `over ${match[1]} uur`;
  else if ((match = value.match(/^IN (\d+) DAYS?$/))) when = `over ${match[1]} ${match[1] === "1" ? "dag" : "dagen"}`;
  return { title: pretty, sub: when, emoji: $("countdownIcon")?.textContent?.trim() || "" };
}

function renderChips() {
  const root = $("osBanners");
  if (!root) return;
  const data = live();
  const chips = [];

  if (data) {
    const curve = getPriceCurve(data.energy?.priceEur);
    const advice = priceAdvice(curve);
    const price = euroPerKwh(curve?.current?.price ?? data.energy?.priceEur);
    if (advice?.level === "low") chips.push({ tone: "good", icon: "energy", title: "Stroom is goedkoop", sub: `${price} · tot ${timeNl(advice.until)}` });
    else if (advice?.level === "high") chips.push({ tone: "bad", icon: "energy", title: "Stroom is duur", sub: advice.from ? `${price} · goedkoper ${dayLabel(advice.from) === "Vandaag" ? "" : dayLabel(advice.from).toLowerCase() + " "}${timeNl(advice.from)}` : price });

    const waste = nextWaste(data.waste);
    const hour = new Date().getHours();
    if (waste && ((waste.label === "Morgen" && hour >= 12) || (waste.label === "Vandaag" && hour < 12))) {
      chips.push({ tone: "warn", icon: "trash", title: `${waste.names} aan de straat`, sub: waste.label });
    }

    const battery = mainBattery(data.energy);
    if (battery) {
      const power = Number.isFinite(battery.powerW) && Math.abs(battery.powerW) >= 20 ? ` · ${kw(Math.abs(battery.powerW))}` : "";
      chips.push({ tone: battery.level >= 20 ? "good" : "bad", icon: "battery", title: `${battery.name} ${Math.round(battery.level)}%`, sub: `${batteryState(battery.powerW)}${power}` });
    }
  }

  const rain = rainText(getRain());
  if (rain?.wet && (getRain()?.state === "raining" || rain.soon)) chips.push({ tone: "info", icon: "rain", title: "Regen", sub: rain.text });

  const next = nextEvents(1)[0];
  if (next) {
    chips.push({ tone: "accent", icon: "calendar", title: next.title || "Afspraak", sub: `${dayLabel(new Date(next.start))}${next.allDay ? "" : " · " + timeNl(new Date(next.start))}` });
  }
  const focus = getFocusResult().focus;
  if (focus?.title && !["tomorrow", "future"].includes(focus.state)) chips.push({ tone: "accent", icon: "check", title: focus.title, sub: "Missie van vandaag" });
  const mile = milestone();
  if (mile) chips.push({ tone: "accent", icon: "calendar", title: mile.title, sub: mile.sub });

  // The next appointment and today's mission are often the same event.
  const seen = new Set();
  const unique = chips.filter(chip => {
    const key = chip.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  root.innerHTML = unique.slice(0, 5).map(chip => `
    <div class="os-chip-status is-${chip.tone}">
      <span class="os-chip-icon">${icon(chip.icon)}</span>
      <span class="os-chip-text"><strong>${escapeHtml(chip.title)}</strong><small>${escapeHtml(chip.sub || "")}</small></span>
    </div>`).join("");
}

// ---------- Hero: hourly price chart (cameras have their own tab) ----------

function renderHero() {
  const root = $("osCardHero");
  if (!root) return;
  root.innerHTML = priceChart(getHomeData()?.energy || {});
}

// ---------- Weather ----------

function renderWeather() {
  const root = $("osCardWeather");
  if (!root) return;
  const forecast = getForecast();
  if (!forecast) {
    root.innerHTML = `<div class="os-empty">Weer laden…</div>`;
    return;
  }
  const [label, emoji] = weatherLabel(forecast.code);
  const today = forecast.days[0];
  const rain = rainText(getRain());
  const weekday = new Intl.DateTimeFormat("nl-NL", { weekday: "short" });
  root.innerHTML = `
    <div class="os-weather-now">
      <span class="os-weather-emoji">${emoji}</span>
      <span class="os-weather-temp">${Math.round(forecast.temperature)}°</span>
    </div>
    <div class="os-weather-label">${escapeHtml(label)}</div>
    <div class="os-weather-range">Max ${Math.round(today.max)}° · Min ${Math.round(today.min)}°</div>
    ${rain ? `<div class="os-weather-rain${rain.wet ? " is-wet" : ""}">${icon("rain")}${escapeHtml(rain.text)}</div>` : ""}
    <div class="os-weather-days">
      ${forecast.days.slice(1, 5).map(day => `
        <div class="os-weather-day">
          <span>${escapeHtml(weekday.format(day.date).replace(".", ""))}</span>
          <span class="os-weather-day-emoji">${weatherLabel(day.code)[1]}</span>
          <strong>${Math.round(day.max)}°</strong>
          <small>${Math.round(day.min)}°</small>
        </div>`).join("")}
    </div>`;
}

// ---------- Energy ring ----------

const RING_R = 84;
const RING_C = 2 * Math.PI * RING_R;
const RING_ARC = RING_C * 0.75;

function renderEnergy() {
  const root = $("osCardEnergy");
  if (!root) return;
  const data = getHomeData();
  const energy = data?.energy || {};
  const curve = getPriceCurve(energy.priceEur);
  const level = curve?.current?.level || null;
  const power = energy.powerW;
  const hasPower = Number.isFinite(power);
  const exporting = hasPower && power < 0;
  const fraction = hasPower ? Math.min(1, Math.abs(power) / Math.max(4000, Math.abs(power))) : 0;
  const angle = (135 + 270 * fraction) * Math.PI / 180;
  const knobX = 100 + RING_R * Math.cos(angle);
  const knobY = 100 + RING_R * Math.sin(angle);
  const battery = mainBattery(energy);

  const centre = hasPower
    ? `<div class="os-ring-label">${exporting ? "Teruglevering" : "Verbruik nu"}</div>
       <div class="os-ring-value">${decimal(Math.abs(power) / 1000, 2)}<small>kW</small></div>`
    : `<div class="os-ring-label">Stroom nu</div>
       <div class="os-ring-value">${Number.isFinite(energy.priceEur) ? decimal(energy.priceEur, 2) : "—"}<small>€/kWh</small></div>`;
  const priceLine = hasPower && Number.isFinite(energy.priceEur)
    ? `<div class="os-ring-sub">${level ? `<i class="os-dot is-${level}"></i>` : ""}${euroPerKwh(energy.priceEur)}${level ? ` · ${LEVEL_NL[level]}` : ""}</div>`
    : level ? `<div class="os-ring-sub"><i class="os-dot is-${level}"></i>${LEVEL_NL[level]}</div>` : "";

  const pill = (iconName, value, label, extra = "") => `<div class="os-energy-pill ${extra}" title="${escapeHtml(label)}">${icon(iconName)}<strong>${escapeHtml(value)}</strong><small>${escapeHtml(label)}</small></div>`;

  root.innerHTML = `
    <div class="os-card-head"><h2>Energie</h2>${demoBadge()}</div>
    <div class="os-ring${exporting ? " is-export" : ""}">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle class="os-ring-track" cx="100" cy="100" r="${RING_R}" stroke-dasharray="${RING_ARC.toFixed(1)} ${RING_C.toFixed(1)}" transform="rotate(135 100 100)"/>
        ${hasPower ? `<circle class="os-ring-fill" cx="100" cy="100" r="${RING_R}" stroke-dasharray="${(RING_ARC * fraction).toFixed(1)} ${RING_C.toFixed(1)}" transform="rotate(135 100 100)"/>
        <circle class="os-ring-knob" cx="${knobX.toFixed(1)}" cy="${knobY.toFixed(1)}" r="7"/>` : ""}
      </svg>
      <div class="os-ring-centre">${centre}${priceLine}</div>
    </div>
    <div class="os-energy-pills">
      ${pill("battery", battery ? `${Math.round(battery.level)}%` : "—", battery ? batteryState(battery.powerW) : "batterij", battery && Math.abs(battery.powerW || 0) >= 20 ? "is-active" : "")}
      ${pill("sun", Number.isFinite(energy.solarW) ? kw(energy.solarW) : "—", "zon", energy.solarW > 20 ? "is-active" : "")}
      ${pill("euro", energy.cheapest ? energy.cheapest.from : "—", "goedkoopst")}
    </div>`;
}

// ---------- Rooms ----------

function roomIcon(name) {
  const text = name.toLowerCase();
  if (/keuken|kitchen/.test(text)) return ["utensils", "is-green"];
  if (/woon|living|lounge|zit/.test(text)) return ["sofa", "is-red"];
  if (/slaap|bed|kinder|baby/.test(text)) return ["bed", "is-purple"];
  if (/bad|bath|douche|toilet|wc/.test(text)) return ["bath", "is-blue"];
  if (/kantoor|werk|office|studeer|game/.test(text)) return ["desk", "is-yellow"];
  if (/hal|gang|entree|voor/.test(text)) return ["door", "is-teal"];
  return ["home", "is-orange"];
}

function renderRooms() {
  const root = $("osCardRooms");
  if (!root) return;
  const rooms = getHomeData()?.rooms || [];
  const rows = rooms.slice(0, 6).map(room => {
    const [iconName, tone] = roomIcon(room.name);
    return `
      <div class="os-room">
        <span class="os-room-icon ${tone}">${icon(iconName)}</span>
        <span class="os-room-name">${escapeHtml(room.name)}</span>
        ${room.lights ? `<span class="os-room-lights${room.lightsOn ? " is-on" : ""}">${icon("bulb")}${room.lightsOn}</span>` : ""}
        <span class="os-room-temp">${Number.isFinite(room.temperature) ? decimal(room.temperature) : "—"}</span>
      </div>`;
  }).join("");
  root.innerHTML = `
    <div class="os-card-head"><h2>Ruimtes</h2>${demoBadge()}</div>
    ${rows || `<div class="os-empty">Wijs in Home Assistant je lampen en sensoren toe aan ruimtes; dan verschijnen ze hier.</div>`}`;
}

// ---------- Shortcuts (lights and devices) ----------

function renderShortcuts() {
  const root = $("osCardShortcuts");
  if (!root) return;
  const data = getHomeData();
  const items = [
    ...(data?.lights || []).map(item => ({ ...item, icon: "bulb" })),
    ...(data?.devices || []).map(item => ({ ...item, icon: "plug" }))
  ].slice(0, 6);
  root.innerHTML = `
    <div class="os-card-head"><h2>Snelkoppelingen</h2></div>
    <div class="os-shortcut-grid">
      ${items.map(item => `
        <div class="os-shortcut${item.on ? " is-on" : ""}">
          ${icon(item.icon)}
          <span>${escapeHtml(item.name)}</span>
        </div>`).join("") || `<div class="os-empty">Nog geen lampen of apparaten.</div>`}
    </div>`;
}

// ---------- Agenda: next days + month ----------

function eventsSource() {
  if (monthEvents) return monthEvents;
  const agenda = getAgendaState();
  return agenda.events?.length ? agenda.events : agenda.today || [];
}

function nextEvents(limit) {
  const now = new Date();
  return eventsSource()
    .filter(event => new Date(event.end || event.start) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, limit);
}

function eventTime(event) {
  if (event.allDay) return "Hele dag";
  const start = new Date(event.start);
  const end = new Date(event.end || event.start);
  return end > start ? `${timeNl(start)} – ${timeNl(end)}` : timeNl(start);
}

function renderAgenda() {
  const root = $("osCardAgenda");
  if (!root) return;
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const events = eventsSource();

  const groups = [];
  let shown = 0;
  for (let offset = 0; offset < 7 && shown < 5; offset++) {
    const from = new Date(dayStart);
    from.setDate(from.getDate() + offset);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    const items = events
      .filter(event => new Date(event.start) < to && new Date(event.end || event.start) > (offset === 0 ? now : from))
      .sort((a, b) => (a.allDay === b.allDay ? new Date(a.start) - new Date(b.start) : a.allDay ? -1 : 1))
      .slice(0, 5 - shown);
    if (!items.length) continue;
    shown += items.length;
    groups.push(`
      <div class="os-agenda-day">${escapeHtml(dayLabel(from))}</div>
      ${items.map(event => `
        <div class="os-agenda-item" style="--event-color:${escapeHtml(event.color || "var(--os-accent)")}">
          <strong>${escapeHtml(event.title || "Afspraak")}</strong>
          <small>${escapeHtml(eventTime(event))}</small>
        </div>`).join("")}`);
  }

  // Month grid (Monday first) with a dot on days that have events.
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(1 - ((first.getDay() + 6) % 7));
  const busy = new Set();
  events.forEach(event => {
    const start = new Date(event.start);
    const end = new Date(event.end || event.start);
    for (let day = new Date(start.getFullYear(), start.getMonth(), start.getDate()); day < end || day.getTime() === new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime(); day.setDate(day.getDate() + 1)) {
      busy.add(day.toDateString());
      if (busy.size > 400) break;
    }
  });
  const cells = [];
  for (let index = 0; index < 42; index++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    if (index === 35 && date.getMonth() !== now.getMonth()) break;
    const classes = [
      date.getMonth() !== now.getMonth() ? "is-outside" : "",
      date.toDateString() === now.toDateString() ? "is-today" : "",
      busy.has(date.toDateString()) ? "is-busy" : ""
    ].filter(Boolean).join(" ");
    cells.push(`<span class="${classes}">${date.getDate()}</span>`);
  }
  const monthName = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" }).format(now);
  const title = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long" }).format(now);

  root.innerHTML = `
    <div class="os-agenda-list">
      <h2 class="os-agenda-title">${escapeHtml(title.charAt(0).toUpperCase() + title.slice(1))}</h2>
      ${groups.join("") || `<div class="os-empty">Geen afspraken de komende week.</div>`}
    </div>
    <div class="os-month">
      <div class="os-month-title">${escapeHtml(monthName.charAt(0).toUpperCase() + monthName.slice(1))}</div>
      <div class="os-month-grid">
        ${["ma", "di", "wo", "do", "vr", "za", "zo"].map(day => `<b>${day}</b>`).join("")}
        ${cells.join("")}
      </div>
    </div>`;
}

// ---------- Dock (bottom row) ----------

function renderDock() {
  const root = $("osDock");
  if (!root) return;
  const data = getHomeData();
  const household = getHousehold();
  const lights = data?.lights || [];
  const lightsOn = lights.filter(light => light.on).length;
  const temps = (data?.climate || []).map(item => item.value).filter(Number.isFinite);
  const average = temps.length ? temps.reduce((sum, value) => sum + value, 0) / temps.length : null;
  const waste = live() ? nextWaste(live().waste) : null;

  const item = (iconName, tone, title, sub) => `
    <div class="os-dock-item">
      <span class="os-chip-icon is-${tone}">${icon(iconName)}</span>
      <span class="os-chip-text"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(sub)}</small></span>
    </div>`;

  root.innerHTML = [
    item("bulb", lightsOn ? "accent" : "muted", lights.length ? count(lightsOn, "lamp aan", "lampen aan") : "Verlichting", lights.length ? `van ${lights.length} lampen` : "nog niet gekoppeld"),
    item("thermometer", "muted", average !== null ? `${decimal(average)} °C` : "Temperatuur", average !== null ? "gemiddeld binnen" : "nog geen sensoren"),
    item("trash", waste && ["Vandaag", "Morgen"].includes(waste.label) ? "warn" : "muted", waste ? waste.names : "Afval", waste ? waste.label : "geen ophaaldag bekend"),
    item("cart", household.shopping.length ? "accent" : "muted", "Boodschappen", household.shopping.length ? count(household.shopping.length, "item", "items") : "lijst is leeg"),
    item("tasks", household.chores.length ? "accent" : "muted", "Huishouden", household.chores.length ? `${household.chores.length} open` : "alles gedaan")
  ].join("");
}

// ---------- Wiring ----------

function renderAll() {
  renderChips();
  renderHero();
  renderWeather();
  renderEnergy();
  renderRooms();
  renderShortcuts();
  renderAgenda();
  renderDock();
}

export function initOsHome() {
  renderAll();
  window.addEventListener("homehub:home-data-change", () => {
    renderChips();
    renderHero();
    renderEnergy();
    renderRooms();
    renderShortcuts();
    renderDock();
  });
  window.addEventListener("homehub:prices-change", () => { renderChips(); renderEnergy(); renderHero(); });
  window.addEventListener("homehub:forecast-change", renderWeather);
  window.addEventListener("homehub:rain-change", () => { renderChips(); renderWeather(); });
  window.addEventListener("homehub:agenda-change", () => { renderChips(); renderAgenda(); });
  window.addEventListener("homehub:month-events", event => { monthEvents = event.detail || []; renderChips(); renderAgenda(); });
  window.addEventListener("homehub:focus-change", renderChips);
  window.addEventListener("homehub:household-change", renderDock);
  setInterval(() => { renderChips(); renderAgenda(); }, 60000);
  const countdown = $("countdownValue");
  if (countdown && "MutationObserver" in window) {
    new MutationObserver(renderChips).observe(countdown, { childList: true, characterData: true, subtree: true });
  }
}
