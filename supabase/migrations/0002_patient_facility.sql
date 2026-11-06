-- Each patient belongs to one place: RS UNS or Klinik.
-- Existing patients start at RS UNS; they can be moved by editing the patient.

alter table public.patients
  add column facility text not null default 'rs_uns'
  check (facility in ('rs_uns', 'klinik'));

-- Patient numbers come from each place's own records, so the same number
-- may exist at both places. Keep it unique per user per place instead.
alter table public.patients drop constraint patients_user_id_patient_number_key;
alter table public.patients
  add constraint patients_user_facility_number_key unique (user_id, facility, patient_number);

drop index if exists public.patients_user_updated_idx;
create index patients_user_facility_updated_idx on public.patients (user_id, facility, updated_at desc);
