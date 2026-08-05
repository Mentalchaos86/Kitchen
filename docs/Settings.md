# Settings Architecture

HomeHub v1.4 introduces a central settings layer.

```text
settings/
├── profile.js
├── appearance.js
├── modules.js
├── intelligence.js
├── system.js
└── index.js
```

The current settings are still edited as files. A visual settings interface can later write to the same structure without requiring the dashboard to be redesigned.
