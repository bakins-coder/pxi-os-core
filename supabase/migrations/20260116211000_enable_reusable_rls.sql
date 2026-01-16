-- Enable RLS on reusable_items
alter table reusable_items enable row level security;

-- Policy for Organization Access
drop policy if exists "Enable access for users based on organization id" on reusable_items;

create policy "Enable access for users based on organization id"
on reusable_items for all
using (
  organization_id in (
    select organization_id from profiles
    where id = auth.uid()
  )
)
with check (
  organization_id in (
    select organization_id from profiles
    where id = auth.uid()
  )
);
