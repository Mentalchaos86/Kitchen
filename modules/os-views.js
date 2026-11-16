// Home OS — detail views: Energy, Smart Home and Household.
import { $, escapeHtml } from "../core/dom.js";
import { getHomeData, homeAssistantConfigured, homeAssistantUrl } from "../services/homeassistant.js";
import { addHouseholdItem, getHousehold, LISTS, removeHouseholdItem } from "../services/household.js";
import { icon } from "./os-icons.js";
import { batteryState, dayLabel, decimal, euro, euroPerKwh, kw, timeNl } from "./os-format.js";
import { getPriceCurve } from "../services/energy-prices.js";
import { nextWaste } from "./os-home.js";

const LEVEL_NL = { low: "Laag", normal: "Normaal", high: "Hoog" };

// Hourly price bars for today (and tomorrow once published, around 13:00).
export function priceChart(energy) {
  const curve = getPriceCurve(energy.priceEur);
  if (!curve) return `<section class="os-panel os-prices"><h3 class="os-section-title">${icon("euro")}Stroomprijs per uur</h3><div class="os-empty">Uurprijzen laden…</div></section>`;
  const max = Math.max(...curve.hours.map(hour => hour.price));
  const min = Math.min(0, ...curve.hours.map(hour => hour.price));
  const tomorrowIndex = curve.hours.findIndex(hour => dayLabel(hour.start) === "Morgen");

  const bars = curve.hours.map((hour, index) => {
    const height = Math.max(3, ((hour.price - min) / (max - min || 1)) * 100);
    const label = `${dayLabel(hour.start)} ${timeNl(hour.start)} · ${euroPerKwh(hour.price)} · ${LEVEL_NL[hour.level]}`;
    const tick = hour.start.getHours() % 6 === 0 ? `<span class="os-bar-tick">${String(hour.start.getHours()).padStart(2, "0")}</span>` : "";
    return `<div class="os-bar-slot${index === tomorrowIndex ? " is-day-start" : ""}" title="${escapeHtml(label)}">
        ${hour.now ? `<span class="os-bar-now">nu</span>` : ""}
        <span class="os-bar is-${hour.level}${hour.past ? " is-past" : ""}${hour.now ? " is-now" : ""}" style="height:${height.toFixed(1)}%"></span>
        ${tick}
      </div>`;
  }).join("");

  const range = (name, r) => r ? `${name} ${euro(r.min)} – ${euro(r.max)}` : null;
  const summary = [range("Vandaag", curve.todayRange), range("Morgen", curve.tomorrowRange)].filter(Boolean).join(" · ");

  return `
    <section class="os-panel os-prices">
      <div class="os-prices-head">
        <h3 class="os-section-title">${icon("euro")}Stroomprijs per uur</h3>
        <div class="os-legend">
          <span><i class="is-low"></i>Laag</span><span><i class="is-normal"></i>Normaal</span><span><i class="is-high"></i>Hoog</span>
        </div>
      </div>
      <div class="os-tile-sub">${escapeHtml(summary)} · per kWh, inclusief belasting (berekend)</div>
      <div class="os-bars" role="img" aria-label="Stroomprijs per uur. ${escapeHtml(summary)}">${bars}</div>
      ${tomorrowIndex > 0 ? `<div class="os-bars-days"><span style="flex:${tomorrowIndex}">Vandaag</span><span style="flex:${curve.hours.length - tomorrowIndex}">Morgen</span></div>` : ""}
    </section>`;
}

function notice(data) {
  if (data?.mode === "live") return "";
  if (data?.mode === "error") {
    return `<div class="os-notice is-error">Home Assistant is niet bereikbaar (${escapeHtml(data.error || "fout")}). Laatst bekende of demo-gegevens worden getoond.</div>`;
  }
  return `<div class="os-notice">Demo-gegevens. Koppel Home Assistant via <strong>Instellingen → Verbindingen</strong> om echte waarden te zien.</div>`;
}

