export function buildHealthScore({
  calendar = true,
  scheduler = true,
  memory = true,
  patterns = true,
  focus = true
} = {}) {
  const components = { calendar, scheduler, memory, patterns, focus };
  const values = Object.values(components).map(Boolean);
  const score = Math.round(
    values.filter(Boolean).length / Math.max(1, values.length) * 100
  );

  return { score, components };
}