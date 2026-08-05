# Time Awareness

## Goal

HomeHub should know when an event becomes relevant, not merely when it starts.

## States

- Coming Up
- Today
- Get Ready
- Leave Now
- Live
- Mission Complete

## Lead Times

Lead times are configured by event type in:

```text
settings/intelligence.js
```

These values are placeholders until traffic and live travel data are connected.

## Activity Queue

HomeHub keeps an ordered queue of upcoming events. This allows the mission to switch automatically as the day progresses.

## Future

- Live traffic
- Location-aware travel time
- Weather-based departure buffers
- Delays and changed event times
