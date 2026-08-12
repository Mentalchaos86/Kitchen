import { $ } from "../core/dom.js";
import { buildMorningBrief } from "../intelligence/brief.js";

function render() {
  const root = $("morningBrief");
  if (!root) return;

  try {
    const brief = buildMorningBrief();

    if (!brief) {
      root.innerHTML = "";
      root.className = "morning-brief is-empty";
      return;
    }

    root.className = `morning-brief is-${brief.mode}`;
    root.innerHTML = `
      <div class="morning-brief-header">
        <span class="morning-brief-icon">☀️</span>
        <span class="morning-brief-label">${brief.title}</span>
      </div>
      <div class="morning-brief-lines">
        ${brief.lines.map(x => `
          <div class="morning-brief-line">
            <span class="morning-brief-line-icon">${x.icon}</span>
            <span class="morning-brief-line-text">${x.text}</span>
          </div>`).join("")}
      </div>`;
  } catch (error) {
    console.error("[HomeHub:Morning Brief] Render failed", error);
    root.innerHTML = "";
    root.className = "morning-brief is-empty";
  }
}

export function initMorningBrief() {
  render();
  ["homehub:prediction-change", "homehub:aware-change", "homehub:focus-change"]
    .forEach(name => window.addEventListener(name, render));
  window.setInterval(render, 60000);
}
