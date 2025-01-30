-- Create creators table first
create table if not exists public.creators (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_account_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Add stripe_customer_id to brands
alter table public.brands
add column if not exists stripe_customer_id text;

-- Insert creator records for existing creator users
insert into public.creators (user_id)
select id
from auth.users
where raw_user_meta_data->>'user_type' = 'creator'
on conflict (user_id) do nothing;

-- Enable RLS on creators
alter table public.creators enable row level security;

-- RLS policies for creators
create policy "Users can view their own creator record"
  on public.creators for select
  using (auth.uid() = user_id);

create policy "Users can update their own creator record"
  on public.creators for update
  using (auth.uid() = user_id);

create policy "Users can insert their own creator record"
  on public.creators for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all creator records"
  on public.creators for all
  using (
    exists (
      select 1 from auth.users
      where id = auth.uid()
      and raw_user_meta_data->>'user_type' = 'admin'
    )
  );

-- Create updated_at trigger for creators
create trigger handle_updated_at before update on public.creators
  for each row execute procedure moddatetime('updated_at'); 