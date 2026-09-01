export const PHONE_NUMBER_MAX_LENGTH = 10;
export const PHONE_NUMBER_INPUT_MAX_LENGTH = '(000) 000-0000'.length;

export const normalizePhoneDigits = (value) =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, PHONE_NUMBER_MAX_LENGTH);

export const formatUSPhoneInput = (value) => {
  const digits = normalizePhoneDigits(value);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const isValidUSPhone = (value) =>
  normalizePhoneDigits(value).length === PHONE_NUMBER_MAX_LENGTH;
