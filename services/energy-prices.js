// Hourly electricity prices for today and tomorrow.
// Zonneplan (in Home Assistant) only exposes the current, next-hour, lowest and
// highest price, not the full day. The day-ahead market prices come from the
// public EnergyZero API and are converted to the Zonneplan all-in price:
//   all-in = (market price excl. VAT + surcharge) × 1.21
// The surcharge (energy tax + Zonneplan margin) is recalculated from the live
// Zonneplan price every time, so tax changes are picked up automatically.

const VAT = 1.21;
const DEFAULT_SURCHARGE = 0.108; // used until a live Zonneplan price is known
const REFRESH_MS = 30 * 60 * 1000;

let market = [];           // [{ start: Date, price: number }] excl. VAT
let timer = null;

function localMidnight(offsetDays) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

async function loadMarket() {
  const url = new URL("https://api.energyzero.nl/v1/energyprices");
  url.search = new URLSearchParams({
    fromDate: localMidnight(0).toISOString(),
    tillDate: new Date(localMidnight(2).getTime() - 1).toISOString(),
    interval: "4",
    usageType: "1",
    inclBtw: "false"
  });
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`EnergyZero ${response.status}`);
    const data = await response.json();
    market = (data.Prices || [])
      .map(item => ({ start: new Date(item.readingDate), price: Number(item.price) }))
      .filter(item => Number.isFinite(item.price) && !Number.isNaN(item.start.getTime()))
      .sort((a, b) => a.start - b.start);
    window.dispatchEvent(new CustomEvent("homehub:prices-change"));
  } catch (error) {
    console.warn("[HomeOS] Uurprijzen niet beschikbaar", error);
  }
}

function hourStart(date) {
  const copy = new Date(date);
  copy.setMinutes(0, 0, 0);
  return copy;
}

// Returns { hours: [{ start, price, level, past, now }], todayRange, tomorrowRange, current }
// or null when no prices are loaded. `livePrice` is the current Zonneplan price.
export function getPriceCurve(livePrice) {
  if (!market.length) return null;
  const now = new Date();
  const thisHour = hourStart(now).getTime();
  const currentMarket = market.find(item => item.start.getTime() === thisHour);
  const surcharge = Number.isFinite(livePrice) && currentMarket
    ? livePrice / VAT - currentMarket.price
    : DEFAULT_SURCHARGE;

  const hours = market.map(item => ({
    start: item.start,
    price: (item.price + surcharge) * VAT,
    past: item.start.getTime() < thisHour,
    now: item.start.getTime() === thisHour
  }));

  // Cheap / expensive is judged against what is still ahead (now → end of data),
  // because that is what you can still plan with.
  const ahead = hours.filter(hour => !hour.past).map(hour => hour.price).sort((a, b) => a - b);
  const low = ahead[Math.floor((ahead.length - 1) / 3)];
  const high = ahead[Math.ceil(((ahead.length - 1) * 2) / 3)];
  const spread = ahead.length ? ahead[ahead.length - 1] - ahead[0] : 0;
  for (const hour of hours) {
    hour.level = spread < 0.03 ? "normal" : hour.price <= low ? "low" : hour.price >= high ? "high" : "normal";
  }

  const range = list => list.length
    ? { min: Math.min(...list.map(h => h.price)), max: Math.max(...list.map(h => h.price)) }
    : null;
  const tomorrowStart = localMidnight(1).getTime();
  return {
    hours,
    todayRange: range(hours.filter(h => h.start.getTime() < tomorrowStart)),
    tomorrowRange: range(hours.filter(h => h.start.getTime() >= tomorrowStart)),
    current: hours.find(hour => hour.now) || null
  };
}

// Cheapest upcoming block of `length` consecutive hours (from the current hour
// on), as { day: "vandaag" | "morgen", from: "HH:MM", to: "HH:MM" } or null.
// Used when Zonneplan's own "price low" block has already passed today and
// tomorrow's is not published yet.
export function cheapestUpcoming(livePrice, length = 2) {
  const curve = getPriceCurve(livePrice);
  if (!curve) return null;
  const ahead = curve.hours.filter(hour => !hour.past);
  let best = null;
  for (let index = 0; index + length <= ahead.length; index += 1) {
    const block = ahead.slice(index, index + length);
    const contiguous = block.every((hour, offset) => offset === 0
      || hour.start.getTime() - block[offset - 1].start.getTime() === 3600000);
    if (!contiguous) continue;
    const average = block.reduce((sum, hour) => sum + hour.price, 0) / length;
    if (!best || average < best.average) best = { average, start: block[0].start };
  }
  if (!best) return null;
  const hhmm = date => new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  const end = new Date(best.start.getTime() + length * 3600000);
  const day = best.start.getTime() >= localMidnight(1).getTime() ? "morgen" : "vandaag";
  return { day, from: hhmm(best.start), to: hhmm(end) };
}

// Short advice for the banner on Home: cheap now / expensive now / nothing.
export function priceAdvice(curve) {
  if (!curve?.current) return null;
  const index = curve.hours.indexOf(curve.current);
  const level = curve.current.level;
  if (level === "normal") return null;
  if (level === "low") {
    let end = index;
    while (curve.hours[end + 1]?.level === "low") end += 1;
    const until = new Date(curve.hours[end].start.getTime() + 3600000);
    return { level, until };
  }
  const nextLow = curve.hours.slice(index + 1).find(hour => hour.level === "low");
  return { level, from: nextLow ? nextLow.start : null };
}

export function startEnergyPrices() {
  if (timer) return;
  loadMarket();
  timer = setInterval(loadMarket, REFRESH_MS);
  // Re-classify on the hour so "now" moves along without waiting for a reload.
  setInterval(() => window.dispatchEvent(new CustomEvent("homehub:prices-change")), 5 * 60 * 1000);
}
