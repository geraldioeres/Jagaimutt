export type Facility = 'rs_uns' | 'klinik';

export const FACILITIES: { key: Facility; label: string }[] = [
  { key: 'rs_uns', label: 'RS UNS' },
  { key: 'klinik', label: 'Klinik' },
];

export function facilityLabel(f: Facility) {
  return FACILITIES.find((x) => x.key === f)?.label ?? f;
}

export type Patient = {
  id: string;
  name: string;
  patient_number: string;
  facility: Facility;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  patient_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};
