import { config } from "../core/config.js";
import { $ } from "../core/dom.js";
import { markUpdated } from "../core/status.js";
import { getIntelligenceContext } from "../core/context.js";

const weatherCodes = {
  0:["Clear","☀️"],1:["Mostly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Cloudy","☁️"],
  45:["Fog","🌫️"],48:["Fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],
  55:["Heavy drizzle","🌧️"],61:["Light rain","🌦️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],
  71:["Light snow","🌨️"],73:["Snow","❄️"],75:["Heavy snow","❄️"],
  80:["Rain showers","🌦️"],81:["Showers","🌧️"],82:["Heavy showers","⛈️"],
  95:["Thunderstorm","⛈️"],96:["Thunderstorm","⛈️"],99:["Thunderstorm","⛈️"]
};

const weatherText = code => weatherCodes[code] || ["Weather","🌡️"];

export async function loadWeather() {
  const intelligentLocation = getIntelligenceContext().weather;
  const weather = intelligentLocation
    ? {
        latitude: intelligentLocation.latitude,
        longitude: intelligentLocation.longitude,
        locationName: intelligentLocation.city,
        timezone: intelligentLocation.timezone
      }
    : config.weather;

  $("weatherLocation").textContent =
    (weather.locationName || "Local").toUpperCase();

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: weather.latitude,
    longitude: weather.longitude,
    current:
      "temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,precipitation,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
    timezone: weather.timezone || "auto",
    forecast_days: "3"
  });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather unavailable");

    const data = await response.json();
    const [label, icon] = weatherText(data.current.weather_code);

    $("weatherNow").innerHTML = `
      <div class="weather-temp">${Math.round(data.current.temperature_2m)}°</div>
      <div class="weather-copy">${icon} ${label}<br>
      Feels like ${Math.round(data.current.apparent_temperature)}°</div>`;

    const timeFormatter = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    $("weatherDetails").innerHTML = `
      <div class="weather-detail-heading">
        <span class="weather-detail-icon">${icon}</span>
        <div>
          <div class="weather-detail-main">${label}</div>
          <div class="weather-detail-sub">
            Feels like ${Math.round(data.current.apparent_temperature)}°
          </div>
        </div>
      </div>
      <div class="weather-metrics">
        <span>💧 ${Math.round(data.current.relative_humidity_2m)}%</span>
        <span>🌧 ${Math.round(data.daily.precipitation_probability_max[0] || 0)}%</span>
        <span>💨 ${Math.round(data.current.wind_speed_10m)} km/h</span>
        <span>☀ ${timeFormatter.format(new Date(data.daily.sunrise[0]))}</span>
        <span>🌙 ${timeFormatter.format(new Date(data.daily.sunset[0]))}</span>
      </div>`;

    $("forecast").innerHTML = data.daily.time.map((day, index) => {
      const dayName = new Intl.DateTimeFormat("en-GB", {
        weekday: "short"
      }).format(new Date(`${day}T12:00:00`));
      const [description, dayIcon] =
        weatherText(data.daily.weather_code[index]);

      return `
        <div class="forecast-day" title="${description}">
          <strong>${dayName}</strong>
          <div class="forecast-icon">${dayIcon}</div>
          <div class="forecast-temp">
            ${Math.round(data.daily.temperature_2m_max[index])}°
            <span class="forecast-min">
              ${Math.round(data.daily.temperature_2m_min[index])}°
            </span>
          </div>
          <div class="forecast-rain">
            🌧 ${Math.round(data.daily.precipitation_probability_max[index] || 0)}%
          </div>
        </div>`;
    }).join("");

    markUpdated();
  } catch (error) {
    $("weatherNow").innerHTML =
      `<div class="weather-copy">Weather unavailable</div>`;
    $("weatherDetails").innerHTML =
      `<div class="empty-state">Weather unavailable.</div>`;
    $("forecast").innerHTML = "";
    console.error("[Weather]", error);
  }
}

export function initWeather() {
  loadWeather();
  window.addEventListener("homehub:intelligence-change", loadWeather);
  setInterval(
    loadWeather,
    Math.max(5, config.refreshMinutes || 15) * 60000
  );
}
