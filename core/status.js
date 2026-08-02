import { $ } from "./dom.js";

export function markUpdated() {
  const element = $("lastUpdated");
  if (!element) return;

  element.textContent = `Updated ${new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date())}`;
}
