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


## Clean header update

The top bar now contains exactly:

1. Time and date
2. Personal greeting and today's focus
3. Smart countdown

The duplicate weather display has been removed from the top bar. Current
temperature, condition and feels-like temperature are now displayed prominently
inside the Weather card.


## Today and Countdown upgrade

This dashboard-only release improves the two most frequently viewed widgets.

### Today

- Type icons based on HomeHub Intelligence
- NOW, SOON, UP NEXT, LATER, DONE and ALL DAY states
- Live "starts in" and "time remaining" messages
- Finished events become visually quieter
- More useful empty-day message
- Better next-event card

### Countdown

- Planning, Coming Up, This Week, Tomorrow and Live phases
- Progress bar
- More natural hour/day language
- Preparation hints based on how close the milestone is

No Android TV APK or Google Apps Script update is required.
Upload the web files and folders to the existing GitHub Pages repository.


## Calendar and Daily Briefing upgrade

### Calendar
- Stronger glow and border around the current date
- Clear TODAY badge
- The next upcoming event on a day is visually emphasized

### Evening briefing
- After 18:00, the greeting line previews tomorrow
- If tomorrow is clear, it says `Tomorrow · No appointments`
- Otherwise it shows tomorrow's first event and time

No Android TV APK or Google Apps Script update is required.


## HomeHub OS v1.3 Focus — Sprint 1

New folder:

```text
intelligence/
├── priorities.js
├── contract.js
├── context.js
└── engine.js
```

No Google Apps Script or Android TV update is required.


## HomeHub OS v1.3.2 — Mission Experience

Sprint 3 simplifies the Focus Experience into one mission, one Up Next item, one completion state, less visual height, and no internal scoring explanations on the main screen. A full `docs/` folder now defines the vision, architecture, design language, and release workflow.


## HomeHub OS v1.4.0 — Time Awareness

Sprint 4 adds:

- live mission countdowns;
- leave-time guidance;
- urgency states;
- automatic mission transitions;
- an internal activity queue;
- a central settings architecture.

No Google Apps Script or Android TV update is required.


## HomeHub OS v1.5.0 — Aware

Adds change detection, local memory, Daily Pulse, timeline context and pattern foundations. No Google Apps Script or APK update required.


## HomeHub OS v1.6.0 — Learn

This release learns repeated event timing locally and only surfaces meaningful deviations.

No Google Apps Script or Android TV update is required.


## HomeHub OS v1.6.5 — Moments

Completed timed events remain visible for two hours and then disappear from
Today. Meaningful gaps before the next event can become calm contextual Moments.

Configure the behavior in:

```text
settings/moments.js
```

No Google Apps Script or Android TV update is required.


## HomeHub OS v1.7.0 — Predict, Sprint 1

Adds the reusable Prediction Engine and Focus Mode inference.
No visual redesign, Google Apps Script update or Android TV APK update is required.


## HomeHub OS v1.7.1 — Predict, Sprint 2

Adds a compact NOW / NEXT / LATER timeline powered by the Prediction Store.

No Google Apps Script or Android TV update is required.


## HomeHub OS v1.7.2 — Predict, Sprint 3

Adds Preparation Windows with separate preparation and travel time.
Configure defaults in `settings/preparation.js`.
No Google Apps Script or Android TV update is required.


## HomeHub OS v1.7.3 — Predict, Sprint 4

Predictive Moments adapt suggestions to the current Focus Mode, gap size, and next event.
Configure suggestions in `settings/predictive-moments.js`.
No Google Apps Script or Android TV update is required.


## HomeHub OS v1.7.4 — Predict, Sprint 5

Adds a compact Morning Brief between 05:00 and 11:00.
Configure in `settings/morning-brief.js`.
No Google Apps Script or Android TV update is required.


## HomeHub OS v1.8.0 — Polish, Sprint 1

Visual hierarchy overhaul: stronger Mission, calmer secondary intelligence, more consistent spacing, and better TV readability.
No Google Apps Script or Android TV update is required.
