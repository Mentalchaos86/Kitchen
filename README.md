# HomeHub OS – Intelligence Engine

This build adds the first central intelligence layer to the modular HomeHub.

## New files

```text
core/rules.js
core/context.js
core/intelligence.js
modules/debug.js
```

## What the engine does

It classifies Google Calendar events as:

- Travel
- Competition
- Gaming event
- Birthday
- Gym
- Work
- Personal

It uses event title, location and Google Calendar colour hints.

## Smart behavior

- Today's Focus uses the classified priority.
- Countdown prefers major milestones such as travel, competitions and Gamescom.
- Auto Scene can switch to Vacation or Work based on context.
- Weather switches to a recognized event destination.
- Tokyo, Cologne/Gamescom, Maastricht and Amsterdam are included initially.
- Press `D` on a keyboard to open or close the hidden intelligence debug panel.

## Where to upload it

Replace the existing HomeHub repository contents with this build while keeping
the folder structure:

```text
index.html
styles.css
config.js
main.js
core/
modules/
services/
```

Do not upload the `google-apps-script` folder again.

No Google Apps Script update is required.

After GitHub Pages deploys, refresh with Ctrl+F5 or fully reopen the TV browser.
