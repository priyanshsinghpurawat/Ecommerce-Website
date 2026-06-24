/** Default shipping for checkout — profile addresses override these when set */
export const DEFAULT_SHIPPING = {
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India'
};

/** Tap-to-apply coupons (must exist in DB — run `npm run seed`) */
export const SUGGESTED_COUPONS = [
  { code: 'WELCOME50', label: '₹50 off', hint: 'First Order' },
  { code: 'MENSVIBE10', label: '10% off', hint: 'Min ₹499' },
  { code: 'FESTIVE500', label: '₹500 off', hint: 'Min ₹2499' }
];
