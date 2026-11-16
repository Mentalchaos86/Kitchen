// Current weather + 5-day forecast (Open-Meteo, no key) for the Home screen.
// Uses the location from config.weather; refreshes every 30 minutes.
import { config } from "../core/config.js";

const REFRESH_MS = 30 * 60 * 1000;
let latest = null;
let timer = null;

export function getForecast() {
  return latest;
}

// WMO weather codes -> Dutch label + emoji.
export function weatherLabel(code) {
  if (code === 0) return ["Helder", "☀️"];
  if (code === 1) return ["Overwegend helder", "🌤️"];
  if (code === 2) return ["Half bewolkt", "⛅"];
  if (code === 3) return ["Bewolkt", "☁️"];
  if (code === 45 || code === 48) return ["Mist", "🌫️"];
  if (code >= 51 && code <= 57) return ["Motregen", "🌦️"];
  if (code >= 61 && code <= 67) return ["Regen", "🌧️"];
  if (code >= 71 && code <= 77) return ["Sneeuw", "🌨️"];
  if (code >= 80 && code <= 82) return ["Buien", "🌦️"];
  if (code >= 85 && code <= 86) return ["Sneeuwbuien", "🌨️"];
  if (code >= 95) return ["Onweer", "⛈️"];
  return ["Onbekend", "🌡️"];
}

async function refresh() {
  const weather = config.weather || {};
  if (!Number.isFinite(Number(weather.latitude)) || !Number.isFinite(Number(weather.longitude))) return;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: weather.latitude,
    longitude: weather.longitude,
    current: "temperature_2m,weather_code,apparent_temperature,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: weather.timezone || "auto",
    forecast_days: "5"
  });
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
    const data = await response.json();
    latest = {
      temperature: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      wind: data.current.wind_speed_10m,
      code: data.current.weather_code,
      days: data.daily.time.map((day, index) => ({
        date: new Date(`${day}T12:00:00`),
        code: data.daily.weather_code[index],
        max: data.daily.temperature_2m_max[index],
        min: data.daily.temperature_2m_min[index],
        rain: data.daily.precipitation_probability_max[index]
      }))
    };
    window.dispatchEvent(new CustomEvent("homehub:forecast-change", { detail: latest }));
  } catch (error) {
    console.warn("[Forecast]", error);
  }
}

export function startForecast() {
  if (timer) return;
  refresh();
  timer = setInterval(refresh, REFRESH_MS);
}
