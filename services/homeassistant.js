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
        { name: "Solarbank 1", level: 78, powerW: -350 },
        { name: "Solarbank 2", level: 74, powerW: -330 }
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
    rooms: [
      { name: "Woonkamer", lightsOn: 2, lights: 3, temperature: 20.5 },
      { name: "Keuken", lightsOn: 1, lights: 2, temperature: 19.8 },
      { name: "Slaapkamer", lightsOn: 0, lights: 2, temperature: 18.2 }
    ],
    cameras: [],
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

const isWatt = entity => entity.entity_id.startsWith("sensor.")
  && (entity.attributes?.unit_of_measurement === "W" || entity.attributes?.device_class === "power")
  && Number.isFinite(Number.parseFloat(entity.state));
const labelOf = entity => `${entity.entity_id} ${entity.attributes?.friendly_name || ""}`;

// Live household power (+ = afname, - = teruglevering) when no entity ID is set:
// 1. Anker Smart Meter (Anker Solix integration): grid import minus grid export.
// 2. Any other P1 meter (HomeWizard, DSMR, ...) with a signed watt sensor.
function findGridPower(states) {
  const watts = states.filter(isWatt);
  const anker = watts.filter(entity => /solarbank|solix|anker|smart.?meter/i.test(labelOf(entity)));
  const imported = anker.find(entity => /grid.?to.?home|grid.?import|import.?power/i.test(labelOf(entity)));
  if (imported) {
    const exported = anker.find(entity => /grid.?export|export.?power|(pv|solar|photovoltaic).?to.?grid/i.test(labelOf(entity)));
    return number(imported.state) - (exported ? number(exported.state) || 0 : 0);
  }
  const p1 = watts.find(entity => {
    const text = labelOf(entity);
    return /p1|homewizard|dsmr|active.?power|power.?consumption|net.?power|grid/i.test(text)
      && !/solarbank|solix|batter|to.?grid|grid.?to/i.test(text);
  });
  return p1 ? number(p1.state) : null;
}

