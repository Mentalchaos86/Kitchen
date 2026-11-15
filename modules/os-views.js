// Home OS — detail views: Energy, Smart Home and Household.
import { $, escapeHtml } from "../core/dom.js";
import { getHomeData, homeAssistantConfigured } from "../services/homeassistant.js";
import { addHouseholdItem, getHousehold, LISTS, removeHouseholdItem } from "../services/household.js";
import { icon } from "./os-icons.js";
import { batteryState, decimal, euroPerKwh, kw } from "./os-format.js";

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
      ${tile("euro", "Stroomprijs nu", euroPerKwh(energy.priceEur), [energy.tariffGroup && `Tarief ${energy.tariffGroup.toLowerCase()}`, Number.isFinite(energy.nextHourPriceEur) && `volgend uur ${euroPerKwh(energy.nextHourPriceEur)}`].filter(Boolean).join(" · ") || "Zonneplan")}
      ${tile("check", "Goedkoopste moment", energy.cheapest ? `${energy.cheapest.from}–${energy.cheapest.to}` : "—", energy.cheapest ? `${energy.cheapest.day || "vandaag"} · ideaal voor wasmachine of vaatwasser` : "Beschikbaar na koppeling")}
    </div>
    <div class="os-tiles">
      ${tile("energy", "Verbruik deze maand", Number.isFinite(month.usedKwh) ? `${decimal(month.usedKwh, 0)} kWh` : "—", Number.isFinite(month.returnedKwh) ? `${decimal(month.returnedKwh, 1)} kWh teruggeleverd` : "")}
      ${tile("euro", "Stroomkosten deze maand", Number.isFinite(month.costEur) ? `€ ${decimal(month.costEur, 2)}` : "—", "Zonneplan")}
      ${tile("sun", "Duurzaamheid nu", Number.isFinite(energy.sustainability) ? `${Math.round(energy.sustainability)}%` : "—", "groen opgewekte stroom")}
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

const LIST_ICONS = { shopping: "cart", chores: "tasks", maintenance: "wrench" };

function renderHousehold() {
  const root = $("osViewHousehold");
  if (!root) return;
  const household = getHousehold();
  root.innerHTML = `
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
  window.addEventListener("homehub:home-data-change", () => { renderEnergy(); renderSmartHome(); });
  window.addEventListener("homehub:household-change", renderHousehold);
  if (!homeAssistantConfigured()) console.info("[HomeOS] Home Assistant not configured — showing demo data.");
}
