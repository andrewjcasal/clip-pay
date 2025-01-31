create table if not exists public.submissions (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  creator_id uuid references auth.users(id) on delete cascade not null,
  video_url text,
  file_path text,
  transcription text,
  status text not null default 'active',
  views integer not null default 0,
  processed_at timestamp with time zone,
  processing_error text,
  payout_status text,
  payout_due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table public.submissions enable row level security;

-- Allow creators to view their own submissions
create policy "Creators can view their own submissions"
  on public.submissions for select
  using (auth.uid() = creator_id);

-- Allow creators to insert their own submissions
create policy "Creators can insert their own submissions"
  on public.submissions for insert
  with check (auth.uid() = creator_id);

-- Allow brands to view submissions for their campaigns
create policy "Brands can view submissions for their campaigns"
  on public.submissions for select
  using (
    exists (
      select 1 from public.campaigns c
      join public.brands b on b.id = c.brand_id
      where c.id = submissions.campaign_id
      and b.user_id = auth.uid()
    )
  );

-- Allow admins to view all submissions
create policy "Admins can view all submissions"
  on public.submissions for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.user_type = 'admin'
    )
  );

-- Create updated_at trigger
create trigger handle_updated_at before update on public.submissions
  for each row execute procedure public.handle_updated_at();