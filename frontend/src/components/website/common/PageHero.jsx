import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Each page gets its own gradient; the gradient slowly drifts (animate-gradient)
export const THEMES = {
  about: 'from-violet-600 via-purple-500 to-fuchsia-500',
  products: 'from-sky-500 via-blue-500 to-indigo-600',
  product: 'from-teal-500 via-cyan-500 to-sky-500',
  cart: 'from-amber-500 via-orange-500 to-rose-500',
  checkout: 'from-emerald-500 via-teal-500 to-cyan-600',
  payment: 'from-indigo-600 via-blue-600 to-sky-500',
  success: 'from-green-500 via-emerald-500 to-teal-500',
  failure: 'from-rose-500 via-red-500 to-orange-500',
  profile: 'from-cyan-500 via-sky-500 to-blue-600',
  account: 'from-orange-500 via-rose-500 to-fuchsia-600',
  contact: 'from-teal-500 via-emerald-500 to-lime-500',
};

// Floating translucent circles behind the hero text
const ORBS = [
  'left-[6%] top-6 h-24 w-24 [animation-delay:-1s]',
  'right-[10%] top-10 h-16 w-16 [animation-delay:-2.5s]',
  'right-[28%] -bottom-6 h-28 w-28 [animation-delay:-4s]',
  'left-[35%] -top-8 h-20 w-20 [animation-delay:-3s]',
];

export default function PageHero({ theme, icon: Icon, title, subtitle, crumbs = [], children, compact = false }) {
  return (
    <section className={`relative animate-gradient overflow-hidden bg-gradient-to-br ${THEMES[theme]} bg-[length:200%_200%] text-white`}>
      {ORBS.map((cls, i) => (
        <span key={i} aria-hidden="true" className={`pointer-events-none absolute animate-float rounded-full bg-white/10 ring-1 ring-white/20 ${cls}`} />
      ))}
      <div className={`relative mx-auto max-w-6xl px-4 ${compact ? 'py-6' : 'py-10 sm:py-14'}`}>
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-3 animate-fadeInDown">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-white/80">
              <li><Link to="/" className="hover:text-white hover:underline">Home</Link></li>
              {crumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-1">
                  <ChevronRight size={12} />
                  {c.to ? <Link to={c.to} className="hover:text-white hover:underline">{c.label}</Link> : <span aria-current="page" className="text-white">{c.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex items-center gap-4">
          {Icon && (
            <span className="flex h-12 w-12 shrink-0 animate-pop items-center justify-center rounded-2xl bg-white/20 shadow-lg ring-1 ring-white/30 backdrop-blur sm:h-14 sm:w-14">
              <Icon size={26} />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="animate-fadeInUp text-2xl font-extrabold drop-shadow-sm sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-1 animate-fadeInUp text-sm text-white/85 sm:text-base" style={{ animationDelay: '100ms' }}>{subtitle}</p>}
          </div>
        </div>
        {children && <div className="mt-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>{children}</div>}
      </div>
      {/* soft wave into the page */}
      <svg aria-hidden="true" viewBox="0 0 1440 40" preserveAspectRatio="none" className="absolute -bottom-px left-0 h-6 w-full text-gray-50 sm:h-8">
        <path fill="currentColor" d="M0 40V20C240 0 480 0 720 16s480 24 720 4v20z" />
      </svg>
    </section>
  );
}
