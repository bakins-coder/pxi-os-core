-- Migration: Create Performance Reviews Table

create table if not exists public.performance_reviews (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  employee_id uuid references public.employees(id) on delete cascade not null,
  year int not null,
  quarter text not null check (quarter in ('Q1', 'Q2', 'Q3', 'Q4')),
  metrics jsonb default '[]'::jsonb, -- Stores the array of PerformanceMetric
  total_score numeric(4, 2) default 0,
  status text check (status in ('Draft', 'Employee_Review', 'Supervisor_Review', 'Finalized')) default 'Draft',
  submitted_date timestamptz,
  finalized_date timestamptz,
  created_at timestamptz default now(),
  
  -- Ensure one review per employee per quarter per year
  unique(employee_id, year, quarter)
);

-- Enable RLS
alter table public.performance_reviews enable row level security;

-- Policies

-- 1. Users can view their own reviews
create policy "Users can view own reviews"
  on public.performance_reviews for select
  using ( 
    employee_id in (select id from public.employees where email = auth.jwt() ->> 'email')
    or
    -- Admins/Managers in the same org can view all
    (organization_id = (select organization_id from public.profiles where id = auth.uid()) 
     and exists (select 1 from public.profiles where id = auth.uid() and role in ('Super Admin', 'Admin', 'Manager', 'HR', 'HR Manager')))
  );

-- 2. Admins/Managers can insert (Create Cycles)
create policy "Admins can create review cycles"
  on public.performance_reviews for insert
  with check (
    organization_id = (select organization_id from public.profiles where id = auth.uid())
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('Super Admin', 'Admin', 'Manager', 'HR', 'HR Manager'))
  );

-- 3. Updates:
--    a. Employee can update if status is 'Employee_Review' AND it belongs to them
create policy "Employees can update own draft review"
  on public.performance_reviews for update
  using (
    employee_id in (select id from public.employees where email = auth.jwt() ->> 'email')
    and status = 'Employee_Review'
  );

--    b. Managers/Admins can update if status is 'Supervisor_Review' OR they are admin (override)
create policy "Managers can update supervisor review"
  on public.performance_reviews for update
  using (
    organization_id = (select organization_id from public.profiles where id = auth.uid())
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('Super Admin', 'Admin', 'Manager', 'HR', 'HR Manager'))
  );

-- Indexes
create index idx_perf_reviews_org on public.performance_reviews(organization_id);
create index idx_perf_reviews_emp on public.performance_reviews(employee_id);
create index idx_perf_reviews_cycle on public.performance_reviews(year, quarter);
