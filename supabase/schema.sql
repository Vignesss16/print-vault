-- ==============================================================================
-- PrintVault Database Schema (Supabase / PostgreSQL)
-- Zero-Store Ephemeral Physical Document Printing Architecture
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Print Shops Table (Certified Kiosks & Xerox Hubs)
-- ------------------------------------------------------------------------------
create table if not exists public.print_shops (
    id text primary key default ('shop-' || substr(uuid_generate_v4()::text, 1, 8)),
    name text not null,
    location text not null,
    distance text default '120m away',
    rating numeric(2,1) default 4.9,
    jobs_count text default '300+ jobs today',
    status_badge text default 'Ready to pick',
    image text not null,
    is_active boolean default true,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 2. Print Jobs Table (Ephemeral Document Sessions)
-- ------------------------------------------------------------------------------
create table if not exists public.print_jobs (
    id text primary key, -- e.g. PV-8F3K-29XA
    token text not null, -- 6-digit PIN e.g. '849 201'
    file_name text not null,
    file_size text not null,
    page_count integer not null default 1,
    copies integer not null default 1,
    color_mode text not null check (color_mode in ('bw', 'color')),
    total_price numeric(10,2) not null,
    shop_id text references public.print_shops(id) on delete cascade,
    status text not null check (
        status in (
            'draft',
            'ready_for_scan',
            'scanned',
            'viewing',
            'printing',
            'completed_purged',
            'revoked'
        )
    ) default 'ready_for_scan',
    is_masked_aadhaar boolean default true,
    sha256_hash text not null,
    verification_key text not null,
    expires_at timestamptz not null default (now() + interval '10 minutes'),
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Index for instant one-time token lookup by Kiosk scanner
create index if not exists idx_print_jobs_token on public.print_jobs(token);
create index if not exists idx_print_jobs_status on public.print_jobs(status);
create index if not exists idx_print_jobs_expires on public.print_jobs(expires_at);

-- ------------------------------------------------------------------------------
-- 3. Cryptographic Purge Receipts Table (Immutable Zero-Artifact Audit Trail)
-- ------------------------------------------------------------------------------
create table if not exists public.purge_receipts (
    id text primary key default ('rec-' || substr(uuid_generate_v4()::text, 1, 8)),
    job_id text not null,
    token text not null,
    file_name text not null,
    shop_name text not null,
    shop_location text not null,
    page_count integer not null,
    color_mode text not null,
    total_price numeric(10,2) not null,
    status text not null check (status in ('Done', 'Access ended')),
    verification_key text not null,
    audit_trail jsonb not null default '[]'::jsonb,
    shredded_at timestamptz default timezone('utc'::text, now()) not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_purge_receipts_job on public.purge_receipts(job_id);

-- ------------------------------------------------------------------------------
-- 4. Initial Seed Data
-- ------------------------------------------------------------------------------
insert into public.print_shops (id, name, location, distance, rating, jobs_count, status_badge, image)
values
  (
    'shop-1',
    'QuickPrint Corner',
    'Station Road, MG Road',
    '120m away',
    4.9,
    '340+ jobs today',
    'Ready to pick',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80'
  ),
  (
    'shop-2',
    'CyberPoint Print Lab',
    'Tech Hub Block C',
    '450m away',
    4.8,
    '180+ jobs',
    'Low queue',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80'
  ),
  (
    'shop-3',
    'Metro Xerox & Docs Hub',
    'Near Metro Gate 2',
    '850m away',
    4.7,
    '520+ jobs',
    'Fast queue',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80'
  )
on conflict (id) do nothing;

-- Initial Seed Purge Receipts for demo
insert into public.purge_receipts (
    id,
    job_id,
    token,
    file_name,
    shop_name,
    shop_location,
    page_count,
    color_mode,
    total_price,
    status,
    verification_key,
    audit_trail
)
values
  (
    'rec-1',
    'PV-8F3K-29XA',
    '849 201',
    'SBI_Statement_Q3.pdf',
    'QuickPrint Corner',
    'MG Road, Bengaluru',
    3,
    'bw',
    9.00,
    'Done',
    'e98a...f201',
    '[
      {"time": "10:14 AM", "title": "Access token granted", "detail": "Initiated by customer key"},
      {"time": "10:16 AM", "title": "Document spool executed", "detail": "Canon iR-ADV output"},
      {"time": "10:18 AM", "title": "Access revoked & closed", "detail": "TLS session severed"},
      {"time": "10:18 AM", "title": "Memory & disk shredded", "detail": "DoD 5220.22-M 7-pass complete"}
    ]'::jsonb
  ),
  (
    'rec-2',
    'PV-92KA-118B',
    '319 802',
    'PAN_Card_Rohan.pdf',
    'PrintExpress Hub',
    'Indiranagar, Bengaluru',
    1,
    'color',
    10.00,
    'Access ended',
    'c781...38a2',
    '[
      {"time": "Yesterday", "title": "Access token granted", "detail": "Customer authenticated"},
      {"time": "Yesterday", "title": "Spool executed", "detail": "Color laser direct print"},
      {"time": "Yesterday", "title": "Memory wiped", "detail": "Purged from RAM buffer"}
    ]'::jsonb
  )
on conflict (id) do nothing;

-- ------------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
alter table public.print_shops enable row level security;
alter table public.print_jobs enable row level security;
alter table public.purge_receipts enable row level security;

-- Public read access to certified print shops
create policy "Allow public read access to print shops"
on public.print_shops for select using (true);

-- Allow public access for ephemeral print jobs via Token / ID
create policy "Allow public read jobs"
on public.print_jobs for select using (true);

create policy "Allow public insert jobs"
on public.print_jobs for insert with check (true);

create policy "Allow public update jobs"
on public.print_jobs for update using (true);

create policy "Allow public delete jobs"
on public.print_jobs for delete using (true);

-- Allow public access for purge receipts
create policy "Allow public read purge receipts"
on public.purge_receipts for select using (true);

create policy "Allow public insert purge receipts"
on public.purge_receipts for insert with check (true);
