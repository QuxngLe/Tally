// Tally "type to schedule": turns a short note like "wed 15 CS341 midterm 2 12:30 pm" into calendar events.
// Runs as a Supabase Edge Function so the Anthropic API key stays on the server. Only signed-in Tally users
// can call it (Supabase checks the user's sign-in token before this code runs).
// Each person gets DAILY_LIMIT reads a day (counted in the tally_ai_usage table), so nobody can run up the bill.
// Setup: add the secret ANTHROPIC_API_KEY under Edge Functions → Secrets, then deploy this as "schedule-ai".
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const DAILY_LIMIT = 25;
const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["events", "note"],
  properties: {
    events: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "emoji", "repeat", "date", "days", "time"],
        properties: {
          title: { type: "string", description: "Short event name, keeping the person's own wording and capitalization (course codes like CS341 stay as written)" },
          emoji: { type: "string", description: "One fitting emoji" },
          repeat: { type: "string", enum: ["once", "daily", "days"], description: "once = a single date; daily = every day; days = the weekdays listed in days" },
          date: { type: ["string", "null"], description: "YYYY-MM-DD for repeat=once, otherwise null" },
          days: { type: "array", items: { type: "integer", enum: [0, 1, 2, 3, 4, 5, 6] }, description: "For repeat=days: 0=Sunday … 6=Saturday. Empty otherwise." },
          time: { type: ["string", "null"], description: "24-hour HH:MM start time if one was given, else null" },
        },
      },
    },
    note: { type: ["string", "null"], description: "One short sentence for the person only when you had to guess something important (for example the weekday and the date disagree), written in their app language. Otherwise null." },
  },
};

const SYSTEM = `You add things to a personal calendar app called Tally. The person types a quick note, often in shorthand, and you return the calendar events they mean.
- Resolve relative dates ("tomorrow", "next fri", "wed 15", "the 3rd", "in 2 weeks") against the current date you are given. Dates without a year are the next upcoming one.
- When a weekday and a day number disagree (for example "wed 15" when the 15th is a Thursday), prefer the day number, and say so in note.
- Numbers that belong to the name stay in the title ("midterm 2", "lab 3", "CS341").
- Several events in one note become several events. "every mon and wed" style classes are repeat=days.
- Leave out filler like "remind me to" or "add". Keep titles short and in the language the person wrote.
- If the note has nothing that can go on a calendar, return no events and explain briefly in note.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { text, today, weekday, now, lang } = await req.json();
    if (typeof text !== "string" || !text.trim() || text.length > 500) {
      return Response.json({ error: "Type something shorter to add." }, { status: 400, headers: cors });
    }
    // Who is asking, and have they used up today's reads?
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: who } = await admin.auth.getUser(token);
    if (!who?.user) return Response.json({ error: "Sign in to use the AI." }, { status: 401, headers: cors });
    const { data: used, error: limitErr } = await admin.rpc("tally_ai_take", { uid: who.user.id, max_per_day: DAILY_LIMIT });
    if (limitErr) throw limitErr;
    if (used === false) {
      return Response.json({ error: `You've used today's ${DAILY_LIMIT} AI adds. Tally will read it by itself until tomorrow.`, limit: true }, { status: 429, headers: cors });
    }
    const response = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 2000,
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Current date: ${today} (${weekday}), time ${now}. App language: ${lang || "en"}.\nNote: ${text}`,
      }],
    });
    if (response.stop_reason === "refusal") {
      return Response.json({ events: [], note: "That couldn't be added." }, { headers: cors });
    }
    const out = response.content.find((b) => b.type === "text");
    if (!out || out.type !== "text") throw new Error("No answer from the AI");
    return Response.json(JSON.parse(out.text), { headers: cors });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "The AI is busy. Try again in a moment." }, { status: 429, headers: cors });
    }
    if (e instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "The AI key isn't set up yet." }, { status: 503, headers: cors });
    }
    if (e instanceof Anthropic.APIError) {
      return Response.json({ error: "The AI couldn't answer right now." }, { status: 502, headers: cors });
    }
    return Response.json({ error: String((e as Error)?.message || e) }, { status: 500, headers: cors });
  }
});
