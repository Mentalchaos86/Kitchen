import { PRIORITIES, SCORE_RULES, SECONDARY_LIMIT } from "./priorities.js";
import { emptyFocusResult, normalizeFocus } from "./contract.js";
import { setFocusResult } from "./context.js";

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatTime(date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function typeFor(event) {
  return event.intelligence?.type || event.type || "personal";
}

function iconFor(event) {
  return event.intelligence?.icon || event.icon || "📌";
}

function timingFor(event, now) {
  const start = new Date(event.start);
  const end = new Date(event.end || event.start);
  const mins = Math.round((start - now) / 60000);

  if (now > end) {
    return { state: "completed", bonus: SCORE_RULES.completed, reason: "Completed", action: "" };
  }

  if (now >= start && now <= end) {
    const remaining = Math.max(1, Math.ceil((end - now) / 60000));
    return {
      state: "active",
      bonus: SCORE_RULES.activeNow,
      reason: "Happening now",
      action: remaining < 60 ? `${remaining} min remaining` : `${Math.ceil(remaining / 60)}h remaining`
    };
  }

  if (mins > 0 && mins <= 60) {
    return {
      state: "soon",
      bonus: SCORE_RULES.startsWithinHour,
      reason: `Starts in ${mins} min`,
      action: actionFor(event)
    };
  }

  if (sameDay(start, now)) {
    return {
      state: "today",
      bonus: SCORE_RULES.startsToday,
      reason: event.allDay ? "Scheduled all day" : `Today at ${formatTime(start)}`,
      action: actionFor(event)
    };
  }

  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  if (sameDay(start, tomorrow)) {
    return {
      state: "tomorrow",
      bonus: SCORE_RULES.tomorrow,
      reason: event.allDay ? "Tomorrow" : `Tomorrow at ${formatTime(start)}`,
      action: ""
    };
  }

  const days = Math.max(1, Math.ceil((start - now) / 86400000));
  return { state: "future", bonus: 0, reason: `In ${days} day${days === 1 ? "" : "s"}`, action: "" };
}

function actionFor(event) {
  const type = typeFor(event);
  if (["flight", "travel"].includes(type)) return "Check travel details";
  if (type === "competition") return "Prepare your gear";
  if (type === "gym") return "Get ready for training";
  if (["meeting", "work"].includes(type)) return "Review what you need";
  if (type === "birthday") return "Remember to reach out";
  return "";
}

function score(event, now) {
  const timing = timingFor(event, now);
  const type = typeFor(event);

  const baseScore = PRIORITIES[type] ?? PRIORITIES.personal;
  const allDayBonus = event.allDay ? SCORE_RULES.allDay : 0;
  const score = baseScore + timing.bonus + allDayBonus;
  const why = [
    `Priority ${baseScore}`,
    timing.reason,
    timing.bonus > 0 ? `Urgency +${timing.bonus}` : "",
    allDayBonus ? `All-day +${allDayBonus}` : ""
  ].filter(Boolean);

  return {
    ...event, type, icon: iconFor(event), state: timing.state,
    reason: timing.reason, action: timing.action, score, why
  };
}

function progressFor(event, now) {
  const start = new Date(event.start);
  const end = new Date(event.end || event.start);
  if (event.state === "completed") return 100;
  if (event.state === "active") {
    const total = Math.max(1, end - start);
    return Math.max(5, Math.min(100, Math.round(((now - start) / total) * 100)));
  }
  const horizon = 7 * 86400000;
  const distance = Math.max(0, start - now);
  if (distance >= horizon) return 12;
  return Math.max(12, Math.min(96, Math.round(96 - (distance / horizon) * 84)));
}

export function buildFocusResult(events = []) {
  const now = new Date();
  const result = emptyFocusResult();

  const scored = events
    .filter(event => event?.start)
    .map(event => score(event, now))
    .sort((a, b) => b.score - a.score || new Date(a.start) - new Date(b.start));

  const focus = scored.find(event => event.state !== "completed") || null;
  result.focus = normalizeFocus(focus);
  if (result.focus && focus) {
    result.focus.state = focus.state;
    result.focus.why = focus.why || [];
    result.focus.progress = progressFor(focus, now);
  }

  result.secondary = scored
    .filter(event => event !== focus && event.state !== "completed")
    .slice(0, SECONDARY_LIMIT)
    .map(event => ({
      id: event.id || event.title,
      title: event.title,
      icon: event.icon,
      reason: event.reason,
      score: event.score,
      type: event.type
    }));

  const completedToday = scored.find(event =>
    event.state === "completed" &&
    sameDay(new Date(event.end || event.start), now)
  );

  if (completedToday) {
    result.celebrations.push({
      icon: "✅",
      title: `${completedToday.title} completed`,
      message: completedToday.type === "gym"
        ? "Nice work. Recovery time."
        : "Done. You can let this one go."
    });
  }

  setFocusResult(result);
  return result;
}