function tile(iconName, label, value, sub = "") {
  return `<div class="os-tile">${icon(iconName)}<div class="os-tile-label">${escapeHtml(label)}</div><div class="os-tile-value">${escapeHtml(value)}</div>${sub ? `<div class="os-tile-sub">${escapeHtml(sub)}</div>` : ""}</div>`;
}

function renderEnergy() {
  const root = $("osViewEnergy");
  if (!root) return;
  const data = getHomeData();
  const energy = data?.energy || {};
  const month = energy.month || {};
  const gas = energy.gas || {};
  const batteries = (energy.batteries || []).map(battery => {
    const level = Number.isFinite(battery.level) ? Math.max(0, Math.min(100, battery.level)) : null;
    return `
      <div class="os-battery">
        <div class="os-battery-head">${icon("battery")}<strong>${escapeHtml(battery.name)}</strong><span>${level === null ? "—" : Math.round(level) + "%"}</span></div>
        <div class="os-meter"><span style="width:${level ?? 0}%"></span></div>
        <div class="os-tile-sub">${batteryState(battery.powerW)}${Number.isFinite(battery.powerW) && Math.abs(battery.powerW) >= 20 ? ` · ${kw(Math.abs(battery.powerW))}` : ""}</div>
      </div>`;
  }).join("");

  root.innerHTML = `
    ${notice(data)}
    <div class="os-tiles">
      ${tile("energy", "Verbruik nu", kw(energy.powerW))}
      ${tile("sun", "Zonne-opbrengst", kw(energy.solarW))}
      ${tile("euro", "Stroomprijs nu", euroPerKwh(energy.priceEur), [Number.isFinite(energy.nextHourPriceEur) && `volgend uur ${euroPerKwh(energy.nextHourPriceEur)}`, Number.isFinite(energy.sustainability) && `${Math.round(energy.sustainability)}% duurzaam`].filter(Boolean).join(" · ") || "Zonneplan")}
      ${tile("check", "Goedkoopste moment", energy.cheapest ? `${energy.cheapest.from}–${energy.cheapest.to}` : "—", energy.cheapest ? `${energy.cheapest.day || "vandaag"} · ideaal voor wasmachine of vaatwasser` : "Beschikbaar na koppeling")}
    </div>
    ${priceChart(energy)}
    <div class="os-tiles">
      ${tile("energy", "Stroom deze maand", Number.isFinite(month.usedKwh) ? `${decimal(month.usedKwh, 0)} kWh` : "—", Number.isFinite(month.returnedKwh) ? `${decimal(month.returnedKwh, 1)} kWh teruggeleverd` : "")}
      ${tile("euro", "Stroomkosten deze maand", euro(month.costEur), "Zonneplan")}
      ${tile("flame", "Gas deze maand", Number.isFinite(gas.usedM3) ? `${decimal(gas.usedM3, 1)} m³` : "—", Number.isFinite(gas.costEur) ? `${euro(gas.costEur)} kosten` : "")}
      ${tile("flame", "Gasprijs vandaag", Number.isFinite(gas.priceEur) ? `${euro(gas.priceEur)}/m³` : "—", "Zonneplan")}
    </div>
    <h3 class="os-section-title">Batterijen</h3>
    <div class="os-batteries">${batteries || `<div class="os-empty">Nog geen batterijen gekoppeld.</div>`}</div>`;
}

function stateList(title, iconName, items, format) {
  const rows = items.length
    ? items.map(item => `<div class="os-row ${item.on ? "is-on" : ""}">${icon(iconName)}<span class="os-row-label">${escapeHtml(item.name)}</span><span class="os-row-value">${escapeHtml(format(item))}</span></div>`).join("")
    : `<div class="os-empty">Nog niets gekoppeld.</div>`;
  return `<section class="os-panel"><h3 class="os-section-title">${escapeHtml(title)}</h3>${rows}</section>`;
}

