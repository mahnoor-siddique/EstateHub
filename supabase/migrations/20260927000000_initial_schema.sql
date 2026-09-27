-- EstateHub — Phase 5B initial schema.
--
-- Creates the core tables from implementation_plan.txt: profiles, agents, properties,
-- property_images, bookings and contact_requests, with enums, constraints, indexes and
-- Row Level Security. No data is inserted here; sample data arrives in a later migration.
--
-- RLS approach (pre-authentication):
--   * Catalog tables (agents, properties, property_images) are publicly readable.
--   * Private tables (profiles, bookings, contact_requests) are readable only by their owner.
--   * No insert/update/delete policies exist yet, so every client write is denied. Write
--     policies are added with authentication (Phase 7) and bookings/contact (Phase 8).
--   * The service role bypasses RLS and is used only from trusted server code/dashboard.

-- ---------------------------------------------------------------------------
-- Enums (values match the vocabulary in types/property.ts and the plan)
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('user', 'agent');

create type public.property_type as enum ('House', 'Apartment', 'Villa', 'Commercial');

create type public.listing_type as enum ('For Sale', 'For Rent');

create type public.property_status as enum ('available', 'pending', 'sold', 'rented');

create type public.area_unit as enum ('Marla', 'Kanal', 'sq ft');

create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — one row per Supabase Auth user (auth.users holds the credentials)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  email text check (char_length(email) <= 254),
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile for each auth user. Role is never user-editable.';

-- ---------------------------------------------------------------------------
-- agents — public agent directory; optionally linked to a user account
-- ---------------------------------------------------------------------------

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 120),
  title text check (char_length(title) <= 120),
  email text check (char_length(email) <= 254),
  phone text check (char_length(phone) <= 30),
  profile_image text,
  bio text check (char_length(bio) <= 2000),
  agency_name text check (char_length(agency_name) <= 120),
  created_at timestamptz not null default now()
);

comment on column public.agents.title is 'Role shown under the name, e.g. "Senior Property Consultant".';

-- ---------------------------------------------------------------------------
-- properties — listings, each handled by one agent
-- ---------------------------------------------------------------------------

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete restrict,
  title text not null check (char_length(title) between 1 and 160),
  description text check (char_length(description) <= 5000),
  property_type public.property_type not null,
  listing_type public.listing_type not null,
  price numeric(15, 2) not null check (price >= 0),
  city text not null check (char_length(city) between 1 and 80),
  area_location text not null check (char_length(area_location) between 1 and 120),
  address text check (char_length(address) <= 255),
  bedrooms smallint not null default 0 check (bedrooms >= 0),
  bathrooms smallint not null default 0 check (bathrooms >= 0),
  area numeric(10, 2) not null check (area > 0),
  area_unit public.area_unit not null,
  year_built smallint check (year_built between 1800 and 2100),
  parking_spaces smallint not null default 0 check (parking_spaces >= 0),
  status public.property_status not null default 'available',

  -- Amenities (one boolean per value in AMENITIES, types/property.ts)
  has_parking boolean not null default false,
  has_garden boolean not null default false,
  has_swimming_pool boolean not null default false,
  has_security boolean not null default false,
  has_gym boolean not null default false,
  is_furnished boolean not null default false,
  has_air_conditioning boolean not null default false,
  has_backup_power boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.properties.price is 'PKR. Monthly rent when listing_type is ''For Rent''.';
comment on column public.properties.area_location is 'Neighbourhood / society, e.g. "DHA Phase 6".';

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- Supports agent profile pages and the /properties filters and sorting.
create index properties_agent_id_idx on public.properties (agent_id);
create index properties_city_idx on public.properties (city);
create index properties_price_idx on public.properties (price);
create index properties_created_at_idx on public.properties (created_at desc);

-- ---------------------------------------------------------------------------
-- property_images — ordered gallery photos for a property
-- ---------------------------------------------------------------------------

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  image_url text not null,
  storage_path text,
  alt_text text not null default '' check (char_length(alt_text) <= 300),
  label text check (char_length(label) <= 60),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  -- One photo per position; also serves as the property_id lookup index.
  unique (property_id, sort_order) deferrable initially immediate
);

comment on column public.property_images.storage_path is 'Path in Supabase Storage (Phase 9); null for non-storage URLs.';
comment on column public.property_images.label is 'Short caption, e.g. "Kitchen".';

-- ---------------------------------------------------------------------------
-- bookings — viewing requests by signed-in users
-- ---------------------------------------------------------------------------

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  agent_id uuid not null references public.agents (id) on delete restrict,
  booking_date date not null,
  booking_time time not null,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text not null check (char_length(phone) between 7 and 30),
  message text check (char_length(message) <= 2000),
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- Prevents duplicate submissions of the same slot; a cancelled booking frees the slot again.
create unique index bookings_unique_active_slot_idx
  on public.bookings (user_id, property_id, booking_date, booking_time)
  where status <> 'cancelled';

create index bookings_user_id_idx on public.bookings (user_id);
create index bookings_property_id_idx on public.bookings (property_id);
create index bookings_agent_id_idx on public.bookings (agent_id);

-- ---------------------------------------------------------------------------
-- contact_requests — messages to agents; guests allowed, so links are optional
-- ---------------------------------------------------------------------------

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  agent_id uuid references public.agents (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 30),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index contact_requests_user_id_idx on public.contact_requests (user_id);
create index contact_requests_property_id_idx on public.contact_requests (property_id);
create index contact_requests_agent_id_idx on public.contact_requests (agent_id);

-- ---------------------------------------------------------------------------
-- Privileges — explicit, so the Data API exposes only what is intended
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.bookings, public.contact_requests from anon, authenticated;
revoke all on public.agents, public.properties, public.property_images from anon, authenticated;

grant select on public.agents, public.properties, public.property_images to anon, authenticated;
grant select on public.profiles, public.bookings, public.contact_requests to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.bookings enable row level security;
alter table public.contact_requests enable row level security;

-- Public catalog
create policy "Agents are publicly readable"
  on public.agents for select
  to anon, authenticated
  using (true);

create policy "Properties are publicly readable"
  on public.properties for select
  to anon, authenticated
  using (true);

create policy "Property images are publicly readable"
  on public.property_images for select
  to anon, authenticated
  using (true);

-- Private, owner-only reads
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can read their own bookings"
  on public.bookings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own contact requests"
  on public.contact_requests for select
  to authenticated
  using ((select auth.uid()) = user_id);
