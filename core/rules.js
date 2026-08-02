export const EVENT_RULES = [
  {
    type: "travel",
    label: "TRAVEL",
    icon: "✈️",
    priority: 100,
    scene: "vacation",
    keywords: [
      "tokyo", "osaka", "kyoto", "japan", "airport", "flight",
      "vlucht", "hotel", "holiday", "vacation", "reis"
    ]
  },
  {
    type: "competition",
    label: "COMPETITION",
    icon: "🏆",
    priority: 95,
    scene: "work",
    keywords: [
      "hyrox", "showdown", "throwdown", "competition",
      "wedstrijd", "finale", "championship"
    ]
  },
  {
    type: "gaming",
    label: "GAMING EVENT",
    icon: "🎮",
    priority: 90,
    scene: "work",
    keywords: [
      "gamescom", "nintendo", "xbox", "playstation",
      "game event", "press event", "embargo"
    ]
  },
  {
    type: "birthday",
    label: "BIRTHDAY",
    icon: "🎂",
    priority: 85,
    scene: null,
    keywords: [
      "birthday", "jarig", "verjaardag"
    ]
  },
  {
    type: "gym",
    label: "GYM DAY",
    icon: "💪",
    priority: 75,
    scene: null,
    keywords: [
      "gym", "crossfit", "training", "workout", "wod",
      "hyrox training", "fitness"
    ]
  },
  {
    type: "work",
    label: "WORK",
    icon: "💼",
    priority: 60,
    scene: "work",
    keywords: [
      "schiphol", "meeting", "office", "vergadering",
      "werk", "review", "deadline"
    ]
  },
  {
    type: "personal",
    label: "PERSONAL",
    icon: "📌",
    priority: 40,
    scene: null,
    keywords: []
  }
];

export const COLOR_HINTS = {
  "5": "gym",
  "6": "work",
  "7": "gaming",
  "9": "travel",
  "10": "personal",
  "11": "important"
};

export const DESTINATIONS = [
  {
    keywords: ["tokyo", "japan"],
    city: "Tokyo",
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: "Asia/Tokyo"
  },
  {
    keywords: ["gamescom", "cologne", "köln"],
    city: "Cologne",
    latitude: 50.9375,
    longitude: 6.9603,
    timezone: "Europe/Berlin"
  },
  {
    keywords: ["maastricht"],
    city: "Maastricht",
    latitude: 50.8514,
    longitude: 5.6909,
    timezone: "Europe/Amsterdam"
  },
  {
    keywords: ["amsterdam"],
    city: "Amsterdam",
    latitude: 52.3676,
    longitude: 4.9041,
    timezone: "Europe/Amsterdam"
  }
];
