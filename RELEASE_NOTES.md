# HomeHub OS v1.9.0 — Home OS shell + privacy

## Home OS
- New Home OS shell (Dutch): header, connection status, tabs Home / Agenda / Energy / Household.
- Home: four cards — Vandaag (date, weather, appointments, mission), Energy, Smart Home, Household.
- Agenda tab: the complete existing v1.8.6 dashboard, unchanged (calendar, mission, countdown, weather, news, Bitcoin, scenes, themes).
- Energy and Smart Home views read Home Assistant (read-only). Until it is connected they show clearly marked demo data.
- Household view: shopping list, chores and maintenance, stored per device for now.
- Automatic day/night look (light 07:00–20:00, dark otherwise), adjustable under Instellingen → Weergave.
- Returns to Home after 5 minutes without input. TV remote: Enter opens a focused card.
- New files: `home-os.css`, `core/secrets.js`, `services/homeassistant.js`, `services/household.js`, `modules/os-*.js`.

## Privacy
- E-mail address removed from `config.js` and `google-apps-script/Code.gs`.
- Apps Script uses the account's default calendar and supports an optional access key (Script Property `HOMEHUB_KEY`).
- Keys and tokens are entered on the device (Instellingen → Verbindingen) and never stored in GitHub.

## Updating
- Web files: upload as usual (including the new `home-os.css` and new module files).
- Apps Script: optional but recommended — see `docs/Home-OS.md`. The old script keeps working with this dashboard.
- No APK update required.
- Rollback: v1.8.6.
