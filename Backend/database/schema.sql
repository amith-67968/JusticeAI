-- JusticeAI — PostgreSQL schema for Supabase
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),
    text text not null,
    case_type text not null,
    strength text not null check (strength in ('weak', 'moderate', 'strong')),
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_documents_created_at_desc
    on public.documents (created_at desc);

create index if not exists idx_documents_case_type_created_at
    on public.documents (case_type, created_at desc);
