-- Run this once in Supabase Dashboard → SQL Editor.
-- It enables public submissions, public reads of approved entries only,
-- and moderation only for the three configured admin email addresses.

create extension if not exists pgcrypto;

create table if not exists public.endorsements (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  designation text check (char_length(designation) <= 120),
  organisation text check (char_length(organisation) <= 160),
  message text check (char_length(message) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  name text check (char_length(name) <= 100),
  message text not null check (char_length(trim(message)) between 1 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.endorsements enable row level security;
alter table public.comments enable row level security;

grant select, insert on public.endorsements to anon, authenticated;
grant select, insert on public.comments to anon, authenticated;
grant update on public.endorsements to authenticated;
grant update on public.comments to authenticated;

create policy "Anyone can submit endorsements"
on public.endorsements for insert to anon, authenticated
with check (status = 'pending');

create policy "Anyone can submit comments"
on public.comments for insert to anon, authenticated
with check (status = 'pending');

create policy "Public can read approved endorsements"
on public.endorsements for select to anon, authenticated
using (status = 'approved');

create policy "Public can read approved comments"
on public.comments for select to anon, authenticated
using (status = 'approved');

create policy "Admins can read every endorsement"
on public.endorsements for select to authenticated
using ((auth.jwt() ->> 'email') in (
  'satyamsks999000@gmail.com',
  'soumyacpr20@gmail.com',
  'yashmth5792@gmail.com'
));

create policy "Admins can read every comment"
on public.comments for select to authenticated
using ((auth.jwt() ->> 'email') in (
  'satyamsks999000@gmail.com',
  'soumyacpr20@gmail.com',
  'yashmth5792@gmail.com'
));

create policy "Admins can moderate endorsements"
on public.endorsements for update to authenticated
using ((auth.jwt() ->> 'email') in (
  'satyamsks999000@gmail.com',
  'soumyacpr20@gmail.com',
  'yashmth5792@gmail.com'
))
with check ((auth.jwt() ->> 'email') in (
  'satyamsks999000@gmail.com',
  'soumyacpr20@gmail.com',
  'yashmth5792@gmail.com'
));

create policy "Admins can moderate comments"
on public.comments for update to authenticated
using ((auth.jwt() ->> 'email') in (
  'satyamsks999000@gmail.com',
  'soumyacpr20@gmail.com',
  'yashmth5792@gmail.com'
))
with check ((auth.jwt() ->> 'email') in (
  'satyamsks999000@gmail.com',
  'soumyacpr20@gmail.com',
  'yashmth5792@gmail.com'
));
