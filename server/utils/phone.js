export function normalizeIndianPhone(input) {
  let digits = String(input ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

export function validateIndianPhone(input) {
  const digits = normalizeIndianPhone(input);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error(
      'Enter a valid 10-digit Indian mobile number (e.g. 9876543210).'
    );
  }
  return digits;
}
