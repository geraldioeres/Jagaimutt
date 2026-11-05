-- Patients and notes, private per authenticated user via Row Level Security.

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  patient_number text not null check (char_length(trim(patient_number)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, patient_number)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patients_user_updated_idx on public.patients (user_id, updated_at desc);
create index notes_patient_created_idx on public.notes (patient_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger patients_set_updated_at before update on public.patients
  for each row execute function public.set_updated_at();
create trigger notes_set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

-- A new or edited note bumps the patient's "recent activity".
create or replace function public.touch_patient()
returns trigger language plpgsql as $$
begin
  update public.patients set updated_at = now() where id = new.patient_id;
  return new;
end;
$$;

create trigger notes_touch_patient after insert or update on public.notes
  for each row execute function public.touch_patient();

alter table public.patients enable row level security;
alter table public.notes enable row level security;

create policy "patients_owner_all" on public.patients
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Notes must belong to the user AND point at one of the user's own patients.
create policy "notes_owner_all" on public.notes
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.patients p
      where p.id = patient_id and p.user_id = auth.uid()
    )
  );

revoke all on public.patients, public.notes from anon;

