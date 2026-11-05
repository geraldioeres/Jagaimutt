export type Patient = {
  id: string;
  name: string;
  patient_number: string;
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

