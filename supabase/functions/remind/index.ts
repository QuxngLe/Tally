// Welli reminder sender. Runs every minute (see setup.sql) and pushes any reminder that just came due
// to every device the person turned reminders on for. Deploy with "Verify JWT" off.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

Deno.serve(async () => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: cfg, error } = await db.from("welli_push_config").select("*").eq("id", 1).single();
  if (error || !cfg) return new Response("Run setup.sql first", { status: 500 });
  webpush.setVapidDetails(cfg.subject, cfg.public_key, cfg.private_key);
  const now = Date.now();
  const { data: rows } = await db.from("welli_push_schedule").select("user_id, items, sent");
  let pushed = 0;
  for (const r of rows ?? []) {
    const sent = new Set<string>(r.sent ?? []);
    // Anything due in the last 15 minutes that hasn't gone out yet (covers a missed minute or two).
    const due = (r.items ?? []).filter((i: any) => { const t = Date.parse(i.at); return t <= now && t > now - 15 * 60e3 && !sent.has(i.key) });
    if (!due.length) continue;
    const { data: subs } = await db.from("welli_push_subs").select("endpoint, sub").eq("user_id", r.user_id);
    for (const i of due) {
      sent.add(i.key);
      for (const s of subs ?? []) {
        try { await webpush.sendNotification(s.sub, JSON.stringify(i), { TTL: 3600, urgency: "high" }); pushed++ }
        catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await db.from("welli_push_subs").delete().eq("endpoint", s.endpoint) }
      }
    }
    await db.from("welli_push_schedule").update({ sent: [...sent].slice(-300) }).eq("user_id", r.user_id);
  }
  return new Response(JSON.stringify({ pushed }), { headers: { "Content-Type": "application/json" } });
});
