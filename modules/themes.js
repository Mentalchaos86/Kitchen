const KEY = "homehub-theme-v1";
const VALID = new Set(["orange", "midnight", "forest", "amoled"]);
export function initThemes() {
  const select = document.getElementById("themeSelect");
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const save = value => { try { localStorage.setItem(KEY, value); } catch {} };
  const apply = value => {
    const theme = VALID.has(value) ? value : "orange";
    document.body.dataset.theme = theme;
    if (select) select.value = theme;
  };
  apply(read());
  if (select) select.addEventListener("change", () => {
    apply(select.value);
    save(select.value);
  });
}
