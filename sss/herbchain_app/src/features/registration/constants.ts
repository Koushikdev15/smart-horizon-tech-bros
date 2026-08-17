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

export const MEDICAL_HISTORY_OPTIONS = [
  'Past surgery',
  'Hospitalization',
  'Chronic illness',
  'Family history of disease',
  'Known drug allergy',
  'None significant',
  'Other',
];

export const CURRENT_MEDICATION_OPTIONS = [
  'Blood pressure medication',
  'Diabetes medication',
  'Thyroid medication',
  'Blood thinners',
  'Painkillers',
  'Antidepressants / Anti-anxiety',
  'Vitamins / Supplements',
  'None',
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

// ─────────────────────────── Health Profile (post-registration) ───────────────────────────

export const PREGNANCY_STATUS_OPTIONS = [
  { value: 'not_applicable' as const, label: 'Not applicable' },
  { value: 'pregnant' as const, label: 'Pregnant' },
  { value: 'breastfeeding' as const, label: 'Breastfeeding' },
  { value: 'planning' as const, label: 'Planning pregnancy' },
  { value: 'undisclosed' as const, label: 'Prefer not to say' },
];

export const DIETARY_PREFERENCE_OPTIONS = [
  'Vegetarian', 'Vegan', 'Non-vegetarian', 'Jain', 'Gluten-free', 'Low-sugar', 'Low-sodium',
];

export const AYURVEDIC_PREFERENCE_OPTIONS = [
  'Prefer Ayurvedic products first', 'Open to Ayurvedic + conventional', 'New to Ayurveda', 'Following a Vaidya-prescribed regimen',
];

// Common Ayurvedic ingredients, used for structured ingredient-level allergy
// matching against Product.ingredients (distinct from the general allergy
// categories above, which are broad tags like "Herbal" or "Food").
export const COMMON_AYURVEDIC_INGREDIENTS = [
  'Amla', 'Haritaki', 'Bibhitaki', 'Ashwagandha', 'Neem', 'Turmeric', 'Guggul',
  'Shatavari', 'Brahmi', 'Licorice', 'Tulsi', 'Triphala', 'Giloy', 'Sandalwood',
];
