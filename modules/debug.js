import { getIntelligenceContext } from "../core/context.js";

let panel = null;

function createPanel() {
  panel = document.createElement("pre");
  panel.id = "homehubDebug";
  Object.assign(panel.style, {
    position: "fixed",
    inset: "4vh 4vw",
    zIndex: "9999",
    overflow: "auto",
    padding: "24px",
    margin: "0",
    borderRadius: "20px",
    background: "rgba(0,0,0,.94)",
    color: "#f5f5f5",
    border: "1px solid rgba(255,255,255,.16)",
    fontSize: "15px",
    lineHeight: "1.5",
    display: "none"
  });
  document.body.appendChild(panel);
}

function refresh() {
  if (!panel || panel.style.display === "none") return;
  const context = getIntelligenceContext();
  panel.textContent = JSON.stringify({
    mode: context.mode,
    scene: context.scene,
    activeEvent: context.activeEvent?.title || null,
    focus: context.focus
      ? {
          label: context.focus.label,
          title: context.focus.title,
          subtitle: context.focus.subtitle
        }
      : null,
    countdown: context.countdown
      ? {
          title: context.countdown.label,
          days: context.countdown.days,
          active: context.countdown.active
        }
      : null,
    weather: context.weather,
    classifiedEvents: context.analyzedEvents.map(event => ({
      title: event.title,
      type: event.intelligence.type,
      priority: event.intelligence.priority
    }))
  }, null, 2);
}

function toggle() {
  panel.style.display = panel.style.display === "none" ? "block" : "none";
  refresh();
}

export function initDebug() {
  createPanel();

  document.addEventListener("keydown", event => {
    if (event.key.toLowerCase() === "d") toggle();
  });

  window.addEventListener("homehub:intelligence-change", refresh);
}
