let result = {
  focus: null,
  secondary: [],
  celebrations: [],
  warnings: [],
  changes: [],
  generatedAt: null
};

export function getFocusResult() {
  return result;
}

export function setFocusResult(next) {
  result = next;
  window.dispatchEvent(new CustomEvent("homehub:focus-change", {
    detail: result
  }));
}