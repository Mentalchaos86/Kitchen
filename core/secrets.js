// Device-only secrets (calendar access key, Home Assistant URL and token).
// They live in this browser/TV's localStorage and are never part of the
// repository or the public config.js.

const KEY = "homehub-device-secrets-v1";
const ALLOWED = ["calendarKey", "haUrl", "haToken"];

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

export function getDeviceSecret(name) {
  if (!ALLOWED.includes(name)) return "";
  const value = readAll()[name];
  return typeof value === "string" ? value : "";
}

export function setDeviceSecret(name, value) {
  if (!ALLOWED.includes(name)) return;
  const all = readAll();
  const clean = String(value || "").trim();
  if (clean) all[name] = clean;
  else delete all[name];
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
  window.dispatchEvent(new CustomEvent("homehub:secrets-change", { detail: { name } }));
}
