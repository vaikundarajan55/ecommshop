// Loads Razorpay Checkout (https://checkout.razorpay.com/v1/checkout.js) once, on first use
let loading;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => { loading = null; script.remove(); reject(new Error('Could not load Razorpay. Check your internet connection.')); };
    document.body.appendChild(script);
  });
  return loading;
}

// Razorpay test mode sample details - no real money is charged
export const TEST_DETAILS = [
  { label: 'Card (success)', value: '4111 1111 1111 1111', hint: 'Any future expiry, any CVV, OTP 1234 if asked' },
  { label: 'Card (Mastercard)', value: '5267 3181 8797 5449', hint: 'Any future expiry, any CVV' },
  { label: 'UPI (success)', value: 'success@razorpay', hint: 'Enter as the UPI ID' },
  { label: 'UPI (failure)', value: 'failure@razorpay', hint: 'Simulates a failed payment' },
  { label: 'Net banking / Wallet', value: 'Any bank or wallet', hint: 'Click Success or Failure on the test page' },
];
