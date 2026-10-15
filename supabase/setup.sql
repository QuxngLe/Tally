-- Welli: one-time setup for phone reminders and automatic Apple Health sync.
-- Paste into Supabase -> SQL Editor -> Run. Safe to run again.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Keys the reminder function signs pushes with. Only the service role can read this table.
create table if not exists public.welli_push_config (id int primary key default 1, public_key text not null, private_key text not null, subject text not null);
alter table public.welli_push_config enable row level security;
insert into public.welli_push_config (id, public_key, private_key, subject)
values (1, '__VAPID_PUBLIC__', '__VAPID_PRIVATE__', '__SUBJECT__')
on conflict (id) do update set public_key = excluded.public_key, private_key = excluded.private_key, subject = excluded.subject;

-- One row per device that turned reminders on.
create table if not exists public.welli_push_subs (endpoint text primary key, user_id uuid not null references auth.users on delete cascade, sub jsonb not null, updated_at timestamptz default now());
alter table public.welli_push_subs enable row level security;
drop policy if exists "own subs" on public.welli_push_subs;
create policy "own subs" on public.welli_push_subs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The next few days of reminders, uploaded by the app whenever something changes.
create table if not exists public.welli_push_schedule (user_id uuid primary key references auth.users on delete cascade, items jsonb not null default '[]', sent jsonb not null default '[]', updated_at timestamptz default now());
alter table public.welli_push_schedule enable row level security;
drop policy if exists "own schedule" on public.welli_push_schedule;
create policy "own schedule" on public.welli_push_schedule for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Run the reminder function every minute.
select cron.unschedule('welli-remind') where exists (select 1 from cron.job where jobname = 'welli-remind');
select cron.schedule('welli-remind', '* * * * *', $$ select net.http_post(url := '__SUPABASE_URL__/functions/v1/remind', headers := '{"Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $$);

-- Apple Health: each account gets a private sync code; a Shortcut sends today's numbers with it.
create table if not exists public.welli_health_tokens (user_id uuid primary key references auth.users on delete cascade, token text unique not null, tz text not null default 'UTC');
alter table public.welli_health_tokens enable row level security;
drop policy if exists "own token" on public.welli_health_tokens;
create policy "own token" on public.welli_health_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.welli_health (user_id uuid not null references auth.users on delete cascade, day date not null, steps int, calories int, at timestamptz not null default now(), primary key (user_id, day));
alter table public.welli_health enable row level security;
drop policy if exists "own health" on public.welli_health;
create policy "own health" on public.welli_health for select using (auth.uid() = user_id);

create or replace function public.welli_health_push(token text, steps numeric default null, calories numeric default null, day date default null)
returns text language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare u uuid; z text; d date;
begin
  select t.user_id, t.tz into u, z from welli_health_tokens t where t.token = token;
  if u is null then raise exception 'Unknown sync code'; end if;
  d := coalesce(day, (now() at time zone z)::date);
  insert into welli_health as h (user_id, day, steps, calories, at) values (u, d, round(steps), round(calories), now())
  on conflict on constraint welli_health_pkey do update set steps = coalesce(excluded.steps, h.steps), calories = coalesce(excluded.calories, h.calories), at = now();
  return 'Saved';
end $$;
revoke all on function public.welli_health_push(text, numeric, numeric, date) from public;
grant execute on function public.welli_health_push(text, numeric, numeric, date) to anon, authenticated;
