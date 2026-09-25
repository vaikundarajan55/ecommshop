import { Check, ShoppingCart, MapPin, CreditCard, PartyPopper } from 'lucide-react';

const STEPS = [
  { label: 'Cart', icon: ShoppingCart },
  { label: 'Address', icon: MapPin },
  { label: 'Payment', icon: CreditCard },
  { label: 'Done', icon: PartyPopper },
];

// Progress tracker shown in the hero of cart / checkout / payment / success. `current` is 0-3.
export default function CheckoutSteps({ current }) {
  return (
    <ol className="flex items-center" aria-label="Checkout progress">
      {STEPS.map(({ label, icon: Icon }, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ring-2 transition-all duration-500 sm:h-10 sm:w-10 ${
                  done ? 'bg-white text-emerald-600 ring-white' : active ? 'animate-pop bg-white/25 text-white ring-white' : 'bg-white/10 text-white/60 ring-white/30'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check size={18} strokeWidth={3} /> : <Icon size={17} />}
              </span>
              <span className={`text-[11px] font-medium sm:text-xs ${active || done ? 'text-white' : 'text-white/60'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="mx-1 mb-5 h-0.5 flex-1 overflow-hidden rounded-full bg-white/25 sm:mx-2">
                <span className={`block h-full origin-left bg-white transition-transform duration-700 ${done ? 'scale-x-100' : 'scale-x-0'}`} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
