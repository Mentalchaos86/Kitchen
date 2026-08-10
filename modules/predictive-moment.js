import { $ } from "../core/dom.js";
import { buildPredictiveMoment } from "../intelligence/predictive-moments.js";

function render() {
  const root = $("predictiveMoment");
  if (!root) return;
  const moment = buildPredictiveMoment();

  if (!moment) {
    root.innerHTML = "";
    root.className = "predictive-moment is-empty";
    return;
  }

  root.className = `predictive-moment is-${moment.mode}`;
  root.innerHTML = `
    <div class="predictive-moment-icon">${moment.icon}</div>
    <div class="predictive-moment-copy">
      <div class="predictive-moment-label">${moment.label}</div>
      <div class="predictive-moment-title">${moment.title}</div>
      <div class="predictive-moment-subtitle">${moment.subtitle}</div>
      ${moment.suggestions.length ? `
        <div class="predictive-moment-suggestions">
          ${moment.suggestions.map(item => `<span class="predictive-moment-suggestion">${item}</span>`).join("")}
        </div>` : ""}
    </div>`;
}

export function initPredictiveMoment() {
  render();
  window.addEventListener("homehub:prediction-change", render);
}
