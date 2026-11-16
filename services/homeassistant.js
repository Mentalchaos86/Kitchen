// Home Assistant data layer for Home OS.
// - Without a URL + token (entered on the device) it returns clearly marked demo data.
// - With a connection it reads /api/states once per refresh and maps the entity IDs
//   from config.homeAssistant. Read-only: nothing is switched from the dashboard yet.

import { config } from "../core/config.js";
import { getDeviceSecret } from "../core/secrets.js";

const ha = () => config.homeAssistant || {};

let latest = null;
let timer = null;

export function getHomeData() {
  return latest;
}

export function homeAssistantConfigured() {
  return Boolean(getDeviceSecret("haUrl") && getDeviceSecret("haToken"));
}

function number(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function demoData() {
  // Gentle variation so the demo looks alive, always labelled as demo in the UI.
  const minute = new Date().getMinutes();
  const wave = Math.sin(minute / 9);
  return {
    mode: "demo",
    updatedAt: new Date().toISOString(),
    energy: {
      powerW: Math.round(620 + wave * 240),
      priceEur: 0.21 + wave * 0.04,
      solarW: Math.max(0, Math.round(900 + wave * 500)),
      nextHourPriceEur: 0.24 + wave * 0.03,
      tariffGroup: "Normaal",
      sustainability: 69,
      cheapest: { day: "vandaag", from: "13:00", to: "15:00" },
      month: { usedKwh: 204.4, returnedKwh: 3.6, costEur: 81.05 },
      gas: { priceEur: 1.89, usedM3: 48.5, costEur: 90.7 },
      batteries: [
        { name: "Anker", level: 78, powerW: -350 },
        { name: "Zendure", level: 64, powerW: 0 }
      ]
    },
    lights: [
      { id: "demo.keuken", name: "Keuken", on: true },
      { id: "demo.woonkamer", name: "Woonkamer", on: true },
      { id: "demo.slaapkamer", name: "Slaapkamer", on: false }
    ],
    climate: [
      { id: "demo.woonkamer_temp", name: "Woonkamer", value: 20.5, unit: "°C" },
      { id: "demo.slaapkamer_temp", name: "Slaapkamer", value: 18.2, unit: "°C" }
    ],
    devices: [
      { id: "demo.vaatwasser", name: "Vaatwasser", on: false },
      { id: "demo.wasmachine", name: "Wasmachine", on: true }
    ],
    waste: []
  };
}

function friendly(entity, fallback) {
  return entity?.attributes?.friendly_name || fallback;
}

// Zonneplan (built-in integration) is recognised by its sensor names, so no
// entity IDs have to be typed into config.js. An explicit ID in config wins.
const ZONNEPLAN = {
  price: /current electricity price/i,
  nextHourPrice: /next hour electricity price/i,
  tariffGroup: /current electricity tariff/i,
  sustainability: /current sustainability/i,
  usedMonth: /electricity used this month/i,
  returnedMonth: /electricity returned this month/i,
  costMonth: /electricity cost this month/i,
  gasPrice: /gas price/i,
  gasUsedMonth: /gas used this month/i,
  gasCostMonth: /gas cost this month/i
};

// Waste collection (e.g. the Afvalwijzer integration): sensors whose state is
// the next pickup date. Summary sensors ("today", "tomorrow") are skipped.
const WASTE_NAMES = { gft: "GFT", pmd: "PMD", papier: "Papier", restafval: "Restafval", textiel: "Textiel", kerstbomen: "Kerstbomen", glas: "Glas", kca: "Klein chemisch afval" };

function parseDate(value) {
  const text = String(value || "").trim();
  // Timestamps (e.g. "2026-11-16T23:00:00+00:00") are UTC: convert to the local
  // day first, otherwise a pickup on the 17th shows up as the 16th.
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const stamp = new Date(text);
    if (!Number.isNaN(stamp.getTime())) return new Date(stamp.getFullYear(), stamp.getMonth(), stamp.getDate());
  }
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  match = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return null;
}

function mapWaste(states) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return states
    .filter(entity => /^sensor\.[a-z]*afval/i.test(entity.entity_id))
    .filter(entity => !/_(today|tomorrow|day_after_tomorrow|vandaag|morgen|overmorgen|first_next|next|notifications)/i.test(entity.entity_id))
    .map(entity => {
      const date = parseDate(entity.state);
      if (!date || date < today) return null;
      // IDs look like sensor.afvalwijzer_<postcode>_<huisnummer>_gft; the address
      // part is dropped so it never appears on screen.
      const key = entity.entity_id
        .replace(/^sensor\.[a-z]*afval[a-z]*_/i, "")
        .replace(/^\d{4}[a-z]{2}_[^_]+_/i, "")
        .replace(/_/g, "")
        .toLowerCase();
      const name = WASTE_NAMES[key] || friendly(entity, key)
        .replace(/^afvalwijzer\s*/i, "")
        .replace(/^\d{4}\s?[a-z]{2}\s+\S+\s+/i, "");
      return { name, date };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);
}

const TARIFF_NL = { low: "Laag", normal: "Normaal", high: "Hoog", laag: "Laag", normaal: "Normaal", hoog: "Hoog" };

function findByName(states, pattern) {
  return states.find(entity => pattern.test(friendly(entity, entity.entity_id))) || null;
}

