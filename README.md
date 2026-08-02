# HomeHub OS – Modular Foundation

This release refactors the working HomeHub into independent modules without
changing the visual design or features.

## New project structure

```text
HomeHub/
├── index.html
├── styles.css
├── config.js
├── main.js
├── core/
│   ├── config.js
│   ├── dom.js
│   ├── state.js
│   └── status.js
├── services/
│   └── calendar-api.js
├── modules/
│   ├── clock.js
│   ├── scenes.js
│   ├── header.js
│   ├── countdown.js
│   ├── calendar.js
│   ├── today.js
│   ├── weather.js
│   ├── news.js
│   └── bitcoin.js
└── google-apps-script/
    └── Code.gs
```

## Why this is better

- A failure in Bitcoin no longer prevents Calendar or Weather from starting.
- Each feature has its own file.
- Future updates can replace a single module.
- Shared calendar state is kept in `core/state.js`.
- API access is separated into `services/`.
- `main.js` starts every module independently and catches initialization errors.

## Installation

Upload everything except the `google-apps-script` folder to the root of the
GitHub repository.

Important: GitHub must preserve the folder structure for `core`, `modules`, and
`services`.

No Google Apps Script change is required.

After GitHub Pages deploys, use Ctrl+F5 or fully reopen the Chromecast browser.
