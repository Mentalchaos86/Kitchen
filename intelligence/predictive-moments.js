import { settings } from "../settings/index.js";
import { getPrediction } from "./prediction-store.js";

function categoryFor(minutes) {
  if (minutes < 90) return "short";
  if (minutes < 180) return "medium";
  return "long";
}
function unique(items) {
  return [...new Set(items.filter(Boolean))];
}
function formatGap(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m} min`;
}
export function buildPredictiveMoment(prediction = getPrediction()) {
  const gap = prediction?.gap;
  if (!gap?.useful || gap.minutes < (settings.predictiveMoments?.minimumGapMinutes || 45)) return null;

  const mode = prediction.mode || "home";
  const category = categoryFor(gap.minutes);
  const modeSuggestions = settings.predictiveMoments?.byMode?.[mode]?.[category] || [];
  const nextType = prediction.next?.type || "personal";
  const nextHints = settings.predictiveMoments?.nextEventHints?.[nextType] || [];
  const suggestions = unique([...nextHints, ...modeSuggestions]).slice(
    0, settings.predictiveMoments?.maximumSuggestions || 3
  );

  const icon = {work:"💼",training:"🏋️",travel:"✈️",gaming:"🎮",recovery:"🌙",home:"🌿"}[mode] || "🌿";
  const label = {work:"FOCUS BLOCK",training:"TRAINING WINDOW",travel:"TRAVEL WINDOW",gaming:"CREATOR WINDOW",recovery:"RECOVERY WINDOW",home:"MOMENT"}[mode] || "MOMENT";

  return {
    icon, label, mode, category,
    gapMinutes: gap.minutes,
    title: `You have ${formatGap(gap.minutes)} free`,
    subtitle: prediction.next ? `Before ${prediction.next.title}` : "Free time available",
    suggestions
  };
}
