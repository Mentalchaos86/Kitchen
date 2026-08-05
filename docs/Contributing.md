# Contributing to HomeHub

Before building, ask:

1. What decision does this help the user make?
2. Does it reduce cognitive load?
3. Can it be understood in under three seconds?
4. Is it useful every day?
5. Does it preserve stability?

## Code Placement

- Intelligence logic: `intelligence/`
- Shared state: `core/`
- Visible behavior: `modules/`
- External APIs: `services/`

Never show internal scores on the main screen.
