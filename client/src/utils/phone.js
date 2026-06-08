/** Strip spaces/dashes; handle +91 prefix */
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

/** Valid Indian mobile: 10 digits, starts with 6–9 */
export function validateIndianPhone(input) {
  const digits = normalizeIndianPhone(input);
  if (!digits) {
    return { valid: false, message: 'Phone number is required.' };
  }
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      valid: false,
      message: 'Enter a valid 10-digit mobile number (e.g. 9876543210).'
    };
  }
  return { valid: true, digits };
}
