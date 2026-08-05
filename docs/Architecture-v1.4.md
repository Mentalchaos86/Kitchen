# Architecture v1.4

## New Flow

```text
Calendar events
      ↓
Activity Queue
      ↓
Priority Engine
      ↓
Time Awareness
      ↓
Mission Context
      ↓
Scheduler
      ↓
Hero Mission + Up Next
```

## Scheduler

The scheduler recalculates the mission every 30 seconds by default.

## Separation

- Priority decides what matters.
- Time Awareness decides when it matters.
- Scheduler decides when to recalculate.
- UI only renders the result.
