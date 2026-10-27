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

-- ------------------------------------------------------------------------------
-- 6. Customers Table (Name, Age, Email, Password, Vault Enclave)
-- ------------------------------------------------------------------------------
create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    age integer not null,
    email text not null unique,
    password_hash text not null,
    avatar_url text default 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    vault_tier text default 'Hardware Enclave Tier 4',
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_customers_email on public.customers(email);

alter table public.customers enable row level security;

create policy "Allow public read customers"
on public.customers for select using (true);

create policy "Allow public insert customers"
on public.customers for insert with check (true);

create policy "Allow public update customers"
on public.customers for update using (true);

-- Seed initial customers (Tanishq Mudaliyar & Rohan Sharma)
insert into public.customers (id, name, age, email, password_hash, vault_tier)
values 
  (
    'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
    'Tanishq Mudaliyar',
    23,
    'tanishq.mudaliyar@domain.in',
    'vault123',
    'Hardware Enclave Tier 4'
  ),
  (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Rohan Sharma',
    24,
    'rohan.sharma@domain.in',
    'vault123',
    'Hardware Enclave Tier 4'
  )
on conflict (email) do nothing;

-- ------------------------------------------------------------------------------
-- 7. Chat Requests Table (Customer to Xerox Store Connection Requests)
-- ------------------------------------------------------------------------------
create table if not exists public.chat_requests (
    id text primary key default ('req-' || substr(uuid_generate_v4()::text, 1, 8)),
    customer_id text not null,
    customer_name text not null,
    shop_id text not null,
    shop_name text not null,
    operator_name text default 'Mohan Kumar',
    status text not null check (status in ('pending', 'accepted', 'declined', 'completed')) default 'pending',
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_chat_requests_status on public.chat_requests(status);
create index if not exists idx_chat_requests_shop on public.chat_requests(shop_id);

alter table public.chat_requests enable row level security;

create policy "Allow public read chat requests"
on public.chat_requests for select using (true);

create policy "Allow public insert chat requests"
on public.chat_requests for insert with check (true);

create policy "Allow public update chat requests"
on public.chat_requests for update using (true);

-- ------------------------------------------------------------------------------
-- 8. Chat Messages & Ephemeral Spool Attachments Table
-- ------------------------------------------------------------------------------
create table if not exists public.chat_messages (
    id text primary key default ('msg-' || substr(uuid_generate_v4()::text, 1, 8)),
    request_id text not null references public.chat_requests(id) on delete cascade,
    sender_role text not null check (sender_role in ('customer', 'shopkeeper', 'system')),
    sender_name text not null,
    message text,
    document jsonb default null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_chat_messages_request on public.chat_messages(request_id);

alter table public.chat_messages enable row level security;

create policy "Allow public read chat messages"
on public.chat_messages for select using (true);

create policy "Allow public insert chat messages"
on public.chat_messages for insert with check (true);

-- ------------------------------------------------------------------------------
-- 9. Shopkeepers & Xerox Operators Table (Shop Name, Operator Name, Email, Password, Printer Model)
-- ------------------------------------------------------------------------------
create table if not exists public.shopkeepers (
    id uuid primary key default gen_random_uuid(),
    shop_id text not null,
    shop_name text not null,
    operator_name text not null,
    email text not null unique,
    password_hash text not null,
    phone text default '+91 98450 12345',
    printer_model text default 'Canon imageRUNNER ADVANCE C5560i',
    location text default 'Station Road, MG Road, Bengaluru',
    avatar_url text default 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
    is_online boolean default true,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_shopkeepers_email on public.shopkeepers(email);

alter table public.shopkeepers enable row level security;

create policy "Allow public read shopkeepers"
on public.shopkeepers for select using (true);

create policy "Allow public insert shopkeepers"
on public.shopkeepers for insert with check (true);

create policy "Allow public update shopkeepers"
on public.shopkeepers for update using (true);

-- Seed initial shopkeeper (Mohan Kumar - QuickPrint Corner)
insert into public.shopkeepers (id, shop_id, shop_name, operator_name, email, password_hash, printer_model, location)
values (
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'shop-1',
    'QuickPrint Corner & Xerox',
    'Mohan Kumar',
    'mohan.quickprint@domain.in',
    'vault123',
    'Canon imageRUNNER ADVANCE C5560i',
    'Station Road, MG Road, Bengaluru'
)
on conflict (email) do nothing;



