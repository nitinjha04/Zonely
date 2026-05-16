<div align="center">

# Zonely
Network‑synced global clock (400+ zones) with country filter, fullscreen ambient, alarm, customization options, PWA & persistent prefs.

**Website:** https://zonely.vercel.app

</div>

## Screenshots

| Home Page | Settings Panel | Ambient Fullscreen | Alarm Ringing | Full Screen |
|-----------|----------------|-------------------|---------------|-----------|
| ![Main](public/pics/main.jpeg) | ![Settings](public/pics/settings-panel.jpeg) | ![Ambient](public/pics/ambient-screen.jpeg) | ![Alarm](public/pics/alarm-ringing.jpeg) | ![24h](public/pics/full-screen.jpeg) |

## Features
- Accent theme selection
- Light / dark theme toggle
- Fullscreen mode with optional ambient background
- Custom alarm with animated alert
- 12h / 24h time toggle (alarm picker adapts)
- Local preference persistence (no backend required)
- Responsive layout
- Smooth animations

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `f` | Toggle fullscreen mode |
| `/` | Open search (fullscreen overlay if in fullscreen, focuses main search otherwise) |
| `a` | Toggle alarm enabled state |

Shortcuts are ignored while typing in inputs or when modifier keys are held.

## Alarm

- Set time in Settings → Alarm
- Enable/disable with toggle
- Rings when local time matches stored HH:MM

Stored in a single preferences provider (React context + localStorage) covering:
`accent`, `timeFont`, `alarmEnabled`, `alarmTime`, `use24h`, `ambientEnabled` (fullscreen only), theme.

## Notes

- No external API calls; all local date math
- Works offline once loaded

## License

This project is licensed under the [MIT License](LICENSE).

## Contributing

Small focused PRs welcome (bug fixes, accessibility, performance). Open an issue first for larger changes.