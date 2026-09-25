import { Star } from 'lucide-react';

// 1-5 star rating. Pass onChange to make it clickable (admin form); omit it for display.
export default function Stars({ value, onChange, size = 16 }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        const star = <Star size={size} className={`transition-all duration-200 ${on ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />;
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`} className="transition-transform hover:scale-125">{star}</button>
        ) : <span key={n}>{star}</span>;
      })}
    </span>
  );
}
