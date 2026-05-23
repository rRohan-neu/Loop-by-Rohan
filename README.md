# Loop by Rohan

> Build your creator engagement habit.

A lightweight Chrome extension that helps creators stay consistent with commenting on LinkedIn, X (Twitter), and Instagram — without scraping, without servers, without accounts.

## What it does

- **Manual check-in** — click "Just Commented" after each comment. No DOM scraping, fully platform-independent.
- **90-second cooldown** — prevents spam-clicking. Encourages real engagement.
- **Daily goal tracking** — set your target (default: 10 comments/day). Progress bar fills up.
- **Streak calendar** — 70-day heatmap. Don't break the chain.
- **Multi-platform** — switch between LinkedIn, X, and Instagram in one click.
- **Session toggle** — must start a session before logging comments. Intentional activation.
- **Hide/restore** — minimize to a dot, restore anytime. Never intrusive.

## Privacy

🔒 **All data is stored locally on your device using Chrome storage. No servers. No accounts. No tracking.**

## Install (Developer Mode)

1. Download or clone this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select this folder
5. Navigate to LinkedIn, X, or Instagram

## Stack

- Manifest V3 Chrome Extension
- Vanilla JS + CSS (no frameworks)
- Chrome Storage API (local only)
- Chrome Alarms API (midnight reset)

## File structure

```
loop/
├── manifest.json       # Extension config
├── content.js          # Floating pill (injected into pages)
├── content.css         # Pill styles
├── popup.html          # Dashboard UI
├── popup.js            # Dashboard logic
├── popup.css           # Dashboard styles
├── background.js       # Midnight reset service worker
└── icons/              # Extension icons
```

## Roadmap

- [ ] AI comment suggestions (v2)
- [ ] Cloud sync + cross-device streaks
- [ ] Creator CRM (track who you engage with)
- [ ] Weekly email digest
- [ ] Firefox support

---

Built by Rohan Raju