function hhmm(date) {
  return new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

// "Electricity price low today/tomorrow" are timestamp sensors (start and end of
// the cheapest block). Today's block is shown until it ends, then tomorrow's.
function cheapestWindow(states) {
  const block = word => {
    const times = states
      .filter(entity => {
        const label = `${friendly(entity, "")} ${entity.entity_id}`;
        return /electricity.?price.?low/i.test(label) && new RegExp(word, "i").test(label);
      })
      .map(entity => new Date(entity.state))
      .filter(date => !Number.isNaN(date.getTime()))
      .sort((a, b) => a - b);
    return times.length >= 2 ? { from: times[0], to: times[times.length - 1] } : null;
  };
  const now = new Date();
  const today = block("today");
  if (today && today.to > now) return { day: "vandaag", from: hhmm(today.from), to: hhmm(today.to) };
  const tomorrow = block("tomorrow");
  if (tomorrow) return { day: "morgen", from: hhmm(tomorrow.from), to: hhmm(tomorrow.to) };
  return null;
}

// Live household power from a P1 meter (Zendure P1, HomeWizard, DSMR, ...) when
// no entity ID is set in config. Only real watt sensors with a number count.
function findGridPower(states) {
  return states.find(entity => {
    const attrs = entity.attributes || {};
    const label = `${entity.entity_id} ${attrs.friendly_name || ""}`;
    return entity.entity_id.startsWith("sensor.")
      && (attrs.unit_of_measurement === "W" || attrs.device_class === "power")
      && /p1|homewizard|dsmr|active.?power|power.?consumption|net.?power|grid/i.test(label)
      && Number.isFinite(Number.parseFloat(entity.state));
  }) || null;
}

function mapStates(states) {
  const byId = new Map(states.map(entity => [entity.entity_id, entity]));
  const value = id => (id && byId.has(id) ? byId.get(id) : null);
  const energy = ha().energy || {};
  const pick = (configId, pattern) => value(configId) || (pattern ? findByName(states, pattern) : null);
  const tariffRaw = String(pick(energy.tariffGroup, ZONNEPLAN.tariffGroup)?.state || "").toLowerCase();

  const toggles = ids => (ids || [])
    .map(id => ({ id, entity: value(id) }))
    .filter(item => item.entity)
    .map(({ id, entity }) => ({ id, name: friendly(entity, id), on: entity.state === "on" }));

  return {
    mode: "live",
    updatedAt: new Date().toISOString(),
    energy: {
      powerW: number((value(energy.power) || findGridPower(states))?.state),
      priceEur: number(pick(energy.price, ZONNEPLAN.price)?.state),
      nextHourPriceEur: number(pick(energy.nextHourPrice, ZONNEPLAN.nextHourPrice)?.state),
      tariffGroup: TARIFF_NL[tariffRaw] || null,
      sustainability: number(pick(null, ZONNEPLAN.sustainability)?.state),
      solarW: number(value(energy.solar)?.state),
      cheapest: cheapestWindow(states),
      month: {
        usedKwh: number(pick(null, ZONNEPLAN.usedMonth)?.state),
        returnedKwh: number(pick(null, ZONNEPLAN.returnedMonth)?.state),
        costEur: number(pick(null, ZONNEPLAN.costMonth)?.state)
      },
      gas: {
        priceEur: number(pick(null, ZONNEPLAN.gasPrice)?.state),
        usedM3: number(pick(null, ZONNEPLAN.gasUsedMonth)?.state),
        costEur: number(pick(null, ZONNEPLAN.gasCostMonth)?.state)
      },
      batteries: (energy.batteries || [])
        .filter(battery => battery.level || battery.power)
        .map(battery => ({
          name: battery.name,
          level: number(value(battery.level)?.state),
          powerW: number(value(battery.power)?.state)
        }))
    },
    lights: toggles(ha().lights),
    climate: (ha().climate || [])
      .map(id => ({ id, entity: value(id) }))
      .filter(item => item.entity)
      .map(({ id, entity }) => ({
        id,
        name: friendly(entity, id),
        value: number(entity.state),
        unit: entity.attributes?.unit_of_measurement || ""
      })),
    devices: toggles(ha().devices),
    waste: mapWaste(states)
  };
}

async function fetchLive() {
  const url = getDeviceSecret("haUrl").replace(/\/+$/, "");
  const token = getDeviceSecret("haToken");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${url}/api/states`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Home Assistant antwoordde ${response.status}`);
    return mapStates(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

export async function refreshHomeData() {
  if (!homeAssistantConfigured()) {
    latest = demoData();
  } else {
    try {
      latest = await fetchLive();
    } catch (error) {
      console.error("[HomeAssistant]", error);
      latest = { ...(latest?.mode === "live" ? latest : demoData()), mode: "error", error: String(error.message || error) };
    }
  }
  window.dispatchEvent(new CustomEvent("homehub:home-data-change", { detail: latest }));
  return latest;
}

export function startHomeData() {
  if (timer) return;
  refreshHomeData();
  const seconds = Math.max(10, Number(ha().refreshSeconds) || 30);
  timer = setInterval(refreshHomeData, seconds * 1000);
  window.addEventListener("homehub:secrets-change", refreshHomeData);
}
