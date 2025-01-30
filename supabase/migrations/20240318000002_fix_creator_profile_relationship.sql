-- Add foreign key reference from creators to profiles
alter table if exists public.creators
  add constraint creators_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- Create a view to make it easier to join creators with their profiles
create or replace view public.creator_profiles as
select 
  c.*,
  p.full_name,
  p.organization_name,
  p.avatar_url,
  p.onboarding_completed,
  p.payment_verified as profile_payment_verified,
  u.email
from public.creators c
join public.profiles p on c.user_id = p.id
join auth.users u on c.user_id = u.id;

-- Grant access to the view
grant select on public.creator_profiles to authenticated; 
