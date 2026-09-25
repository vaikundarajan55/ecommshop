// 4-segment strength bar under a new-password field
export const MIN_PASSWORD = 6;

const score = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= MIN_PASSWORD) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return pw.length < MIN_PASSWORD ? Math.min(s, 1) : Math.max(s, 1);
};

const LEVELS = [
  { label: 'Too short', color: 'bg-red-500', text: 'text-red-600' },
  { label: 'Weak', color: 'bg-orange-500', text: 'text-orange-600' },
  { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-600' },
  { label: 'Good', color: 'bg-lime-500', text: 'text-lime-700' },
  { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' },
];

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const s = score(password);
  const level = password.length < MIN_PASSWORD ? LEVELS[0] : LEVELS[s];
  return (
    <div className="mt-2 animate-fadeIn">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
            <span className={`block h-full rounded-full transition-all duration-500 ${level.color} ${i <= s ? 'w-full' : 'w-0'}`} />
          </span>
        ))}
      </div>
      <p className={`mt-1 text-xs font-medium ${level.text}`}>
        {level.label}
        {password.length < MIN_PASSWORD && <span className="font-normal text-gray-400"> · at least {MIN_PASSWORD} characters</span>}
      </p>
    </div>
  );
}
