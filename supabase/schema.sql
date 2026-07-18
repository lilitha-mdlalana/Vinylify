-- Vinylify mixtapes schema. Run in the Supabase SQL editor.

create table public.mixtapes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  creator_spotify_id text not null,
  creator_display_name text,
  playlist_id text not null,
  title text not null,
  theme text not null default 'vinyl',           -- 'vinyl' | 'cassette'
  cover_source text not null default 'playlist', -- future: 'upload' | 'ai'
  cover_url text,
  dedication text,
  liner_notes text,
  recipient_name text,
  tracks jsonb not null,  -- [{uri,title,artists,durationMs,side,position,imageUrl}]
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mixtapes_creator_idx on public.mixtapes (creator_spotify_id);

alter table public.mixtapes enable row level security;
-- RLS on + zero policies = anon/authenticated clients denied.
-- The service-role key (server-only) bypasses RLS and is the only access path.
