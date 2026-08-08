# Predict Timeline

Sprint 2 introduces a compact NOW / NEXT / LATER layer.

The timeline reads exclusively from the shared Prediction Store.

It shows:
- current event as NOW;
- next event as NEXT;
- up to two later events;
- a compact free-window indicator when useful.

No independent event calculations are performed in the UI.
