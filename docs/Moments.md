# Moments

Moments use space that becomes available as the day progresses.

## Completed-event lifecycle

1. Active event
2. Completed and crossed out
3. Remains visible for two hours
4. Disappears from Today

All-day events remain visible for the day.

## Free-gap behavior

A Moment is considered when:

- no timed event is currently active;
- the next event is at least 45 minutes away;
- the next event is not already close enough to demand attention.

## Suggestions

Suggestions are deterministic and configured in:

```text
settings/moments.js
```

They are grouped by short, medium and long gaps.
