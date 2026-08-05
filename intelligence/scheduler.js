import { settings } from "../settings/index.js";

let timer = null;

export function startMissionScheduler(callback) {
  stopMissionScheduler();

  const interval = Math.max(
    10,
    settings.system.missionRefreshSeconds || 30
  ) * 1000;

  timer = window.setInterval(callback, interval);
}

export function stopMissionScheduler() {
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }
}
