-- Daily AI allowance for Tally's schedule-ai function. Run once in the Supabase SQL Editor.
create table if not exists public.tally_ai_usage (
  user_id uuid not null references auth.users on delete cascade,
  day date not null default current_date,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.tally_ai_usage enable row level security; -- no policies: only the server can touch it

-- Adds one use for today and returns true, or returns false when the person is already at the limit.
create or replace function public.tally_ai_take(uid uuid, max_per_day int)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into tally_ai_usage (user_id, day, count) values (uid, current_date, 1)
  on conflict (user_id, day) do update set count = tally_ai_usage.count + 1
  where tally_ai_usage.count < max_per_day
  returning count into n;
  return n is not null;
end $$;
revoke all on function public.tally_ai_take(uuid, int) from public, anon, authenticated;
