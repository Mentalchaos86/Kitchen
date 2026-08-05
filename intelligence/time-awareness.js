import { settings } from "../settings/index.js";

function formatDuration(totalMinutes) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (hours && remaining) return `${hours}h ${remaining}m`;
  if (hours) return `${hours}h`;
  return `${remaining} min`;
}

function leadTimeFor(type) {
  const configured = settings.intelligence.leadTimes?.[type];
  if (Number.isFinite(configured)) return configured;

  return (
    settings.intelligence.defaultPreparationMinutes +
    settings.intelligence.defaultTravelMinutes
  );
}

export function buildTimeAwareness(event, now = new Date()) {
  if (!event?.start) return null;

  const start = new Date(event.start);
  const end = new Date(event.end || event.start);
  const type = event.type || event.intelligence?.type || "personal";
  const leadMinutes = event.allDay ? 0 : leadTimeFor(type);
  const leaveAt = new Date(start.getTime() - leadMinutes * 60000);

  const minutesToStart = Math.ceil((start - now) / 60000);
  const minutesToLeave = Math.ceil((leaveAt - now) / 60000);
  const active = now >= start && now <= end;
  const completed = now > end;

  if (completed) {
    return {
      state: "completed",
      label: "MISSION COMPLETE",
      reason: "Completed",
      action: "You can let this one go.",
      progress: 100,
      leaveAt,
      leadMinutes
    };
  }

  if (active) {
    const minutesRemaining = Math.max(
      1,
      Math.ceil((end - now) / 60000)
    );

    return {
      state: "active",
      label: "LIVE",
      reason: "Happening now",
      action: `${formatDuration(minutesRemaining)} remaining`,
      progress: Math.max(
        5,
        Math.min(
          100,
          Math.round(((now - start) / Math.max(1, end - start)) * 100)
        )
      ),
      leaveAt,
      leadMinutes
    };
  }

  if (event.allDay) {
    return {
      state: "today",
      label: "TODAY",
      reason: "Scheduled all day",
      action: "",
      progress: 75,
      leaveAt,
      leadMinutes
    };
  }

  if (minutesToLeave <= settings.intelligence.urgency.leaveNowMinutes) {
    return {
      state: "leave-now",
      label: "LEAVE NOW",
      reason: `Starts in ${formatDuration(minutesToStart)}`,
      action: "Time to go.",
      progress: 100,
      leaveAt,
      leadMinutes
    };
  }

  if (minutesToLeave <= settings.intelligence.urgency.soonMinutes) {
    return {
      state: "leave-soon",
      label: "GET READY",
      reason: `Starts in ${formatDuration(minutesToStart)}`,
      action: `Leave in ${formatDuration(minutesToLeave)}`,
      progress: 92,
      leaveAt,
      leadMinutes
    };
  }

  if (minutesToStart <= settings.intelligence.urgency.todayHours * 60) {
    return {
      state: "today",
      label: "TODAY",
      reason: `Starts in ${formatDuration(minutesToStart)}`,
      action: `Leave in ${formatDuration(minutesToLeave)}`,
      progress: Math.max(
        25,
        Math.min(
          88,
          Math.round(
            88 - (minutesToStart / (settings.intelligence.urgency.todayHours * 60)) * 60
          )
        )
      ),
      leaveAt,
      leadMinutes
    };
  }

  const days = Math.max(1, Math.ceil((start - now) / 86400000));

  return {
    state: days === 1 ? "tomorrow" : "future",
    label: days === 1 ? "TOMORROW" : "COMING UP",
    reason: days === 1 ? "Tomorrow" : `In ${days} days`,
    action: "",
    progress: Math.max(10, 20 - Math.min(days, 30) / 3),
    leaveAt,
    leadMinutes
  };
}
