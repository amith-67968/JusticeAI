-- ═══════════════════════════════════════════════════════════════════════════
-- JusticeAI — Complete Supabase Schema
-- Run this ONCE in the Supabase SQL Editor (Settings → SQL Editor)
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;
create extension if not exists moddatetime;


-- ───────────────────────────────────────────────────────────────────────────
-- 1. USER PROFILES (extends Supabase Auth)
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
    id           uuid primary key references auth.users(id) on delete cascade,
    full_name    text not null default '',
    email        text not null default '',
    avatar_url   text default '',
    created_at   timestamptz not null default timezone('utc', now()),
    updated_at   timestamptz not null default timezone('utc', now())
);

create trigger handle_profiles_updated_at
    before update on public.profiles
    for each row
    execute function moddatetime(updated_at);

-- Auto-create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name, email)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        coalesce(new.email, '')
    );
    return new;
end;
$$;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();


-- ───────────────────────────────────────────────────────────────────────────
-- 2. DOCUMENTS (uploaded legal files)
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.documents (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    filename        text not null,
    file_path       text not null,
    file_type       text not null default '',
    file_size_bytes bigint default 0,
    text            text not null default '',
    case_type       text not null default '',
    strength        text not null default ''
        check (strength in ('', 'weak', 'moderate', 'strong')),
    structured_data jsonb default '{}'::jsonb,
    created_at      timestamptz not null default timezone('utc', now())
);

create index if not exists idx_documents_user_id
    on public.documents (user_id);
create index if not exists idx_documents_user_created
    on public.documents (user_id, created_at desc);
create index if not exists idx_documents_case_type
    on public.documents (case_type, created_at desc);


-- ───────────────────────────────────────────────────────────────────────────
-- 3. ANALYSIS RESULTS
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.analysis_results (
    id                uuid primary key default gen_random_uuid(),
    user_id           uuid not null references auth.users(id) on delete cascade,
    document_id       uuid references public.documents(id) on delete set null,
    case_strength     text not null default '',
    case_difficulty   text not null default '',
    confidence_score  int not null default 0 check (confidence_score between 0 and 100),
    summary           text not null default '',
    strong_points     jsonb default '[]'::jsonb,
    weak_points       jsonb default '[]'::jsonb,
    next_steps        jsonb default '[]'::jsonb,
    document_analysis jsonb default '[]'::jsonb,
    rule_flags        jsonb default '[]'::jsonb,
    raw_text          text default '',
    created_at        timestamptz not null default timezone('utc', now())
);

create index if not exists idx_analysis_user_id
    on public.analysis_results (user_id, created_at desc);


-- ───────────────────────────────────────────────────────────────────────────
-- 4. CHAT SESSIONS & MESSAGES
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.chat_sessions (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    title       text not null default 'New Chat',
    created_at  timestamptz not null default timezone('utc', now()),
    updated_at  timestamptz not null default timezone('utc', now())
);

create trigger handle_chat_sessions_updated_at
    before update on public.chat_sessions
    for each row
    execute function moddatetime(updated_at);

create table if not exists public.chat_messages (
    id              uuid primary key default gen_random_uuid(),
    session_id      uuid not null references public.chat_sessions(id) on delete cascade,
    user_id         uuid not null references auth.users(id) on delete cascade,
    role            text not null check (role in ('user', 'assistant')),
    content         text not null,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default timezone('utc', now())
);

create index if not exists idx_chat_messages_session
    on public.chat_messages (session_id, created_at asc);
create index if not exists idx_chat_sessions_user
    on public.chat_sessions (user_id, updated_at desc);


-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.profiles         enable row level security;
alter table public.documents        enable row level security;
alter table public.analysis_results enable row level security;
alter table public.chat_sessions    enable row level security;
alter table public.chat_messages    enable row level security;

-- Profiles
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Documents
create policy "Users can view own documents"   on public.documents for select using (auth.uid() = user_id);
create policy "Users can insert own documents" on public.documents for insert with check (auth.uid() = user_id);
create policy "Users can delete own documents" on public.documents for delete using (auth.uid() = user_id);

-- Analysis
create policy "Users can view own analyses"    on public.analysis_results for select using (auth.uid() = user_id);
create policy "Users can insert own analyses"  on public.analysis_results for insert with check (auth.uid() = user_id);

-- Chat Sessions
create policy "Users can view own sessions"    on public.chat_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions"  on public.chat_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions"  on public.chat_sessions for update using (auth.uid() = user_id);
create policy "Users can delete own sessions"  on public.chat_sessions for delete using (auth.uid() = user_id);

-- Chat Messages
create policy "Users can view own messages"    on public.chat_messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages"  on public.chat_messages for insert with check (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE — bucket for uploaded legal documents (PDFs, images)
-- ═══════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'legal-documents',
    'legal-documents',
    false,
    20971520,   -- 20 MB
    array[
        'application/pdf',
        'image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/tiff',
        'text/plain'
    ]
);

-- Storage policies: users upload/view/delete in their own folder
create policy "Users can upload to own folder"
    on storage.objects for insert
    with check (bucket_id = 'legal-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view own files"
    on storage.objects for select
    using (bucket_id = 'legal-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own files"
    on storage.objects for delete
    using (bucket_id = 'legal-documents' and (storage.foldername(name))[1] = auth.uid()::text);
