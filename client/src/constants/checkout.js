/** Default shipping for checkout (Jaipur) — profile fields override when set */
export const DEFAULT_SHIPPING = {
  fullName: '',
  phone: '',
  street: 'Malviya Nagar, Near GT Bazaar',
  city: 'Jaipur',
  state: 'Rajasthan',
  zipCode: '302017',
  country: 'India'
};

/** Tap-to-apply coupons (must exist in DB — run `npm run seed`) */
export const SUGGESTED_COUPONS = [
  { code: 'WELCOME50', label: '₹50 off', hint: 'First Order' },
  { code: 'MENSVIBE10', label: '10% off', hint: 'Min ₹499' },
  { code: 'FESTIVE500', label: '₹500 off', hint: 'Min ₹2499' }
];
