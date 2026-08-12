import { settings } from "../settings/index.js";
import { getPrediction } from "./prediction-store.js";
import { getAwareState } from "./aware.js";
import { getFocusResult } from "./context.js";

function safe(fn, fallback) {
  try {
    const value = fn();
    return value ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function fmtTime(value, allDay = false) {
  if (!value) return "";
  if (allDay) return "all day";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date(value));
  } catch (_) {
    return "";
  }
}

const item = (icon, text, priority) => ({ icon, text, priority });

export function buildMorningBrief(now = new Date()) {
  const cfg = settings?.morningBrief;
  if (!cfg?.enabled) return null;

  const hour = now.getHours();
  if (hour < (cfg.startHour ?? 5) || hour >= (cfg.endHour ?? 11)) return null;

  const prediction = safe(() => getPrediction(), {}) || {};
  const aware = safe(() => getAwareState(), {}) || {};
  const focusResult = safe(() => getFocusResult(), {}) || {};
  const focus = focusResult.focus || null;
  const lines = [];

  const firstChange = Array.isArray(aware.changes) ? aware.changes[0] : null;
  if (firstChange?.text) lines.push(item("🆕", firstChange.text, 100));

  if (focus?.title) {
    const timing = focus.allDay ? "all day" : fmtTime(focus.start, focus.allDay);
    lines.push(item(focus.icon || "🎯", `${focus.title}${timing ? ` · ${timing}` : ""}`, 95));
  } else if (prediction?.next?.title) {
    const next = prediction.next;
    lines.push(item(next.icon || "📌", `${next.title}${next.start ? ` · ${fmtTime(next.start, next.allDay)}` : ""}`, 90));
  }

  const prep = prediction?.prepare;
  if (prep?.state === "leave-now") {
    lines.push(item("🚗", "You need to leave now.", 110));
  } else if (prep?.state === "leave-soon") {
    lines.push(item("⏰", `Leave in ${prep.readable?.leavesIn || "a few minutes"}.`, 105));
  } else if (prep?.state === "prepare") {
    lines.push(item("🎒", `Get ready. Leave in ${prep.readable?.leavesIn || "soon"}.`, 100));
  }

  if (prediction?.gap?.useful && Number.isFinite(prediction.gap.minutes)) {
    const minutes = prediction.gap.minutes;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const readable = h ? `${h}h${m ? ` ${m}m` : ""}` : `${m} min`;
    lines.push(item("🌿", `${readable} of free space before the next event.`, 60));
  }

  if (!lines.length) {
    const count = [prediction?.now, prediction?.next, ...(prediction?.later || [])].filter(Boolean).length;
    lines.push(item(
      count >= 4 ? "⚡" : "☀️",
      count >= 4 ? cfg.busyDayText : cfg.quietDayText,
      50
    ));
  }

  return {
    title: cfg.labels?.title || "MORNING BRIEF",
    mode: prediction?.mode || "home",
    lines: lines.sort((a, b) => b.priority - a.priority).slice(0, cfg.maxLines || 3),
    generatedAt: now.toISOString()
  };
}
