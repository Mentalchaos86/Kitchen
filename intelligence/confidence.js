export function confidenceFor(samples, spreadMinutes) {
  const countScore = Math.min(1, samples / 8);
  const consistencyScore = Math.max(0, 1 - spreadMinutes / 120);
  return Math.round((countScore * 0.55 + consistencyScore * 0.45) * 100);
}

export function confidenceLabel(value) {
  if (value >= 80) return "high";
  if (value >= 60) return "medium";
  return "low";
}