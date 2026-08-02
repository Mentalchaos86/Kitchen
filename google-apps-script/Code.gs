/**
 * HomeHub Calendar API
 * Returns:
 * - today's events
 * - the next future event
 * - all events in a requested calendar range
 *
 * Deploy as Web app:
 * Execute as: Me
 * Who has access: Anyone
 */

const CALENDAR_ID = 'mvtruijen@gmail.com';
const TIME_ZONE = 'Europe/Amsterdam';
const DEFAULT_LOOKAHEAD_DAYS = 45;
const MAX_LOOKAHEAD_DAYS = 62;

const EVENT_COLORS = {
  '1': '#7986cb',
  '2': '#33b679',
  '3': '#8e24aa',
  '4': '#e67c73',
  '5': '#f6c026',
  '6': '#f5511d',
  '7': '#039be5',
  '8': '#616161',
  '9': '#3f51b5',
  '10': '#0b8043',
  '11': '#d60000'
};

function doGet(e) {
  const callback = sanitizeCallback_((e && e.parameter && e.parameter.callback) || 'callback');

  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) return jsonp_(callback, { ok: false, error: 'Calendar was not found.' });

    const now = new Date();
    const todayStart = startOfDay_(now);
    const tomorrowStart = addDays_(todayStart, 1);

    const requestedDays = Number((e && e.parameter && e.parameter.days) || DEFAULT_LOOKAHEAD_DAYS);
    const lookAheadDays = Math.min(
      MAX_LOOKAHEAD_DAYS,
      Math.max(1, Number.isFinite(requestedDays) ? requestedDays : DEFAULT_LOOKAHEAD_DAYS)
    );

    const requestedStart = parseDate_((e && e.parameter && e.parameter.start) || '');
    const requestedEnd = parseDate_((e && e.parameter && e.parameter.end) || '');
    const rangeStart = requestedStart || now;
    const rangeEnd = requestedEnd || addDays_(todayStart, lookAheadDays + 1);

    const today = calendar
      .getEvents(todayStart, tomorrowStart)
      .filter(event => !event.isAllDayEvent() || event.getEndTime() > todayStart)
      .map(eventToObject_)
      .sort(sortEvents_);

    const upcoming = calendar
      .getEvents(now, addDays_(todayStart, lookAheadDays + 1))
      .map(eventToObject_)
      .filter(event => new Date(event.end).getTime() > now.getTime())
      .sort(sortEvents_);

    const todayIds = new Set(today.map(event => event.id));
    const next = upcoming.find(event => !todayIds.has(event.id)) || null;

    const events = calendar
      .getEvents(rangeStart, rangeEnd)
      .map(eventToObject_)
      .sort(sortEvents_);

    return jsonp_(callback, {
      ok: true,
      generatedAt: new Date().toISOString(),
      timeZone: TIME_ZONE,
      today,
      next,
      events
    });
  } catch (error) {
    return jsonp_(callback, {
      ok: false,
      error: String(error && error.message ? error.message : error)
    });
  }
}

function eventToObject_(event) {
  const colorId = event.getColor();
  return {
    id: event.getId(),
    title: event.getTitle() || 'Untitled event',
    start: event.getStartTime().toISOString(),
    end: event.getEndTime().toISOString(),
    allDay: event.isAllDayEvent(),
    location: event.getLocation() || '',
    colorId,
    color: EVENT_COLORS[colorId] || '#ff7a00'
  };
}

function sortEvents_(a, b) {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  return new Date(a.start).getTime() - new Date(b.start).getTime();
}

function parseDate_(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay_(date) {
  const text = Utilities.formatDate(date, TIME_ZONE, 'yyyy-MM-dd');
  return new Date(`${text}T00:00:00`);
}

function addDays_(date, days) {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function sanitizeCallback_(callback) {
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback) ? callback : 'callback';
}

function jsonp_(callback, payload) {
  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(payload)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
