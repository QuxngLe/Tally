# Welli

Track anything you can finish: habits, to-dos, counts. One codebase runs in a browser, on a phone, and installs as an app on a PC or laptop (it's a Progressive Web App).

## What's in it
- **Today**: check things off, or count up toward an amount (8 glasses, 20 pages). Go back to earlier days to fill in what you missed.
- **Create by typing**: "drink water 8 times a day at 9am", "gym 3 times a week", "pay rent on 2026-11-01", "meditate weekdays at 7am", "call mom on sunday".
- **Streaks** per tracker (days, or weeks for "X times a week" goals).
- **Progress**: 30-day completion chart, and a 17-week calendar grid per tracker.
- **Reminders** at a set time; they show as notifications once you turn them on in Settings.
- **Calendar**: month and week views; tap a day to open it, or check things off right in the week view.
- **Steps inside a tracker**: add a checklist (e.g. a morning routine); finishing every step finishes the tracker.
- **Several reminders per tracker**, each with a 10-minute snooze (also from the notification on Android and desktop).
- **Progress over any range**: week, month, 3 months, year or all time, plus a 12-month heatmap.
- **Templates**: Morning routine, Evening wind-down, Fitness basics, Study, Healthy habits, Home chores, Weekly review.
- **Lists**: All, Due this week, Left today, Overdue, and one list per group and #tag.
- **Steps and calories from your phone**: signed in, an iPhone Shortcut sends Apple Health numbers with a private sync code (Settings → Steps and calories). Without an account, open `?steps=8421&calories=512`.
- **Reminders with the app closed**: signed-in devices get push notifications from a small Supabase function.
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

## Server setup (reminders and Apple Health)
One time, in the Supabase dashboard:
1. SQL Editor: run `supabase/setup.sql` after filling in the VAPID keys, subject and project URL.
2. Edge Functions: create a function named `remind` from `supabase/functions/remind/index.ts`, with Verify JWT turned off.
