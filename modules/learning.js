import { $ } from "../core/dom.js";
import { getLearningState } from "../intelligence/learning.js";

function render() {
  const root = $("learningInsight");
  if (!root) return;

  const { deviation } = getLearningState();

  if (!deviation?.changed) {
    root.innerHTML = "";
    root.classList.add("is-empty");
    return;
  }

  root.classList.remove("is-empty");
  root.innerHTML = `
    <span class="learning-insight-icon">${deviation.icon}</span>
    <span class="learning-insight-copy">
      <span class="learning-insight-label">DIFFERENT TODAY</span>
      <span class="learning-insight-text">${deviation.text}</span>
    </span>`;
}

export function initLearning() {
  render();
  window.addEventListener("homehub:learning-change", render);
}