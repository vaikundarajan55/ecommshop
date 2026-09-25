import { Banknote, Smartphone, CreditCard, Landmark, Wallet } from 'lucide-react';

// Look of each payment method (by payment_methods.code); names, order, on/off and default come from the database
export const METHOD_STYLE = {
  cod: { icon: Banknote, color: 'from-emerald-500 to-teal-500' },
  upi: { icon: Smartphone, color: 'from-violet-500 to-fuchsia-500' },
  card: { icon: CreditCard, color: 'from-blue-500 to-indigo-600' },
  netbanking: { icon: Landmark, color: 'from-amber-500 to-orange-500' },
  wallet: { icon: Wallet, color: 'from-pink-500 to-rose-500' },
};

export const methodStyle = (code) => METHOD_STYLE[code] || METHOD_STYLE.card;
