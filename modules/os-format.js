// Dutch formatting helpers for Home OS.
const nl = "nl-NL";

export function kw(watts) {
  if (watts === null || watts === undefined || !Number.isFinite(watts)) return "— kW";
  return `${(watts / 1000).toLocaleString(nl, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW`;
}

export function euroPerKwh(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `€ ${value.toLocaleString(nl, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kWh`;
}

export function decimal(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString(nl, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function timeNl(date) {
  return new Intl.DateTimeFormat(nl, { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

export function dayTitle(date) {
  const text = new Intl.DateTimeFormat(nl, { weekday: "long", day: "numeric", month: "short" })
    .format(date)
    .replace(".", "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function longDate(date) {
  const text = new Intl.DateTimeFormat(nl, { weekday: "long", day: "numeric", month: "long" }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function batteryState(powerW) {
  if (!Number.isFinite(powerW) || Math.abs(powerW) < 20) return "rust";
  // Convention: negative = charging, positive = discharging (adjust per integration).
  return powerW < 0 ? "laadt" : "levert";
}

export function euro(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `€ ${value.toLocaleString(nl, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

// "Vandaag", "Morgen", "Overmorgen" or "Di 18 nov".
export function dayLabel(date) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target - start) / 86400000);
  if (days === 0) return "Vandaag";
  if (days === 1) return "Morgen";
  if (days === 2) return "Overmorgen";
  const text = new Intl.DateTimeFormat(nl, { weekday: "short", day: "numeric", month: "short" }).format(target).replace(/\./g, "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function count(value, singular, plural) {
  return `${value} ${value === 1 ? singular : plural}`;
}
