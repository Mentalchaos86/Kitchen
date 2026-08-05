export function buildActivityQueue(events = [], now = new Date()) {
  return events
    .filter(event => event?.start)
    .filter(event => new Date(event.end || event.start) >= now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .map((event, index) => ({
      ...event,
      queueIndex: index,
      isCurrent: now >= new Date(event.start) &&
        now <= new Date(event.end || event.start)
    }));
}
