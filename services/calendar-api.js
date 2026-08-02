import { config } from "../core/config.js";

export function loadCalendarJsonp(params = {}, timeoutMs = 12000) {
  if (!config.agendaApiUrl) {
    return Promise.reject(new Error("Calendar API URL is not configured"));
  }

  return new Promise((resolve, reject) => {
    const callbackName =
      `homeHubCalendar_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement("script");
    const separator = config.agendaApiUrl.includes("?") ? "&" : "?";

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Calendar request timed out"));
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
      reject(new Error("Calendar request could not load"));
    };

    const query = new URLSearchParams({
      callback: callbackName,
      days: String(config.agenda?.lookAheadDays || 45),
      ...params
    });

    script.src = `${config.agendaApiUrl}${separator}${query.toString()}`;
    document.head.appendChild(script);
  });
}
