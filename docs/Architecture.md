# HomeHub Architecture

```text
Google Calendar / Weather / Countdown / News / Bitcoin
                         ↓
                Core services and state
                         ↓
               HomeHub Intelligence
                         ↓
                   Mission result
                         ↓
                 Dashboard modules
```

## Project Structure

- `core/`: shared configuration, state, utilities
- `intelligence/`: priorities, scoring, context, contract
- `modules/`: visible dashboard features
- `services/`: external API communication
- `docs/`: product and technical documentation
