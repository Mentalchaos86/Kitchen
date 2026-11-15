// TV remote (D-pad) navigation for Home OS.
// The TV app shows the dashboard inside an iframe, where Android's built-in
// spatial navigation does not work, and a remote has no Tab key. This module
// moves focus with the arrow keys and makes OK work on checkboxes.

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
const TEXT_TYPES = new Set(["text", "url", "password", "search", "email", "number", "tel"]);

function isVisible(element) {
  if (element.disabled || element.closest("[hidden]")) return false;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  const style = getComputedStyle(element);
  return style.visibility !== "hidden" && style.display !== "none";
}

function settingsPanel() {
  const panel = document.getElementById("settingsPanel");
  return panel && !panel.hidden ? panel : null;
}

function candidates(scope) {
  return [...scope.querySelectorAll(FOCUSABLE)].filter(isVisible);
}

function center(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// Nearest focusable element in the pressed direction (main screen).
function spatialTarget(current, direction, list) {
  const from = current.getBoundingClientRect();
  const origin = center(from);
  let best = null;
  let bestScore = Infinity;

  for (const element of list) {
    if (element === current) continue;
    const rect = element.getBoundingClientRect();
    const point = center(rect);
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;

    let primary;
    let secondary;
    if (direction === "ArrowDown") { if (rect.top < from.bottom - 4) continue; primary = dy; secondary = Math.abs(dx); }
    else if (direction === "ArrowUp") { if (rect.bottom > from.top + 4) continue; primary = -dy; secondary = Math.abs(dx); }
    else if (direction === "ArrowRight") { if (rect.left < from.right - 4) continue; primary = dx; secondary = Math.abs(dy); }
    else { if (rect.right > from.left + 4) continue; primary = -dx; secondary = Math.abs(dy); }

    const score = primary + secondary * 2;
    if (score < bestScore) {
      bestScore = score;
      best = element;
    }
  }
  return best;
}

function moveFocus(target) {
  if (!target) return false;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: "nearest", inline: "nearest" });
  return true;
}

function onKeyDown(event) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  const key = event.key;
  const active = document.activeElement;

  // OK on a checkbox toggles it (browsers only do this for Space).
  if ((key === "Enter") && active?.matches?.("input[type=checkbox]")) {
    event.preventDefault();
    active.click();
    return;
  }

  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) return;

  // Let text fields keep Left/Right for moving the cursor.
  const isText = active?.tagName === "TEXTAREA" ||
    (active?.tagName === "INPUT" && TEXT_TYPES.has(active.type));
  if (isText && (key === "ArrowLeft" || key === "ArrowRight")) return;

  const panel = settingsPanel();
  const scope = panel || document;
  const list = candidates(scope);
  if (!list.length) return;

  // Nothing (or something outside the scope) focused: start at the first control.
  if (!active || active === document.body || !scope.contains(active)) {
    event.preventDefault();
    moveFocus(list[0]);
    return;
  }

  let target = null;
  if (panel) {
    // The settings drawer is one vertical list: Up/Down walk it in order.
    if (key === "ArrowLeft" || key === "ArrowRight") {
      if (active.tagName === "SELECT") event.preventDefault(); // don't change the value
      return;
    }
    const index = list.indexOf(active);
    target = list[index + (key === "ArrowDown" ? 1 : -1)] || null;
  } else {
    target = spatialTarget(active, key, list);
  }

  // Arrows on a closed <select> would change its value; OK opens it instead.
  if (target || active.tagName === "SELECT") event.preventDefault();
  if (target) {
    moveFocus(target);
  } else if (panel) {
    // At the start/end of the drawer: scroll it so the last texts are visible.
    panel.querySelector(".settings-scroll")?.scrollBy({ top: key === "ArrowDown" ? 200 : -200 });
  }
}

export function initOsRemote() {
  document.addEventListener("keydown", onKeyDown);
}
