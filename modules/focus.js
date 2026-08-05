import { $ } from "../core/dom.js";
import { getFocusResult } from "../intelligence/context.js";

function render() {
  const result = getFocusResult();
  const focus = $("dailyFocusValue");
  const secondary = $("secondaryReminder");

  if (!focus) return;

  if (result.focus) {
    focus.textContent = [
      `${result.focus.icon} ${result.focus.title}`,
      result.focus.reason,
      result.focus.action
    ].filter(Boolean).join(" · ");

    if (secondary) {
      secondary.textContent = result.secondary.length
        ? "ALSO REMEMBER  " + result.secondary
            .map(item => `${item.icon} ${item.title} · ${item.reason}`)
            .join("   •   ")
        : "";
    }
    return;
  }

  if (result.celebrations.length) {
    const item = result.celebrations[0];
    focus.textContent = `${item.icon} ${item.title} · ${item.message}`;
    if (secondary) secondary.textContent = "";
    return;
  }

  focus.textContent = "Enjoy your clear day";
  if (secondary) secondary.textContent = "";
}

export function initFocus() {
  render();
  window.addEventListener("homehub:focus-change", render);
}