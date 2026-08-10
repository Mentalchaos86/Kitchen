export const predictiveMomentSettings = {
  minimumGapMinutes: 45,
  maximumSuggestions: 3,
  byMode: {
    home: {
      short: ["Take a proper break", "Tidy one small area"],
      medium: ["Take a walk", "Do the groceries", "Meal prep"],
      long: ["Do the groceries", "Meal prep", "Tackle one home task"]
    },
    work: {
      short: ["Reply to one important message", "Review the next task"],
      medium: ["Finish one article", "Clear a small admin task", "Take a short walk"],
      long: ["Deep work on one article", "Edit a video", "Plan tomorrow"]
    },
    training: {
      short: ["Hydrate", "Get your gear ready"],
      medium: ["Eat something light", "Take a short walk", "Prepare your training gear"],
      long: ["Meal prep", "Recovery walk", "Finish one small task before training"]
    },
    travel: {
      short: ["Check documents", "Check departure details"],
      medium: ["Pack the essentials", "Check route and timing", "Charge devices"],
      long: ["Finish packing", "Review bookings", "Prepare travel documents"]
    },
    gaming: {
      short: ["Check one embargo", "Reply to one press email"],
      medium: ["Write one news article", "Edit one video segment", "Prepare a review outline"],
      long: ["Finish a review", "Record or edit content", "Plan the next upload"]
    },
    recovery: {
      short: ["Hydrate", "Sit down for a real break"],
      medium: ["Take a walk", "Stretch", "Have a proper meal"],
      long: ["Relax", "Meal prep", "Prepare tomorrow calmly"]
    }
  },
  nextEventHints: {
    gym: ["Hydrate before training", "Get your gym gear ready"],
    training: ["Hydrate before training", "Get your gym gear ready"],
    work: ["Review what you need for work"],
    meeting: ["Review the meeting notes"],
    travel: ["Check your travel details"],
    flight: ["Check documents and departure details"],
    competition: ["Prepare your competition gear"]
  }
};
