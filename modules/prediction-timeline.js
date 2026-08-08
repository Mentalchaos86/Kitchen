import { $ } from "../core/dom.js";
import { getPrediction } from "../intelligence/prediction-api.js";

function formatTime(value, allDay = false) {
  if (!value) return "";
  if (allDay) return "ALL DAY";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

function card(kind, event, extraClass = "") {
  if (!event) return "";

  const time = formatTime(event.start, event.allDay);

  return `
    <div class="predict-card ${extraClass}">
      <div class="predict-card-label">${kind}</div>
      <div class="predict-card-main">
        <span class="predict-card-icon">${event.icon || "📌"}</span>
        <span class="predict-card-title">${event.title || "Untitled"}</span>
      </div>
      <div class="predict-card-meta">${time}</div>
    </div>`;
}

function render() {
  const root = $("predictionTimeline");
  if (!root) return;

  const prediction = getPrediction();

  const nowCard = prediction.now
    ? card("NOW", prediction.now, "is-now")
    : "";

  const nextCard = prediction.next
    ? card("NEXT", prediction.next, "is-next")
    : "";

  const later = (prediction.later || []).slice(0, 2);
  const laterCards = later.map((event, index) =>
    card(index === 0 ? "LATER" : "AFTER", event, "is-later")
  ).join("");

  const gap = prediction.gap?.useful
    ? `
      <div class="predict-gap">
        <span class="predict-gap-label">FREE WINDOW</span>
        <span class="predict-gap-value">${prediction.gap.minutes} min</span>
      </div>`
    : "";

  if (!nowCard && !nextCard && !laterCards && !gap) {
    root.innerHTML = "";
    root.classList.add("is-empty");
    return;
  }

  root.classList.remove("is-empty");
  root.innerHTML = `
    <div class="predict-flow">
      ${nowCard}
      ${nextCard}
      ${laterCards}
    </div>
    ${gap}`;
}

export function initPredictionTimeline() {
  render();

  window.addEventListener("homehub:prediction-change", render);
  window.addEventListener("homehub:focus-change", render);
}