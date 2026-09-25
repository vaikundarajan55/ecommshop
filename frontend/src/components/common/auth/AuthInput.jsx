import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const INPUT_FOCUS = {
  brand: 'focus:border-brand-500 focus:ring-brand-500/20',
  primary: 'focus:border-primary-500 focus:ring-primary-500/20',
};
const ICON_FOCUS = {
  brand: 'group-focus-within:text-brand-600',
  primary: 'group-focus-within:text-primary-600',
};

// Labelled input with a leading icon; type="password" gets a show/hide toggle.
// `accent` picks the focus colour: 'brand' (website, orange) or 'primary' (admin, indigo).
export default function AuthInput({ label, icon: Icon, type = 'text', accent = 'brand', delay = 0, hint, error, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputFocus = INPUT_FOCUS[accent];
  const iconFocus = ICON_FOCUS[accent];

  return (
    <label className="block animate-fadeInUp" style={{ animationDelay: `${delay}ms` }}>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <span className="group relative block">
        {Icon && <Icon size={17} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors ${iconFocus}`} />}
        <input
          type={isPassword && show ? 'text' : type}
          className={`w-full rounded-lg border bg-white/90 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-4 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${inputFocus} ${
            Icon ? 'pl-10' : 'pl-3'
          } ${isPassword ? 'pr-10' : 'pr-3'} ${error ? 'border-red-400' : 'border-gray-300'}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700"
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
      {error ? (
        <span className="mt-1 block animate-fadeIn text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-gray-400">{hint}</span>
      ) : null}
    </label>
  );
}
