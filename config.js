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
      // Anker Solix (2x Solarbank 3 E2700 + Solarbank Max AC + Anker Smart Meter)
      // via the "Anker Solix" HACS integration. Empty = found automatically;
      // fill in an entity ID only when the automatic choice is wrong.
      power: "",             // W, + = afname, - = teruglevering (empty = Anker Smart Meter / P1 auto)
      price: "",             // empty = Zonneplan detected automatically
      solar: "",             // W, e.g. the solar inverter on the house (empty = not shown)
      // Empty = every Anker Solarbank is shown automatically. Or list them, e.g.
      // { name: "Solarbank 1", level: "sensor.xxx_state_of_charge", power: "sensor.xxx_charging_power", invert: true }
      // Dashboard convention: power negative = laden, positive = levert;
      // invert: true flips a sensor that reports charging as positive.
      batteries: []
    },
    // Empty = show everything Home Assistant has (lights, temperature sensors,
    // switches). Fill in entity IDs to show only those, in that order.
    lights: [],              // e.g. ["light.keuken", "light.woonkamer"]
    climate: [],             // e.g. ["sensor.woonkamer_temperature"]
    devices: [],             // e.g. ["switch.vaatwasser", "switch.wasmachine"]
    // Cameras on Home (e.g. Ring). Empty = all, front door first.
    // Fill in to choose which ones and in what order, e.g. ["camera.voordeur_live_view"].
    cameras: [],
    // Hide entities (lights, switches, cameras) whose ID or name contains one of these words.
    // Anker/Solarbank switches stay hidden so the batteries can't be switched from the dashboard.
    exclude: ["zendure", "solarbank", "solix", "anker", "child_lock", "kinderslot"]
  },

  defaultShoppingItems: [
    "Milk",
    "Coffee",
    "Fruit"
  ]
};
