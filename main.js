import { initClock } from "./modules/clock.js";
import { initScenes } from "./modules/scenes.js";
import { initHeader } from "./modules/header.js";
import { initCountdown } from "./modules/countdown.js";
import { initCalendar } from "./modules/calendar.js";
import { initToday } from "./modules/today.js";
import { initWeather } from "./modules/weather.js";
import { initNews } from "./modules/news.js";
import { initBitcoin } from "./modules/bitcoin.js";

const modules = [
  ["Clock", initClock],
  ["Scenes", initScenes],
  ["Header", initHeader],
  ["Countdown", initCountdown],
  ["Calendar", initCalendar],
  ["Today", initToday],
  ["Weather", initWeather],
  ["News", initNews],
  ["Bitcoin", initBitcoin]
];

for (const [name, initialize] of modules) {
  try {
    initialize();
  } catch (error) {
    console.error(`[HomeHub:${name}] Module failed to initialize`, error);
  }
}
