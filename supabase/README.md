# Tally AI (type-to-schedule)

The Calendar's bottom bar reads what you type. Clear, simple lines ("Oct 20 dentist 3pm") are handled by Tally's built-in reader for free.
Only lines it can't read cleanly (repeats like "every Mon and Wed", a weekday that doesn't match the date, other languages, messy wording) go to the `schedule-ai` Edge Function, which asks Claude Haiku to turn them into events.
Only signed-in Tally users can call it. Signed out, offline, or not set up, Tally always falls back to the built-in reader.

## Cost and abuse protection

- Model: Claude Haiku 5.5 (the cheapest), with short replies. One AI add costs roughly a hundredth of a cent.
- Each account gets 25 AI adds per day (`DAILY_LIMIT` in `functions/schedule-ai/index.ts`). After that, Tally reads it by itself until tomorrow.
- Text is capped at 500 characters per request.
- Extra safety: in the Anthropic console under **Settings → Limits**, set a monthly spend limit (for example $5). Nothing can go past it.

## Setup (once)

1. **Usage limit table:** in Supabase open **SQL Editor**, paste the contents of `ai-limit.sql` and press **Run**.
2. **Anthropic API key:** at https://console.anthropic.com go to **API Keys → Create Key**, and add a little credit under **Billing** ($5 lasts a long time).
3. **Save the key in Supabase:** open **Edge Functions → Secrets**, add a secret named `ANTHROPIC_API_KEY` and paste the key.
4. **Deploy the function:** in **Edge Functions**, choose **Deploy a new function → Via Editor**, name it `schedule-ai`, replace the sample code with the contents of `functions/schedule-ai/index.ts`, and press **Deploy**. Leave "Verify JWT" on.
