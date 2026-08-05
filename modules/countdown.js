import { config } from "../core/config.js";
import { $ } from "../core/dom.js";
import { getIntelligenceContext } from "../core/context.js";

function setCountdown({
  icon,
  label,
  value,
  phase,
  hint,
  progress
}) {
  $("countdownIcon").textContent = icon;
  $("countdownLabel").textContent = label;
  $("countdownValue").textContent = value;
  $("countdownPhase").textContent = phase;
  $("countdownHint").textContent = hint;
  $("countdownProgressFill").style.width =
    `${Math.max(0, Math.min(100, progress))}%`;
}

function milestoneDetails(event, active = false) {
  const now = new Date();
  const start = new Date(event.start);
  const end = new Date(event.end || event.start);

  if (active || (now >= start && now <= end)) {
    const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));

    return {
      value: "HAPPENING NOW",
      phase: "LIVE",
      hint: daysLeft > 1
        ? `${daysLeft} days remaining`
        : "Enjoy the moment",
      progress: 100
    };
  }

  const difference = start - now;
  const totalHours = difference / 3600000;
  const days = Math.ceil(difference / 86400000);

  if (totalHours <= 0) {
    return {
      value: "TODAY",
      phase: "READY",
      hint: "It is time",
      progress: 100
    };
  }

  if (totalHours < 24) {
    const hours = Math.max(1, Math.ceil(totalHours));
    return {
      value: `IN ${hours} HOUR${hours === 1 ? "" : "S"}`,
      phase: "TODAY",
      hint: "Final checks",
      progress: 98
    };
  }

  if (days === 1) {
    return {
      value: "TOMORROW",
      phase: "GET READY",
      hint: "Prepare everything today",
      progress: 96
    };
  }

  if (days <= 7) {
    return {
      value: `IN ${days} DAYS`,
      phase: "THIS WEEK",
      hint: days <= 3 ? "Final preparation" : "Preparation week",
      progress: 88 + (7 - days) * 1.3
    };
  }

  if (days <= 14) {
    return {
      value: `IN ${days} DAYS`,
      phase: "COMING CLOSE",
      hint: "Time to prepare the details",
      progress: 72 + (14 - days) * 2
    };
  }

  if (days <= 30) {
    return {
      value: `IN ${days} DAYS`,
      phase: "COMING UP",
      hint: "Planning is underway",
      progress: 45 + (30 - days) * 1.6
    };
  }

  const horizon = 90;
  return {
    value: `IN ${days} DAYS`,
    phase: "PLANNING",
    hint: "Your next major milestone",
    progress: Math.max(10, 42 - Math.min(days, horizon) * 0.35)
  };
}

function renderIntelligentCountdown(countdown) {
  const details = milestoneDetails(
    countdown.event,
    countdown.active
  );

  setCountdown({
    icon: countdown.icon,
    label: countdown.label,
    ...details
  });
}

function fallbackCountdown() {
  const events = (config.events || [])
    .map(event => ({
      ...event,
      title: event.label || "Next event",
      start: new Date(event.startDate),
      end: new Date(event.endDate || event.startDate)
    }))
    .filter(event =>
      !Number.isNaN(event.start.getTime()) &&
      !Number.isNaN(event.end.getTime())
    )
    .sort((a, b) => a.start - b.start);

  const now = new Date();
  const event = events.find(item => item.end > now);

  if (!event) {
    setCountdown({
      icon: "✓",
      label: "MILESTONES",
      value: "ALL CLEAR",
      phase: "READY",
      hint: "Nothing major is waiting",
      progress: 100
    });
    return;
  }

  const details = milestoneDetails(event);

  setCountdown({
    icon: event.icon || "📅",
    label: (event.label || "NEXT EVENT").toUpperCase(),
    ...details
  });
}

export function updateCountdown() {
  const intelligentCountdown =
    getIntelligenceContext().countdown;

  if (intelligentCountdown?.event) {
    renderIntelligentCountdown(intelligentCountdown);
    return;
  }

  fallbackCountdown();
}

export function initCountdown() {
  updateCountdown();
  window.addEventListener(
    "homehub:intelligence-change",
    updateCountdown
  );
  setInterval(updateCountdown, 60000);
}
