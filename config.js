window.DASHBOARD_CONFIG = {
  title: "HOME HUB",
  subtitle: "Kitchen command centre",

  profile: {
    name: "Mark"
  },

  // Paste the URL found inside the Google Calendar embed code.
  calendarEmbedUrl: "https://calendar.google.com/calendar/embed?src=mvtruijen%40gmail.com&ctz=Europe%2FAmsterdam",

  // Deploy google-apps-script/Code.gs as a Google Apps Script web app,
  // then paste its /exec URL here.
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

  defaultShoppingItems: [
    "Milk",
    "Coffee",
    "Fruit"
  ]
};