function renderSmartHome() {
  const root = $("osViewSmartHome");
  if (!root) return;
  const data = getHomeData();
  root.innerHTML = `
    ${notice(data)}
    <div class="os-columns">
      ${stateList("Verlichting", "bulb", data?.lights || [], item => (item.on ? "Aan" : "Uit"))}
      ${stateList("Temperatuur", "thermometer", data?.climate || [], item => `${decimal(item.value)}${item.unit || "°"}`)}
      ${stateList("Apparaten", "plug", data?.devices || [], item => (item.on ? "Actief" : "Uit"))}
    </div>`;
}

// ---------- Camera tab ----------
// Images only load while the Camera tab is open; leaving it stops them.
let selectedCamera = null;
let cameraTimer = null;
let cameraKey = "";

const cameraOpen = () => document.body.dataset.osView === "camera";
const cameraList = () => (getHomeData()?.mode === "live" ? getHomeData().cameras || [] : []);

function cameraSrc(camera) {
  return `${homeAssistantUrl()}${camera.picture}${camera.picture.includes("?") ? "&" : "?"}t=${Date.now()}`;
}

function renderCamera() {
  const root = $("osViewCamera");
  if (!root) return;
  if (!cameraOpen()) {
    root.innerHTML = "";
    cameraKey = "";
    return;
  }
  const cameras = cameraList();
  cameraKey = cameras.map(camera => camera.id).join("|");
  if (!cameras.length) {
    root.innerHTML = `<div class="os-notice">Nog geen camera's gevonden. Koppel in Home Assistant de integratie <strong>Ring</strong>; dan verschijnen de camera's hier vanzelf.</div>`;
    return;
  }
  const camera = cameras.find(item => item.id === selectedCamera) || cameras[0];
  selectedCamera = camera.id;
  root.innerHTML = `
    <div class="os-glass os-camera-main">
      <img id="osCameraImage" src="${escapeHtml(cameraSrc(camera))}" alt="${escapeHtml(camera.name)}">
      <div class="os-camera-caption">${icon("camera")}<span>${escapeHtml(camera.name)}</span><small id="osCameraTime">${timeNl(new Date())}</small></div>
    </div>
    <div class="os-camera-list">
      ${cameras.map(item => `<button type="button" class="os-glass-button${item.id === camera.id ? " is-active" : ""}" data-camera="${escapeHtml(item.id)}">${icon("camera")}<span>${escapeHtml(item.name)}</span></button>`).join("")}
    </div>`;
}

function refreshCameraImage() {
  if (!cameraOpen()) return;
  const image = $("osCameraImage");
  const camera = cameraList().find(item => item.id === selectedCamera);
  if (!image || !camera) return;
  // Load off-screen first so the picture never flashes empty.
  const next = new Image();
  next.onload = () => {
    image.src = next.src;
    const time = $("osCameraTime");
    if (time) time.textContent = timeNl(new Date());
  };
  next.src = cameraSrc(camera);
}

function bindCamera() {
  const root = $("osViewCamera");
  if (!root) return;
  root.addEventListener("click", event => {
    const button = event.target.closest("[data-camera]");
    if (!button) return;
    selectedCamera = button.dataset.camera;
    renderCamera();
    root.querySelector(`[data-camera="${CSS.escape(selectedCamera)}"]`)?.focus();
  });
  window.addEventListener("homehub:view-change", () => {
    clearInterval(cameraTimer);
    cameraTimer = null;
    renderCamera();
    if (cameraOpen()) {
      cameraTimer = setInterval(refreshCameraImage, 5000);
      root.querySelector(".os-camera-list .is-active")?.focus();
    }
  });
  window.addEventListener("homehub:home-data-change", () => {
    if (cameraOpen() && cameraList().map(camera => camera.id).join("|") !== cameraKey) renderCamera();
  });
}

const LIST_ICONS = { shopping: "cart", chores: "tasks", maintenance: "wrench" };

