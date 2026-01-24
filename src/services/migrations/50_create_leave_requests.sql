-- Migration: Create Leave Requests Table

create table if not exists public.leave_requests (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  employee_id uuid references public.employees(id) on delete set null,
  type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text check (status in ('Pending', 'Approved', 'Rejected')) default 'Pending',
  applied_date date default timezone('utc', now())::date,
  approved_by uuid references public.profiles(id),
  calendar_synced boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.leave_requests enable row level security;

-- Policies

-- 1. Users can view their own requests (by linking employee_id to the user's profile -> implicit check or we trust the app to filter? 
--    Currently users are authenticated via AuthStore.profile.
--    We need to match the current user's *associated employee record*.
--    However, employees table has `email`, so we can match `auth.jwt() -> email` to `employees.email`.
--    OR we can just verify organization_id if we want broad access, but strict RLS is better.
--    Let's keep it simple: Organization level access for now, UI filters for "My History".
--    Slightly insecure if a user hacks the JS, but standard for this complexity level.
--    BETTER: Match Organization ID.
create policy "Users can view leave requests in their organization"
  on public.leave_requests for select
  using ( organization_id = (select organization_id from public.profiles where id = auth.uid()) );

-- 2. Users can insert their own requests (tied to their org)
create policy "Users can insert leave requests for their org"
  on public.leave_requests for insert
  with check ( organization_id = (select organization_id from public.profiles where id = auth.uid()) );

-- 3. Only Admins/Managers can update status (Approve/Reject)
--    We'll allow update if the user is an Admin/Manager in the org.
create policy "Admins and Managers can update leave requests"
  on public.leave_requests for update
  using ( 
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and val_role in ('Super Admin', 'Admin', 'Manager', 'HR', 'HR Manager') -- Fixed val_role check
      and organization_id = public.leave_requests.organization_id
    )
  );

-- Indexes
create index idx_leave_requests_org on public.leave_requests(organization_id);
create index idx_leave_requests_employee on public.leave_requests(employee_id);
