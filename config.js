window.DASHBOARD_CONFIG = {
  title: "HOME HUB",
  subtitle: "Kitchen command centre",

  profile: {
    name: "Mark"
  },

  intelligenceUi: {
    missionLabel: "TODAY’S MISSION",
    upNextLabel: "UP NEXT",
    useMissionLanguage: true
  },

  // Deploy google-apps-script/Code.gs as a Google Apps Script web app,
  // then paste its /exec URL here.
  // The optional access key is NOT stored here: enter it on the TV under
  // Instellingen → Verbindingen (saved only on that device).
  agendaApiUrl: "https://script.google.com/macros/s/AKfycbzTh8fGwqTLroyquF4QdJDgZXOoYwkX1a4x-IIvWPxpAKcUJ3DGuJFJO4DR7ggbz8AL/exec",

  agenda: {
    maxTodayEvents: 5,
    lookAheadDays: 45
  },

  calendar: {
    maxEventsPerDay: 3,
    weekStartsOnMonday: true
  },

  // The dashboard automatically chooses the current event or nearest future event.
  // End dates use 23:59 so the event remains active for the complete final day.
  events: [
    {
      icon: "🎮",
      label: "GAMESCOM",
      startDate: "2026-08-24T00:00:00+02:00",
      endDate: "2026-08-28T23:59:59+02:00"
    },
    {
      icon: "🏋️",
      label: "BEACH SHOWDOWN",
      startDate: "2026-09-04T00:00:00+02:00",
      endDate: "2026-09-04T23:59:59+02:00"
    },
    {
      icon: "🗼",
      label: "TOKYO",
      startDate: "2026-09-09T00:00:00+02:00",
      endDate: "2026-09-18T23:59:59+02:00"
    },
    {
      icon: "🏃",
      label: "HYROX MAASTRICHT",
      startDate: "2026-09-19T00:00:00+02:00",
      endDate: "2026-09-19T23:59:59+02:00"
    },
    {
      icon: "🏋️",
      label: "AMSTERDAM THROWDOWN",
      startDate: "2026-12-05T00:00:00+01:00",
      endDate: "2026-12-06T23:59:59+01:00"
    }
  ],

  weather: {
    latitude: 52.6714,
    longitude: 4.8486,
    locationName: "Heerhugowaard",
    timezone: "Europe/Amsterdam"
  },

  rssFeedUrl: "https://www.thatsgaming.nl/feed/",
  rssProxyUrl: "https://api.rss2json.com/v1/api.json?rss_url=",

  bitcoin: {
    currency: "eur",
    refreshMinutes: 5
  },

  scenes: {
    default: "auto",
    autoMorningStart: 5,
    autoWorkStart: 11,
    autoEveningStart: 17,
    autoNightStart: 23
  },

  refreshMinutes: 15,

  // Home OS (v1.9). The Home Assistant address and token are entered on the TV
  // under Instellingen → Verbindingen and never stored in this public file.
  // Until Home Assistant is connected, Energy and Smart Home show demo data.
  homeOs: {
    defaultView: "home",
    returnHomeAfterMinutes: 5,
    appearance: "dark",      // auto | light | dark
    dayStartHour: 7,
    nightStartHour: 20
  },

  homeAssistant: {
    refreshSeconds: 30,
    // Fill in the entity IDs once Home Assistant is running
    // (Home Assistant → Instellingen → Entiteiten).
    energy: {
      power: "",             // e.g. sensor.zendure_p1_power (W)
      price: "",             // e.g. sensor.zonneplan_current_electricity_tariff (€/kWh)
      solar: "",             // e.g. sensor.anker_solix_solar_power (W)
      batteries: [
        { name: "Anker",   level: "", power: "" },
        { name: "Zendure", level: "", power: "" }
      ]
    },
    lights: [],              // e.g. ["light.keuken", "light.woonkamer"]
    climate: [],             // e.g. ["sensor.woonkamer_temperature"]
    devices: []              // e.g. ["switch.vaatwasser", "switch.wasmachine"]
  },

  defaultShoppingItems: [
    "Milk",
    "Coffee",
    "Fruit"
  ]
};
