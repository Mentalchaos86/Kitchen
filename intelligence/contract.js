export function emptyFocusResult() {
  return {
    focus: null,
    secondary: [],
    celebrations: [],
    warnings: [],
    changes: [],
    queue: [],
    generatedAt: new Date().toISOString()
  };
}

export function normalizeFocus(item) {
  if (!item) return null;

  return {
    id: item.id || "",
    title: item.title || "Untitled",
    icon: item.icon || "📌",
    score: Number(item.score || 0),
    reason: item.reason || "",
    action: item.action || "",
    type: item.type || "personal",
    start: item.start || null,
    end: item.end || null,
    allDay: Boolean(item.allDay),
    location: item.location || "",
    state: item.state || "ready",
    why: Array.isArray(item.why) ? item.why : [],
    progress: Number(item.progress || 0),
    label: item.label || "",
    leaveAt: item.leaveAt || null,
    leadMinutes: Number(item.leadMinutes || 0)
  };
}