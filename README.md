# HomeHub – Personal Header

This update turns the center header into a live daily briefing.

## New features

- Time-based greeting using the configured profile name
- Scene-aware greeting for Work and Vacation modes
- Current date and number of events today
- Today's Focus chosen from the live Google Calendar feed
- Priority for active events, travel, competitions, gym and birthdays
- Falls back to the next calendar event when today is clear
- Refreshes when the calendar updates, when scenes change and once per minute

## Profile

The name is configured in `config.js`:

```js
profile: {
  name: "Mark"
},
```

## Installation

No Google Apps Script change is required.

Upload and replace:

- index.html
- styles.css
- app.js
- config.js
- README.md

Wait for GitHub Pages to deploy, then refresh with Ctrl+F5 or fully reopen the Chromecast browser.
