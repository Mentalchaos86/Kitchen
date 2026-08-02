# Kitchen Dashboard V3

This version adds an automatic multi-event countdown.

## Added events

- Gamescom — August 24 through August 28, 2026
- Beach Showdown — September 4, 2026
- Tokyo — September 9 through September 18, 2026
- Hyrox Maastricht — September 19, 2026
- Amsterdam Throwdown — December 5 and 6, 2026

## How the countdown works

The top countdown automatically:

1. Shows the nearest future event.
2. Changes to `HAPPENING NOW` during a one-day event.
3. Shows the number of days remaining during a multi-day event.
4. Moves to the next event after the current event ends.
5. Shows `ALL DONE` when no future events remain.

## Adding another event

Open `config.js` and add an entry:

```js
{
  icon: "🎂",
  label: "BIRTHDAY",
  startDate: "2026-10-10T00:00:00+02:00",
  endDate: "2026-10-10T23:59:59+02:00"
}
```

For a multi-day event, use different start and end dates.

## Google Calendar

The calendar itself is still displayed through Google's embed. The countdown event list is separate, because a public GitHub Pages dashboard cannot safely read a private Google Calendar without an authenticated API connection.

## Publish

Upload all files to your GitHub Pages repository, replacing the older dashboard files.


## Calendar URL

The dashboard is already configured with the user's Google Calendar embed URL. No manual calendar setup is required for this version.
