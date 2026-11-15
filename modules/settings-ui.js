import { config } from "../core/config.js";
import { updatePersonalHeader } from "./header.js";

const KEY = "homehub-ui-settings-v1";
const THEME_KEY = "homehub-theme-v1";
const widgets = ["calendar","today","weather","news","bitcoin"];
const themes = ["orange","midnight","forest","amoled"];
const initialName = config.profile?.name || "";
const defaults = () => ({name: initialName, widgets: Object.fromEntries(widgets.map(key => [key,true]))});
const storage = {
  read(key) { try { return localStorage.getItem(key); } catch { return null; } },
  write(key,value) { try { localStorage.setItem(key,value); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} }
};
function read() {
  try {
    const raw = JSON.parse(storage.read(KEY) || "null");
    if (!raw || typeof raw !== "object") return defaults();
    return {
      name: typeof raw.name === "string" ? raw.name.slice(0,40) : defaults().name,
      widgets: Object.fromEntries(widgets.map(key => [key,raw.widgets?.[key] !== false]))
    };
  } catch { return defaults(); }
}
export function initSettingsUI() {
  const panel = document.getElementById("settingsPanel");
  const backdrop = document.getElementById("settingsBackdrop");
  const openButton = document.getElementById("settingsOpen");
  const closeButton = document.getElementById("settingsClose");
  const themeSelect = document.getElementById("settingsTheme");
  const nameInput = document.getElementById("settingsName");
  if (!panel || !backdrop || !openButton || !closeButton) return;
  let settings = read();
  let previousFocus = null;
  function apply() {
    config.profile ||= {};
    config.profile.name = settings.name;
    for (const key of widgets) {
      document.body.dataset["widget" + key[0].toUpperCase() + key.slice(1)] = settings.widgets[key] ? "on" : "off";
      const checkbox = panel.querySelector(`[data-widget-setting="${key}"]`);
      if (checkbox) checkbox.checked = settings.widgets[key];
    }
    nameInput.value = settings.name;
    const activeTheme = storage.read(THEME_KEY) || "orange";
    themeSelect.value = themes.includes(activeTheme) ? activeTheme : "orange";
    updatePersonalHeader();
  }
  function save() { storage.write(KEY, JSON.stringify(settings)); }
  function open() {
    previousFocus = document.activeElement;
    backdrop.hidden = false; panel.hidden = false;
    panel.setAttribute("aria-hidden","false");
    document.body.classList.add("settings-dialog-open");
    closeButton.focus();
  }
  function close() {
    panel.hidden = true; backdrop.hidden = true;
    panel.setAttribute("aria-hidden","true");
    document.body.classList.remove("settings-dialog-open");
    previousFocus?.focus?.();
  }
  openButton.addEventListener("click",open);
  closeButton.addEventListener("click",close);
  backdrop.addEventListener("click",close);
  document.addEventListener("keydown",event => {
    if (panel.hidden) return;
    if (event.key === "Escape") { close(); return; }
    if (event.key !== "Tab") return;
    const controls = [...panel.querySelectorAll("button,input,select")].filter(el => !el.disabled);
    const first = controls[0], last = controls[controls.length-1];
    if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  });
  themeSelect.addEventListener("change", () => {
    if (!themes.includes(themeSelect.value)) return;
    const dock = document.getElementById("themeSelect");
    if (dock) { dock.value = themeSelect.value; dock.dispatchEvent(new Event("change",{bubbles:true})); }
    else { document.body.dataset.theme = themeSelect.value; storage.write(THEME_KEY,themeSelect.value); }
  });
  document.getElementById("themeSelect")?.addEventListener("change", () => {
    themeSelect.value = document.body.dataset.theme || "orange";
  });
  panel.querySelectorAll("[data-widget-setting]").forEach(input => {
    input.addEventListener("change", () => {
      settings.widgets[input.dataset.widgetSetting] = input.checked;
      save(); apply();
    });
  });
  nameInput.addEventListener("change", () => {
    settings.name = nameInput.value.trim().slice(0,40);
    save(); apply();
  });
  document.getElementById("settingsReset")?.addEventListener("click", () => {
    settings = defaults();
    storage.remove(KEY); storage.remove(THEME_KEY);
    const dock = document.getElementById("themeSelect");
    if (dock) {dock.value = "orange";dock.dispatchEvent(new Event("change"));}
    apply();
  });
  apply();
}
