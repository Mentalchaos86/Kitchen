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
      cheapest: { from: "13:00", to: "15:00" },
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
    ]
  };
}

function friendly(entity, fallback) {
  return entity?.attributes?.friendly_name || fallback;
}

function mapStates(states) {
  const byId = new Map(states.map(entity => [entity.entity_id, entity]));
  const value = id => (id && byId.has(id) ? byId.get(id) : null);
  const energy = ha().energy || {};

  const toggles = ids => (ids || [])
    .map(id => ({ id, entity: value(id) }))
    .filter(item => item.entity)
    .map(({ id, entity }) => ({ id, name: friendly(entity, id), on: entity.state === "on" }));

  return {
    mode: "live",
    updatedAt: new Date().toISOString(),
    energy: {
      powerW: number(value(energy.power)?.state),
      priceEur: number(value(energy.price)?.state),
      solarW: number(value(energy.solar)?.state),
      cheapest: null,
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
    devices: toggles(ha().devices)
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
