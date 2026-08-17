/**
 * Field validators for the registration flow.
 *
 * Note on government IDs: these are format/checksum checks only — they confirm a
 * value is well-formed, never that it is genuine. Real verification has to happen
 * server-side against the issuing authority.
 */

export const required = (v: string, field: string): string | undefined =>
  v.trim() ? undefined : `${field} is required`;

export const validateName = (v: string): string | undefined => {
  if (!v.trim()) return 'Full name is required';
  if (v.trim().length < 2) return 'Please enter your full name';
  return undefined;
};

export const validateEmail = (v: string): string | undefined => {
  if (!v.trim()) return 'Email address is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Enter a valid email address';
  return undefined;
};

/** Indian mobile numbers: 10 digits starting 6-9, tolerating +91 / spaces. */
export const validateMobile = (v: string): string | undefined => {
  const digits = v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!digits) return 'Mobile number is required';
  if (digits.length !== 10) return 'Enter a 10-digit mobile number';
  if (!/^[6-9]/.test(digits)) return 'Mobile number must start with 6, 7, 8 or 9';
  return undefined;
};

export const validatePassword = (v: string): string | undefined => {
  if (!v) return 'Password is required';
  if (v.length < 8) return 'Use at least 8 characters';
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Include at least one letter and one number';
  return undefined;
};

export const validateConfirmPassword = (pw: string, confirm: string): string | undefined => {
  if (!confirm) return 'Please re-enter your password';
  if (pw !== confirm) return 'Passwords do not match';
  return undefined;
};

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

export const passwordStrength = (v: string): PasswordStrength => {
  let score = 0;
  if (v.length >= 8) score++;
  if (v.length >= 12) score++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
  if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) score++;
  const labels = ['Too short', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const clamped = Math.min(score, 4) as PasswordStrength['score'];
  return { score: clamped, label: labels[clamped] };
};

/** DOB as DD/MM/YYYY. Registration is 18+. */
/**
 * Auto-inserts the `/` separators as the user types digits — the numeric
 * keypad (keyboardType="number-pad") has no slash key, so typing DD/MM/YYYY
 * manually is otherwise impossible. Recomputed from digits-only each call so
 * backspace/paste both behave correctly regardless of prior formatting.
 */
export const formatDobInput = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const validateDob = (v: string): string | undefined => {
  if (!v.trim()) return 'Date of birth is required';
  const m = v.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return 'Use DD/MM/YYYY format';

  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);

  const d = new Date(year, month - 1, day);
  // Round-trip guards against overflow dates like 31/02/2000.
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return 'Enter a valid date';
  }
  if (d > new Date()) return 'Date of birth cannot be in the future';

  const now = new Date();
  let age = now.getFullYear() - year;
  const beforeBirthday =
    now.getMonth() < month - 1 || (now.getMonth() === month - 1 && now.getDate() < day);
  if (beforeBirthday) age--;
  if (age < 18) return 'You must be 18 or older to register';
  if (age > 120) return 'Enter a valid date of birth';

  return undefined;
};

/** Aadhaar: 12 digits, first digit 2-9, validated with the Verhoeff checksum. */
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const verhoeffValid = (digits: string): boolean => {
  let c = 0;
  const reversed = digits.split('').reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][Number(reversed[i])]];
  }
  return c === 0;
};

export const validateAadhaar = (v: string): string | undefined => {
  const digits = v.replace(/\D/g, '');
  if (!digits) return 'Aadhaar number is required';
  if (digits.length !== 12) return 'Aadhaar must be 12 digits';
  if (/^[01]/.test(digits)) return 'Aadhaar cannot start with 0 or 1';
  if (!verhoeffValid(digits)) return 'This Aadhaar number is not valid';
  return undefined;
};

/** PAN: five letters, four digits, one letter. */
export const validatePan = (v: string): string | undefined => {
  const pan = v.trim().toUpperCase();
  if (!pan) return 'PAN number is required';
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) return 'Enter a valid PAN (e.g. ABCDE1234F)';
  return undefined;
};

/** Formats for display only — never persist the full value. */
export const maskAadhaar = (v: string): string => {
  const digits = v.replace(/\D/g, '');
  if (digits.length !== 12) return v;
  return `XXXX XXXX ${digits.slice(8)}`;
};

export const last4 = (v: string): string => v.replace(/\s/g, '').slice(-4);