// Anker Solarbanks when config.energy.batteries is empty: one entry per device
// with a state-of-charge sensor, plus its battery/charging power sensor (same
// entity ID prefix). Anker "charging power" is + while charging, so it is
// flipped to the dashboard convention (- = laden, + = levert).
function findBatteries(states) {
  const socs = states.filter(entity => entity.entity_id.startsWith("sensor.")
    && /solarbank|solix/i.test(labelOf(entity))
    && /state.?of.?charge|_soc\b|battery.?level/i.test(labelOf(entity))
    && (entity.attributes?.unit_of_measurement === "%" || entity.attributes?.device_class === "battery")
    && Number.isFinite(Number.parseFloat(entity.state)));
  // Prefer the individual devices over the system total when both exist.
  const devices = socs.filter(entity => !/system/i.test(entity.entity_id));
  return (devices.length ? devices : socs).map(entity => {
    const prefix = entity.entity_id.replace(/_(state_of_charge|soc|battery_level).*$/i, "");
    // Same device only: "<prefix>_charging_power", not "<prefix>_2_charging_power".
    const own = pattern => states.find(other => isWatt(other)
      && other.entity_id.startsWith(prefix) && pattern.test(other.entity_id.slice(prefix.length)));
    const power = own(/^_battery_?power/i) || own(/^_charging_?power/i);
    const watts = power ? number(power.state) : null;
    const name = String(entity.attributes?.friendly_name || entity.entity_id)
      .replace(/\s*(state of charge|soc|battery level)\s*$/i, "").trim();
    return {
      name: name || "Solarbank",
      level: number(entity.state),
      powerW: watts === null ? null : (/charging/i.test(power.entity_id) ? -watts : watts)
    };
  }).sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

// Automatic discovery for the Smart Home lists. Unavailable entities and
// anything matching config.homeAssistant.exclude (text or regex) are skipped.
function discover(states, test) {
  const exclude = (ha().exclude || []).map(item => item instanceof RegExp ? item : new RegExp(String(item), "i"));
  return states
    .filter(entity => !["unavailable", "unknown"].includes(entity.state))
    .filter(test)
    .filter(entity => !exclude.some(pattern => pattern.test(`${entity.entity_id} ${friendly(entity, "")}`)))
    .sort((a, b) => friendly(a, a.entity_id).localeCompare(friendly(b, b.entity_id), "nl"))
    .map(entity => entity.entity_id);
}

// Cameras (e.g. Ring). Order: config.homeAssistant.cameras if set, otherwise
// the front door / doorbell first. config exclude words hide a camera.
function mapCameras(states) {
  const exclude = (ha().exclude || []).map(item => new RegExp(String(item), "i"));
  const order = Array.isArray(ha().cameras) ? ha().cameras : [];
  const rank = entity => {
    const index = order.indexOf(entity.entity_id);
    if (index >= 0) return index;
    return /voordeur|deurbel|doorbell|front/i.test(`${entity.entity_id} ${friendly(entity, "")}`) ? 100 : 200;
  };
  return states
    .filter(entity => entity.entity_id.startsWith("camera.") && entity.state !== "unavailable" && entity.attributes?.entity_picture)
    .filter(entity => !order.length || order.includes(entity.entity_id))
    .filter(entity => !exclude.some(pattern => pattern.test(`${entity.entity_id} ${friendly(entity, "")}`)))
    .sort((a, b) => rank(a) - rank(b) || friendly(a, a.entity_id).localeCompare(friendly(b, b.entity_id), "nl"))
    .map(entity => ({ id: entity.entity_id, name: friendly(entity, entity.entity_id), picture: entity.attributes.entity_picture }));
}

// Rooms: Home Assistant areas with their lights and a temperature.
function mapRooms(states, areas, byId) {
  const exclude = (ha().exclude || []).map(item => new RegExp(String(item), "i"));
  const usable = id => {
    const entity = byId.get(id);
    return entity && !["unavailable", "unknown"].includes(entity.state)
      && !exclude.some(pattern => pattern.test(`${id} ${friendly(entity, "")}`));
  };
  return (areas || []).map(area => {
    const ids = (area.entities || []).filter(usable);
    const lights = ids.filter(id => id.startsWith("light."));
    const tempId = ids.find(id => id.startsWith("climate."))
      || ids.find(id => byId.get(id).attributes?.device_class === "temperature" && Number.isFinite(Number.parseFloat(byId.get(id).state)));
    const tempEntity = tempId ? byId.get(tempId) : null;
    return {
      name: area.name,
      lightsOn: lights.filter(id => byId.get(id).state === "on").length,
      lights: lights.length,
      temperature: tempEntity ? number(tempId.startsWith("climate.") ? tempEntity.attributes?.current_temperature : tempEntity.state) : null
    };
  }).filter(room => room.lights || Number.isFinite(room.temperature));
}

function mapStates(states, areas = []) {
  const byId = new Map(states.map(entity => [entity.entity_id, entity]));
  const value = id => (id && byId.has(id) ? byId.get(id) : null);
  const energy = ha().energy || {};
  const pick = (configId, pattern) => value(configId) || (pattern ? findByName(states, pattern) : null);
  const tariffRaw = String(pick(energy.tariffGroup, ZONNEPLAN.tariffGroup)?.state || "").toLowerCase();

  const toggles = ids => ids
    .map(id => ({ id, entity: value(id) }))
    .filter(item => item.entity)
    .map(({ id, entity }) => ({ id, name: friendly(entity, id), on: entity.state === "on" }));

  // Empty lists in config.js mean "show everything Home Assistant has".
  const configured = list => Array.isArray(list) && list.length ? list : null;
  const lightIds = configured(ha().lights) || discover(states, entity => entity.entity_id.startsWith("light."));
  const deviceIds = configured(ha().devices) || discover(states, entity => /^(switch|fan)\./.test(entity.entity_id));
  const climateIds = configured(ha().climate) || discover(states, entity =>
    entity.entity_id.startsWith("climate.")
    || (entity.entity_id.startsWith("sensor.")
      && entity.attributes?.device_class === "temperature"
      && Number.isFinite(Number.parseFloat(entity.state))));

  return {
    mode: "live",
    updatedAt: new Date().toISOString(),
    energy: {
      powerW: value(energy.power) ? number(value(energy.power).state) : findGridPower(states),
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
      batteries: configured(energy.batteries)
        ? energy.batteries
          .filter(battery => battery.level || battery.power)
          .map(battery => {
            const watts = number(value(battery.power)?.state);
            return {
              name: battery.name,
              level: number(value(battery.level)?.state),
              powerW: watts === null ? null : (battery.invert ? -watts : watts)
            };
          })
        : findBatteries(states)
    },
    lights: toggles(lightIds),
    climate: climateIds
      .map(id => ({ id, entity: value(id) }))
      .filter(item => item.entity)
      .map(({ id, entity }) => {
        const isClimate = id.startsWith("climate.");
        return {
          id,
          name: friendly(entity, id),
          value: number(isClimate ? entity.attributes?.current_temperature : entity.state),
          unit: isClimate ? "°C" : entity.attributes?.unit_of_measurement || ""
        };
      }),
    devices: toggles(deviceIds),
    rooms: mapRooms(states, areas, byId),
    cameras: mapCameras(states),
    waste: mapWaste(states)
  };
}

// Base URL for images served by Home Assistant (camera snapshots).
export function homeAssistantUrl() {
  return getDeviceSecret("haUrl").replace(/\/+$/, "");
}

// Areas (rooms) are not part of /api/states; a template lists them with their
// entities. Refreshed every 5 minutes; failures just mean "no rooms".
const AREA_TEMPLATE = '[{% for a in areas() %}{"name": {{ area_name(a) | tojson }}, "entities": {{ area_entities(a) | tojson }}}{{ "," if not loop.last }}{% endfor %}]';
let areaCache = { at: 0, list: [] };

async function fetchAreas(url, token) {
  if (Date.now() - areaCache.at < 5 * 60000) return areaCache.list;
  let list = areaCache.list;
  try {
    const response = await fetch(`${url}/api/template`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ template: AREA_TEMPLATE })
    });
    if (response.ok) list = JSON.parse(await response.text());
  } catch (error) {
    console.warn("[HomeAssistant] areas", error);
  }
  areaCache = { at: Date.now(), list };
  return list;
}

async function fetchLive() {
  const url = homeAssistantUrl();
  const token = getDeviceSecret("haToken");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${url}/api/states`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Home Assistant antwoordde ${response.status}`);
    const states = await response.json();
    return mapStates(states, await fetchAreas(url, token));
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
