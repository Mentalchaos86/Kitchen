// Rain in the next two hours from Buienradar (radar nowcast, 5-minute steps).
// Only the location from config.weather is sent; no account or key is needed.
import { config } from "../core/config.js";

const REFRESH_MS = 5 * 60 * 1000;
const RAIN_MM = 0.1; // mm/h, below this counts as dry

let latest = null;
let timer = null;

export function getRain() {
  return latest;
}

// Buienradar gives "value|HH:MM" per line; mm/h = 10^((value - 109) / 32).
function parse(text) {
  const now = new Date();
  return text.trim().split(/\r?\n/).map(line => {
    const [raw, time] = line.split("|");
    const value = Number(raw);
    const [hours, minutes] = String(time || "").split(":").map(Number);
    if (!Number.isFinite(value) || !Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    const at = new Date(now);
    at.setHours(hours, minutes, 0, 0);
    // Times after midnight belong to tomorrow.
    if (at.getTime() < now.getTime() - 3 * 3600000) at.setDate(at.getDate() + 1);
    return { at, mm: value > 0 ? Math.pow(10, (value - 109) / 32) : 0 };
  }).filter(Boolean);
}

function summarize(steps) {
  const now = Date.now();
  const ahead = steps.filter(step => step.at.getTime() >= now - 5 * 60000);
  if (!ahead.length) return null;
  const wet = step => step.mm >= RAIN_MM;
  const rainingNow = wet(ahead[0]);
  if (rainingNow) {
    const dry = ahead.find(step => !wet(step));
    return { state: "raining", until: dry ? dry.at : null };
  }
  const start = ahead.find(wet);
  if (!start) return { state: "dry" };
  return { state: "coming", from: start.at, minutes: Math.max(0, Math.round((start.at.getTime() - now) / 60000)) };
}

async function loadRain() {
  const weather = config.weather || {};
  if (!Number.isFinite(Number(weather.latitude)) || !Number.isFinite(Number(weather.longitude))) return;
  const url = `https://gpsgadget.buienradar.nl/data/raintext?lat=${Number(weather.latitude).toFixed(2)}&lon=${Number(weather.longitude).toFixed(2)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Buienradar ${response.status}`);
    latest = summarize(parse(await response.text()));
  } catch (error) {
    console.warn("[HomeOS] Buienradar niet beschikbaar", error);
    latest = null;
  }
  window.dispatchEvent(new CustomEvent("homehub:rain-change", { detail: latest }));
}

export function startRain() {
  if (timer) return;
  loadRain();
  timer = setInterval(loadRain, REFRESH_MS);
}
