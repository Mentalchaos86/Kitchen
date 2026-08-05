export const intelligenceSettings = {
  missionLabel: "TODAY’S MISSION",
  upNextLabel: "UP NEXT",

  // Default preparation buffers in minutes.
  // Later these can be replaced by live traffic/travel data.
  defaultPreparationMinutes: 15,
  defaultTravelMinutes: 20,

  // Event-type specific lead times.
  leadTimes: {
    flight: 180,
    travel: 90,
    competition: 75,
    meeting: 20,
    work: 20,
    gym: 40,
    birthday: 0,
    personal: 15,
    gaming: 15
  },

  // Thresholds used by Time Awareness.
  urgency: {
    leaveNowMinutes: 5,
    soonMinutes: 30,
    todayHours: 6
  },

  celebrationMinutes: 20
};
