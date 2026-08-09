import { $ } from "../core/dom.js";
import { getPrediction } from "../intelligence/prediction-api.js";

function render(){
  const root = $("preparationWindow");
  if (!root) return;
  const prediction = getPrediction();
  const prep = prediction.prepare, next = prediction.next;

  if (!prep || !next) {
    root.innerHTML = "";
    root.className = "preparation-window is-empty";
    return;
  }

  root.className = `preparation-window is-${prep.state}`;
  root.innerHTML = `
    <div class="prep-window-icon">${next.icon || "⏱️"}</div>
    <div class="prep-window-copy">
      <div class="prep-window-topline">
        <span class="prep-window-label">${prep.label}</span>
        <span class="prep-window-event">${next.title || "Next event"}</span>
      </div>
      <div class="prep-window-headline">${prep.headline}</div>
      <div class="prep-window-meta">
        <span>Prep ${prep.prepMinutes}m</span>
        <span>Travel ${prep.travelMinutes}m</span>
        ${prep.action ? `<strong>${prep.action}</strong>` : ""}
      </div>
    </div>`;
}

export function initPreparationWindow(){
  render();
  window.addEventListener("homehub:prediction-change", render);
}