function renderHousehold() {
  const root = $("osViewHousehold");
  if (!root) return;
  const household = getHousehold();
  const data = getHomeData();
  const waste = data?.mode === "live" ? (data.waste || []) : [];
  const upcoming = waste.slice(0, 4).map(item => {
    const soon = ["Vandaag", "Morgen"].includes(dayLabel(item.date));
    return `<div class="os-tile${soon ? " is-soon" : ""}">${icon("trash")}<div class="os-tile-label">${escapeHtml(item.name)}</div><div class="os-tile-value">${escapeHtml(dayLabel(item.date))}</div></div>`;
  }).join("");
  root.innerHTML = `
    <section>
      <h3 class="os-section-title">${icon("trash")}Afvalkalender</h3>
      ${upcoming
        ? `<div class="os-tiles">${upcoming}</div>`
        : `<div class="os-notice">Nog geen afvalkalender gekoppeld. Voeg in Home Assistant de koppeling <strong>Afvalwijzer</strong> toe (met je postcode); dan verschijnen de ophaaldagen hier vanzelf.</div>`}
    </section>
    <div class="os-notice">Lijsten worden voorlopig op dit apparaat bewaard. Samen bewerken vanaf je telefoon volgt in een volgende versie.</div>
    <div class="os-columns">
      ${Object.entries(LISTS).map(([key, meta]) => `
        <section class="os-panel">
          <h3 class="os-section-title">${icon(LIST_ICONS[key])}${escapeHtml(meta.label)}</h3>
          <div class="os-list">
            ${household[key].length
              ? household[key].map(entry => `
                <div class="os-list-item">
                  <span>${escapeHtml(entry.text)}</span>
                  <button type="button" class="os-icon-button" data-household-remove="${key}" data-id="${escapeHtml(entry.id)}" aria-label="${escapeHtml(entry.text)} afvinken">${icon("check")}</button>
                </div>`).join("")
              : `<div class="os-empty">${escapeHtml(meta.empty)}</div>`}
          </div>
          <form class="os-add" data-household-add="${key}">
            <input type="text" maxlength="80" placeholder="Toevoegen…" aria-label="${escapeHtml(meta.label)} toevoegen">
            <button type="submit" class="os-icon-button" aria-label="Toevoegen">${icon("plus")}</button>
          </form>
        </section>`).join("")}
    </div>`;
}

function bindHousehold() {
  const root = $("osViewHousehold");
  if (!root) return;
  root.addEventListener("click", event => {
    const button = event.target.closest("[data-household-remove]");
    if (button) removeHouseholdItem(button.dataset.householdRemove, button.dataset.id);
  });
  root.addEventListener("submit", event => {
    const form = event.target.closest("[data-household-add]");
    if (!form) return;
    event.preventDefault();
    const input = form.querySelector("input");
    const list = form.dataset.householdAdd;
    addHouseholdItem(list, input.value);
    // Keep typing in the same list after the re-render.
    root.querySelector(`[data-household-add="${list}"] input`)?.focus();
  });
}

export function initOsViews() {
  renderEnergy();
  renderSmartHome();
  renderHousehold();
  bindHousehold();
  bindCamera();
  // Household only re-renders when the waste dates change, so typing in its
  // input fields is not interrupted by the 30-second Home Assistant refresh.
  let wasteKey = "";
  window.addEventListener("homehub:home-data-change", () => {
    renderEnergy();
    renderSmartHome();
    const data = getHomeData();
    const key = data?.mode === "live" ? JSON.stringify(data.waste || []) : "";
    if (key !== wasteKey) {
      wasteKey = key;
      renderHousehold();
    }
  });
  window.addEventListener("homehub:prices-change", renderEnergy);
  window.addEventListener("homehub:household-change", renderHousehold);
  if (!homeAssistantConfigured()) console.info("[HomeOS] Home Assistant not configured — showing demo data.");
}
