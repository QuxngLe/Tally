# Tally Tracker

Track anything you can finish: habits, to-dos, counts. One codebase runs in a browser, on a phone, and installs as an app on a PC or laptop (it's a Progressive Web App).

## What's in it
- **Today**: check things off, or count up toward an amount (8 glasses, 20 pages). Go back to earlier days to fill in what you missed.
- **Create by typing**: "drink water 8 times a day at 9am", "gym 3 times a week", "pay rent on 2026-11-01", "meditate weekdays at 7am", "call mom on sunday".
- **Streaks** per tracker (days, or weeks for "X times a week" goals).
- **Progress**: 30-day completion chart, and a 17-week calendar grid per tracker.
- **Reminders** at a set time; they show as notifications once you turn them on in Settings.
- **Customize**: name, icon, color, group, schedule (every day, some days, X times a week, one time), amount and unit, notes, archive, reorder, theme and accent color, week start.
- **Data** stays on the device. Backup/restore moves it between devices.

## Files
- `src/app.html`: the whole app (HTML, CSS, JS in one file).
- `src/manifest.webmanifest`, `src/sw.js`, icons: what makes it installable and work offline.
- `build.py`: builds `docs/` (run `python3 build.py`).
- `docs/`: the ready-to-host app. Upload this folder to any HTTPS static host (GitHub Pages, Netlify, Cloudflare Pages).

## Installing
After `docs/` is on an HTTPS address:
- iPhone (Safari): Share → Add to Home Screen.
- Android (Chrome): menu → Install app.
- Windows/Mac (Chrome or Edge): the install icon in the address bar, or Settings → Install in the app.

## Known limits
- Reminders fire while the app is open or running in the background; a phone that has fully closed the app won't get them (that needs a push server).
- Data lives in each browser separately; use Settings → Copy backup / Restore to move it.
