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

  function setupCalendar() {
    if (!cfg.calendarEmbedUrl) {
      $("calendarFrame").classList.add("hidden");
      $("calendarFallback").classList.remove("hidden");
    } else {
      $("calendarFrame").src = cfg.calendarEmbedUrl;
    }
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
      latitude:w.latitude, longitude:w.longitude,
      current:"temperature_2m,apparent_temperature,weather_code",
      daily:"weather_code,temperature_2m_max,temperature_2m_min",
      timezone:w.timezone || "auto", forecast_days:"3"
    });
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather unavailable");
      const data = await res.json();
      const [label, icon] = weatherText(data.current.weather_code);
      $("weatherNow").innerHTML = `
        <div class="weather-temp">${Math.round(data.current.temperature_2m)}°</div>
        <div class="weather-copy">${icon} ${label}<br>Feels like ${Math.round(data.current.apparent_temperature)}°</div>`;
      $("forecast").innerHTML = data.daily.time.map((d,i) => {
        const day = new Intl.DateTimeFormat("en-GB",{weekday:"short"}).format(new Date(`${d}T12:00:00`));
        const [desc, ico] = weatherText(data.daily.weather_code[i]);
        return `<div class="forecast-day" title="${desc}">
          <strong>${day}</strong><div class="forecast-icon">${ico}</div>
          <div class="forecast-temp">${Math.round(data.daily.temperature_2m_max[i])}°
          <span class="forecast-min">${Math.round(data.daily.temperature_2m_min[i])}°</span></div>
        </div>`;
      }).join("");
    } catch(e) {
      $("weatherNow").innerHTML = `<div class="weather-copy">Weather unavailable</div>`;
      $("forecast").innerHTML = `<div class="empty-state">Could not load weather.</div>`;
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
      $("newsList").innerHTML = items.map(item => `
        <a class="news-item" href="${item.link}" target="_blank" rel="noopener">
          <div class="news-title">${escapeHtml(item.title)}</div>
          <div class="news-meta">${formatDate(item.pubDate)} · THAT’S GAMING</div>
        </a>`).join("");
      $("newsStatus").textContent = "LIVE";
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
    } catch(e) {
      $("bitcoinChange").textContent = "Market data unavailable";
      $("bitcoinStatus").textContent = "OFFLINE";
      console.error(e);
    }
  }

  const shoppingKey = "kitchen-dashboard-shopping-v2";
  function getItems() {
    try {
      const v = JSON.parse(localStorage.getItem(shoppingKey));
      if (Array.isArray(v)) return v;
    } catch {}
    return (cfg.defaultShoppingItems || []).map(text => ({text,done:false}));
  }
  function saveItems(v) { localStorage.setItem(shoppingKey,JSON.stringify(v)); }
  function renderShopping() {
    const items = getItems();
    $("shoppingList").innerHTML = items.length ? items.map((item,i) => `
      <li class="${item.done ? "done" : ""}">
        <input type="checkbox" data-index="${i}" ${item.done ? "checked" : ""}>
        <span>${escapeHtml(item.text)}</span>
        <button class="delete-item" data-delete="${i}">×</button>
      </li>`).join("") : `<li class="empty-state">Your list is empty.</li>`;
    document.querySelectorAll("[data-index]").forEach(el => el.onchange = () => {
      const v=getItems(); v[+el.dataset.index].done=el.checked; saveItems(v); renderShopping();
    });
    document.querySelectorAll("[data-delete]").forEach(el => el.onclick = () => {
      const v=getItems(); v.splice(+el.dataset.delete,1); saveItems(v); renderShopping();
    });
  }
  function setupShopping() {
    $("addShoppingItem").onclick = () => {
      const text = prompt("Add shopping item:");
      if (!text?.trim()) return;
      const v=getItems(); v.push({text:text.trim(),done:false}); saveItems(v); renderShopping();
      showToast("Added to shopping list");
    };
    renderShopping();
  }

  updateDisplayMode();
  setupBrand();
  setupCalendar();
  setupShopping();
  updateClock();
  updateCountdown();
  loadWeather();
  loadNews();
  loadBitcoin();

  setInterval(updateClock,1000);
  setInterval(updateDisplayMode,60000);
  setInterval(updateCountdown,60000);
  setInterval(() => { loadWeather(); loadNews(); }, Math.max(5,cfg.refreshMinutes||15)*60000);
  setInterval(loadBitcoin, Math.max(2,cfg.bitcoin?.refreshMinutes||5)*60000);
})();
