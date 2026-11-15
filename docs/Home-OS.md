# Home OS (v1.9)

## Structure

```text
Home OS shell (modules/os-shell.js)
├── Home       → modules/os-home.js   (overview cards)
├── Agenda     → existing dashboard (<main class="dashboard">, unchanged)
├── Energy     → modules/os-views.js  ← services/homeassistant.js
├── Household  → modules/os-views.js  ← services/household.js
└── Smart Home → modules/os-views.js  ← services/homeassistant.js (opened from the Home card)
```

Device-only secrets (`core/secrets.js`): `calendarKey`, `haUrl`, `haToken`.
Events: `homehub:view-change`, `homehub:home-data-change`, `homehub:household-change`,
`homehub:weather-change`, `homehub:calendar-status`, `homehub:secrets-change`.

## Securing the calendar (Apps Script)

1. Open the Apps Script project → replace the code with `google-apps-script/Code.gs`.
2. Project Settings → Script Properties → add `HOMEHUB_KEY` with a long random value.
3. On the TV: Instellingen → Verbindingen → Agenda-sleutel → enter the same value.
4. Apps Script: Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy.
   Editing the existing deployment keeps the same /exec URL.

Do step 3 before step 4 to avoid a period without calendar data on the TV.

## Connecting Home Assistant

1. In Home Assistant: Profile → Security → Long-lived access tokens → create a token.
2. On the TV: Instellingen → Verbindingen → enter the Home Assistant address and token.
3. Fill in the entity IDs under `homeAssistant` in `config.js` (entity IDs are not secret).

Browser rules to keep in mind:
- A dashboard served over HTTPS (GitHub Pages) cannot call `http://homeassistant.local` (mixed content).
  Use an HTTPS address for Home Assistant (e.g. Nabu Casa), or serve this dashboard from Home Assistant itself.
- When the dashboard and Home Assistant are on different origins, add the dashboard origin to
  `http: cors_allowed_origins` in Home Assistant's `configuration.yaml`.
