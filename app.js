(() => {
  const cfg = window.DASHBOARD_CONFIG;
  const $ = id => document.getElementById(id);
  const euro = new Intl.NumberFormat("nl-NL", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0
  });

  function escapeHtml(v = "") {
    return String(v).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function showToast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => el.classList.remove("show"), 2100);
  }

  function updateClock() {
    const now = new Date();
    $("time").textContent = new Intl.DateTimeFormat("en-GB", {
      hour:"2-digit", minute:"2-digit", hour12:false
    }).format(now);
    $("date").textContent = new Intl.DateTimeFormat("en-GB", {
      weekday:"long", day:"numeric", month:"long"
    }).format(now);
  }


  function updateDisplayMode() {
    const hour = new Date().getHours();
    const isNight = hour < 7 || hour >= 20;
    document.body.classList.toggle("night-mode", isNight);
    document.body.classList.toggle("day-mode", !isNight);
  }



  const sceneStorageKey = "homehub-scene-choice-v1";
  let lastDataRefresh = null;

  function automaticScene() {
    const hour = new Date().getHours();
    const scenes = cfg.scenes || {};
    const morning = scenes.autoMorningStart ?? 5;
    const work = scenes.autoWorkStart ?? 11;
    const evening = scenes.autoEveningStart ?? 17;
    const night = scenes.autoNightStart ?? 23;

    if (hour >= morning && hour < work) return "morning";
    if (hour >= work && hour < evening) return "work";
    if (hour >= evening && hour < night) return "evening";
    return "evening";
  }

  function storedSceneChoice() {
    return localStorage.getItem(sceneStorageKey) || cfg.scenes?.default || "auto";
  }

  function applyScene(choice, persist = false) {
    const valid = ["auto", "morning", "work", "evening", "vacation"];
    const selected = valid.includes(choice) ? choice : "auto";
    const active = selected === "auto" ? automaticScene() : selected;

    document.body.dataset.scene = active;
    document.body.dataset.sceneChoice = selected;

    document.querySelectorAll("[data-scene-choice]").forEach(button => {
      button.classList.toggle("active", button.dataset.sceneChoice === selected);
    });

    const labels = {
      morning: "MORNING SCENE",
      work: "WORK SCENE",
      evening: "EVENING SCENE",
      vacation: "VACATION SCENE"
    };
    $("activeSceneLabel").textContent =
      selected === "auto" ? `AUTO · ${labels[active]}` : labels[active];

    if (persist) localStorage.setItem(sceneStorageKey, selected);
  }

  function setupScenes() {
    document.querySelectorAll("[data-scene-choice]").forEach(button => {
      button.addEventListener("click", () => {
        applyScene(button.dataset.sceneChoice, true);
      });
    });
    applyScene(storedSceneChoice());
  }

  function markUpdated() {
    lastDataRefresh = new Date();
    $("lastUpdated").textContent = `Updated ${new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(lastDataRefresh)}`;
  }

  function stripHtml(value = "") {
    const element = document.createElement("div");
    element.innerHTML = value;
    return (element.textContent || element.innerText || "").replace(/\s+/g, " ").trim();
  }

  function loadJsonp(url, params = {}, timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      const callbackName = `homeHubAgenda_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const script = document.createElement("script");
      const separator = url.includes("?") ? "&" : "?";
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Agenda request timed out"));
      }, timeoutMs);

      function cleanup() {
        clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      }

      window[callbackName] = data => {
        cleanup();
        resolve(data);
      };

      script.onerror = () => {
        cleanup();
        reject(new Error("Agenda script could not load"));
      };

      const query = new URLSearchParams({
        callback: callbackName,
        days: String(cfg.agenda?.lookAheadDays || 45),
        ...params
      });
      script.src = `${url}${separator}${query.toString()}`;
      document.head.appendChild(script);
    });
  }

  function agendaTime(event) {
    if (event.allDay) return "ALL DAY";
    const start = new Date(event.start);
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(start);
  }

  function nextEventWhen(event) {
    const start = new Date(event.start);
    const today = new Date();
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const days = Math.round((startDay - todayDay) / 86400000);

    let dayText;
    if (days === 0) dayText = "Today";
    else if (days === 1) dayText = "Tomorrow";
    else dayText = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short"
    }).format(start);

    return event.allDay ? `${dayText} · All day` : `${dayText} · ${agendaTime(event)}`;
  }

  function renderTodayAgenda(data) {
    const root = $("todayAgenda");
    const todayEvents = (data.today || []).slice(0, cfg.agenda?.maxTodayEvents || 5);
    const nextEvent = data.next || null;

    let content = "";

    if (todayEvents.length) {
      content += `<div class="today-summary">${todayEvents.length} event${todayEvents.length === 1 ? "" : "s"} today</div>`;
      content += `<div class="today-events">`;
      content += todayEvents.map(event => `
        <div class="today-event" style="--event-color: ${escapeHtml(event.color || "#ff7a00")}">
          <div class="today-event-accent"></div>
          <div class="today-event-time">${agendaTime(event)}</div>
          <div class="today-event-copy">
            <div class="today-event-title">${escapeHtml(event.title || "Untitled event")}</div>
            ${event.location ? `<div class="today-event-location">📍 ${escapeHtml(event.location)}</div>` : ""}
          </div>
        </div>
      `).join("");
      content += `</div>`;
    } else {
      content += `
        <div class="today-empty">
          <div>
            <div class="today-empty-icon">✓</div>
            <div class="today-empty-title">No events today</div>
            <div class="today-empty-copy">Your calendar is clear.</div>
          </div>
        </div>`;
    }

    if (nextEvent) {
      content += `
        <div class="next-agenda-event" style="--event-color: ${escapeHtml(nextEvent.color || "#ff7a00")}">
          <div class="next-agenda-label">NEXT</div>
          <div class="next-agenda-title">${escapeHtml(nextEvent.title || "Untitled event")}</div>
          <div class="next-agenda-time">${nextEventWhen(nextEvent)}</div>
        </div>`;
    }

    root.innerHTML = content;
    $("todayStatus").textContent = "LIVE";
    markUpdated();
  }

  async function loadTodayAgenda() {
    if (!cfg.agendaApiUrl) {
      $("todayAgenda").innerHTML = `
        <div class="empty-state">
          Connect the Google Apps Script URL in <strong>config.js</strong>.
        </div>`;
      $("todayStatus").textContent = "SETUP";
      return;
    }

    try {
      const data = await loadJsonp(cfg.agendaApiUrl, {});
      if (!data || data.ok === false) throw new Error(data?.error || "Agenda unavailable");
      renderTodayAgenda(data);
    } catch (error) {
      $("todayAgenda").innerHTML = `
        <div class="empty-state">
          Today’s agenda could not load.<br>Check the Apps Script deployment.
        </div>`;
      $("todayStatus").textContent = "OFFLINE";
      console.error(error);
    }
  }

  function setupBrand() {
    $("dashboardTitle").textContent = cfg.title || "HOME HUB";
    $("dashboardSubtitle").textContent = cfg.subtitle || "";
    document.title = cfg.title || "Home Hub";
  }

  function updateCountdown() {
    const events = (cfg.events || [])
      .map(event => ({
        ...event,
        start: new Date(event.startDate),
        end: new Date(event.endDate || event.startDate)
      }))
      .filter(event =>
        !Number.isNaN(event.start.getTime()) &&
        !Number.isNaN(event.end.getTime())
      )
      .sort((a, b) => a.start - b.start);

    const now = new Date();
    const activeEvent = events.find(event => now >= event.start && now <= event.end);
    const nextEvent = events.find(event => event.start > now);
    const event = activeEvent || nextEvent;

    if (!event) {
      $("countdownIcon").textContent = "✓";
      $("countdownLabel").textContent = "EVENTS";
      $("countdownValue").textContent = "ALL DONE";
      return;
    }

    $("countdownIcon").textContent = event.icon || "📅";
    $("countdownLabel").textContent = event.label || "NEXT EVENT";

    if (activeEvent) {
      const remainingDays = Math.ceil((event.end - now) / 86400000);
      if (remainingDays <= 1) {
        $("countdownValue").textContent = "HAPPENING NOW";
      } else {
        $("countdownValue").textContent = `NOW · ${remainingDays} DAYS LEFT`;
      }
      return;
    }

    const diff = event.start - now;
    const days = Math.ceil(diff / 86400000);

    if (days <= 1) {
      const hours = Math.max(1, Math.ceil(diff / 3600000));
      $("countdownValue").textContent = `IN ${hours} HOUR${hours === 1 ? "" : "S"}`;
    } else {
      $("countdownValue").textContent = `IN ${days} DAYS`;
    }
  }

  let calendarCursor = new Date();
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
  let calendarRequestToken = 0;

  function localDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function eventDateKeys(event) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const keys = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const finalDate = event.allDay
      ? new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1)
      : new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (cursor <= finalDate && keys.length < 40) {
      keys.push(localDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return keys;
  }

  function monthRange(cursor) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const mondayIndex = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - mondayIndex);
    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridStart.getDate() + 41);
    gridEnd.setHours(23, 59, 59, 999);
    return { monthStart, monthEnd, gridStart, gridEnd };
  }

  function calendarEventTime(event) {
    if (event.allDay) return "";
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date(event.start));
  }

  function renderCustomCalendar(events) {
    const { gridStart } = monthRange(calendarCursor);
    const todayKey = localDateKey(new Date());
    const currentMonth = calendarCursor.getMonth();
    const byDay = new Map();

    for (const event of events || []) {
      for (const key of eventDateKeys(event)) {
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key).push(event);
      }
    }

    for (const dayEvents of byDay.values()) {
      dayEvents.sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return new Date(a.start) - new Date(b.start);
      });
    }

    $("calendarMonthLabel").textContent = new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric"
    }).format(calendarCursor);

    const cells = [];
    for (let index = 0; index < 42; index++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const key = localDateKey(date);
      const dayEvents = byDay.get(key) || [];
      const visibleEvents = dayEvents.slice(0, cfg.calendar?.maxEventsPerDay || 3);
      const overflow = dayEvents.length - visibleEvents.length;
      const classes = [
        "calendar-day",
        date.getMonth() !== currentMonth ? "outside-month" : "",
        key === todayKey ? "is-today" : ""
      ].filter(Boolean).join(" ");

      cells.push(`
        <div class="${classes}">
          <div class="calendar-day-number">${date.getDate()}</div>
          <div class="calendar-day-events">
            ${visibleEvents.map(event => `
              <div class="calendar-event" style="--event-color:${escapeHtml(event.color || "#ff7a00")}" title="${escapeHtml(event.title || "")}">
                <span class="calendar-event-dot"></span>
                <span class="calendar-event-text">
                  ${calendarEventTime(event) ? `<strong>${calendarEventTime(event)}</strong> ` : ""}
                  ${escapeHtml(event.title || "Untitled event")}
                </span>
              </div>
            `).join("")}
            ${overflow > 0 ? `<div class="calendar-more">+${overflow} more</div>` : ""}
          </div>
        </div>
      `);
    }

    $("calendarGrid").innerHTML = cells.join("");
  }

  async function loadCustomCalendar() {
    if (!cfg.agendaApiUrl) {
      $("calendarGrid").innerHTML = `<div class="empty-state">Calendar API is not connected.</div>`;
      return;
    }

    const token = ++calendarRequestToken;
    const { gridStart, gridEnd } = monthRange(calendarCursor);
    $("calendarGrid").classList.add("is-loading");

    try {
      const data = await loadJsonp(cfg.agendaApiUrl, {
        start: gridStart.toISOString(),
        end: gridEnd.toISOString()
      });
      if (token !== calendarRequestToken) return;
      if (!data || data.ok === false) throw new Error(data?.error || "Calendar unavailable");
      renderCustomCalendar(data.events || []);
      markUpdated();
    } catch (error) {
      if (token !== calendarRequestToken) return;
      $("calendarGrid").innerHTML = `
        <div class="empty-state">
          Calendar could not load.<br>
          Update and redeploy the supplied Google Apps Script.
        </div>`;
      console.error(error);
    } finally {
      if (token === calendarRequestToken) $("calendarGrid").classList.remove("is-loading");
    }
  }

  function setupCalendar() {
    $("calendarPreviousButton").addEventListener("click", () => {
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
      loadCustomCalendar();
    });
    $("calendarNextButton").addEventListener("click", () => {
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
      loadCustomCalendar();
    });
    $("calendarTodayButton").addEventListener("click", () => {
      const now = new Date();
      calendarCursor = new Date(now.getFullYear(), now.getMonth(), 1);
      loadCustomCalendar();
    });
    loadCustomCalendar();
  }

  const weatherCodes = {
    0:["Clear","☀️"],1:["Mostly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Cloudy","☁️"],
    45:["Fog","🌫️"],48:["Fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],
    55:["Heavy drizzle","🌧️"],61:["Light rain","🌦️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],
    71:["Light snow","🌨️"],73:["Snow","❄️"],75:["Heavy snow","❄️"],
    80:["Rain showers","🌦️"],81:["Showers","🌧️"],82:["Heavy showers","⛈️"],
    95:["Thunderstorm","⛈️"],96:["Thunderstorm","⛈️"],99:["Thunderstorm","⛈️"]
  };
  const weatherText = code => weatherCodes[code] || ["Weather","🌡️"];

  async function loadWeather() {
    const w = cfg.weather;
    $("weatherLocation").textContent = (w.locationName || "Local").toUpperCase();
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: w.latitude,
      longitude: w.longitude,
      current: "temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,precipitation,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
      timezone: w.timezone || "auto",
      forecast_days: "3"
    });

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather unavailable");
      const data = await res.json();
      const [label, icon] = weatherText(data.current.weather_code);

      $("weatherNow").innerHTML = `
        <div class="weather-temp">${Math.round(data.current.temperature_2m)}°</div>
        <div class="weather-copy">${icon} ${label}<br>Feels like ${Math.round(data.current.apparent_temperature)}°</div>`;

      const sunrise = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", hour12: false
      }).format(new Date(data.daily.sunrise[0]));
      const sunset = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", hour12: false
      }).format(new Date(data.daily.sunset[0]));

      $("weatherDetails").innerHTML = `
        <div class="weather-detail-heading">
          <span class="weather-detail-icon">${icon}</span>
          <div>
            <div class="weather-detail-main">${label}</div>
            <div class="weather-detail-sub">Feels like ${Math.round(data.current.apparent_temperature)}°</div>
          </div>
        </div>
        <div class="weather-metrics">
          <span>💧 ${Math.round(data.current.relative_humidity_2m)}%</span>
          <span>🌧 ${Math.round(data.daily.precipitation_probability_max[0] || 0)}%</span>
          <span>💨 ${Math.round(data.current.wind_speed_10m)} km/h</span>
          <span>☀ ${sunrise}</span>
          <span>🌙 ${sunset}</span>
        </div>`;

      $("forecast").innerHTML = data.daily.time.map((d, i) => {
        const day = new Intl.DateTimeFormat("en-GB", {weekday: "short"}).format(new Date(`${d}T12:00:00`));
        const [desc, ico] = weatherText(data.daily.weather_code[i]);
        return `<div class="forecast-day" title="${desc}">
          <strong>${day}</strong>
          <div class="forecast-icon">${ico}</div>
          <div class="forecast-temp">${Math.round(data.daily.temperature_2m_max[i])}°
            <span class="forecast-min">${Math.round(data.daily.temperature_2m_min[i])}°</span>
          </div>
          <div class="forecast-rain">🌧 ${Math.round(data.daily.precipitation_probability_max[i] || 0)}%</div>
        </div>`;
      }).join("");
      markUpdated();
    } catch(e) {
      $("weatherNow").innerHTML = `<div class="weather-copy">Weather unavailable</div>`;
      $("weatherDetails").innerHTML = `<div class="empty-state">Weather unavailable.</div>`;
      $("forecast").innerHTML = "";
      console.error(e);
    }
  }

  function formatDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" :
      new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short"}).format(d);
  }

  async function loadNews() {
    try {
      const res = await fetch(cfg.rssProxyUrl + encodeURIComponent(cfg.rssFeedUrl));
      if (!res.ok) throw new Error("RSS unavailable");
      const data = await res.json();
      if (data.status && data.status !== "ok") throw new Error(data.message || "RSS error");
      const items = (data.items || []).slice(0,3);
      if (!items.length) throw new Error("No stories");
      $("newsList").innerHTML = items.map(item => {
        const snippet = stripHtml(item.description || item.content || "").slice(0, 125);
        return `
        <a class="news-item" href="${item.link}" target="_blank" rel="noopener">
          <div>
            <div class="news-kicker">LATEST ARTICLE</div>
            <div class="news-title">${escapeHtml(item.title)}</div>
            ${snippet ? `<div class="news-snippet">${escapeHtml(snippet)}${snippet.length >= 125 ? "…" : ""}</div>` : ""}
          </div>
          <div class="news-meta">${formatDate(item.pubDate)} · THAT’S GAMING</div>
        </a>`;
      }).join("");
      $("newsStatus").textContent = "LIVE";
      markUpdated();
    } catch(e) {
      $("newsList").innerHTML = `<div class="empty-state">Headlines could not load.</div>`;
      $("newsStatus").textContent = "OFFLINE";
      console.error(e);
    }
  }

  function drawChart(prices) {
    if (!prices.length) return;
    const width = 500, height = 130, pad = 6;
    const vals = prices.map(p => p[1]);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const points = vals.map((v,i) => {
      const x = pad + i * ((width - pad*2) / Math.max(vals.length-1,1));
      const y = pad + (max-v)/range * (height-pad*2);
      return [x,y];
    });
    const line = points.map((p,i) => `${i ? "L" : "M"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
    const area = `${line} L ${points.at(-1)[0].toFixed(2)} ${height} L ${points[0][0].toFixed(2)} ${height} Z`;
    $("chartLine").setAttribute("d", line);
    $("chartArea").setAttribute("d", area);
    $("bitcoinLow").textContent = `LOW ${euro.format(min)}`;
    $("bitcoinHigh").textContent = `HIGH ${euro.format(max)}`;
  }

  async function loadBitcoin() {
    const currency = cfg.bitcoin?.currency || "eur";
    try {
      const [priceRes, chartRes] = await Promise.all([
        fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency}&include_24hr_change=true&include_last_updated_at=true`),
        fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${currency}&days=1`)
      ]);
      if (!priceRes.ok || !chartRes.ok) throw new Error("Bitcoin API unavailable");
      const priceData = await priceRes.json();
      const chartData = await chartRes.json();
      const info = priceData.bitcoin;
      const price = info[currency];
      const change = info[`${currency}_24h_change`];
      $("bitcoinPrice").textContent = euro.format(price);
      const changeEl = $("bitcoinChange");
      changeEl.textContent = `${change >= 0 ? "▲" : "▼"} ${Math.abs(change).toFixed(2)}% today`;
      changeEl.className = `bitcoin-change ${change >= 0 ? "up" : "down"}`;
      drawChart(chartData.prices || []);
      $("bitcoinUpdated").textContent = `UPDATED ${new Intl.DateTimeFormat("en-GB",{
        hour:"2-digit",minute:"2-digit",hour12:false
      }).format(new Date())}`;
      $("bitcoinStatus").textContent = "LIVE";
      markUpdated();
    } catch(e) {
      $("bitcoinChange").textContent = "Market data unavailable";
      $("bitcoinStatus").textContent = "OFFLINE";
      console.error(e);
    }
  }



  updateDisplayMode();
  setupScenes();
  setupBrand();
  loadTodayAgenda();
  setupCalendar();
  updateClock();
  updateCountdown();
  loadWeather();
  loadNews();
  loadBitcoin();

  setInterval(updateClock,1000);
  setInterval(() => { updateDisplayMode(); if (storedSceneChoice() === "auto") applyScene("auto"); },60000);
  setInterval(() => { loadTodayAgenda(); loadCustomCalendar(); }, 5 * 60000);
  setInterval(updateCountdown,60000);
  setInterval(() => { loadWeather(); loadNews(); }, Math.max(5,cfg.refreshMinutes||15)*60000);
  setInterval(loadBitcoin, Math.max(2,cfg.bitcoin?.refreshMinutes||5)*60000);
})();
