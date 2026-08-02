const state = {
  agenda: {
    today: [],
    next: null,
    events: []
  }
};

export function getAgendaState() {
  return state.agenda;
}

export function setAgendaState(agenda) {
  state.agenda = {
    today: agenda?.today || [],
    next: agenda?.next || null,
    events: agenda?.events || []
  };
  window.dispatchEvent(new CustomEvent("homehub:agenda-change", {
    detail: state.agenda
  }));
}
