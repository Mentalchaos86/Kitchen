let context = {
  mode: "personal",
  scene: null,
  activeEvent: null,
  focus: null,
  countdown: null,
  weather: null,
  analyzedEvents: []
};

export function getIntelligenceContext() {
  return context;
}

export function setIntelligenceContext(nextContext) {
  context = nextContext;
  window.dispatchEvent(new CustomEvent("homehub:intelligence-change", {
    detail: context
  }));
}
