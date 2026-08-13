export const REGISTRATION_STEPS = ['Account', 'Identity', 'Location', 'Wellness', 'Consent'] as const;

export const OCCUPATIONS = [
  'Student',
  'Salaried professional',
  'Self-employed / Business',
  'Healthcare professional',
  'Ayurvedic practitioner',
  'Farmer / Agriculture',
  'Homemaker',
  'Retired',
  'Prefer not to say',
  'Other',
];

// Kept optional throughout the flow, with a decline option always available.
export const RELIGIONS = [
  'Hindu',
  'Muslim',
  'Christian',
  'Sikh',
  'Buddhist',
  'Jain',
  'Parsi',
  'Other',
  'Prefer not to say',
];

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const ALLERGY_OPTIONS = ['Food', 'Herbal', 'Medicine', 'Pollen', 'Dust', 'Other'];

export const CONDITION_OPTIONS = [
  'Diabetes',
  'Hypertension',
  'Thyroid',
  'Asthma',
  'Heart condition',
  'Kidney condition',
  'Liver condition',
  'Digestive disorder',
  'Skin condition',
  'Other',
];

export const TRI_STATE_OPTIONS = [
  { value: 'no' as const, label: 'No' },
  { value: 'yes' as const, label: 'Yes' },
  { value: 'undisclosed' as const, label: 'Prefer not to say' },
];

export const ALLERGY_TRI_STATE = [
  { value: 'no' as const, label: 'No known allergies' },
  { value: 'yes' as const, label: 'Yes' },
  { value: 'undisclosed' as const, label: 'Prefer not to say' },
];

export const CONDITION_TRI_STATE = [
  { value: 'no' as const, label: 'No known conditions' },
  { value: 'yes' as const, label: 'Yes' },
  { value: 'undisclosed' as const, label: 'Prefer not to say' },
];
