// Store contact details shown in the footer and on the Contact us page.
// Set these in frontend/.env - the placeholders show until you do.
export const STORE = {
  address: import.meta.env.VITE_STORE_ADDRESS || 'Your store address, Street name, City - 000000',
  phone: import.meta.env.VITE_STORE_PHONE || '+91 00000 00000',
  email: import.meta.env.VITE_STORE_EMAIL || 'support@your-domain.com',
  hours: import.meta.env.VITE_STORE_HOURS || 'Mon - Sat, 9:00 AM - 7:00 PM',
};
