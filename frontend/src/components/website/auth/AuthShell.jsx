import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, ShieldCheck, Sparkles } from 'lucide-react';
import Bubbles from '../../common/Bubbles';

// Website auth layout: animated brand panel (tablet/desktop) + form card.
// On phones the panel collapses into a compact header above the form.
export default function AuthShell({ icon: Icon = ShoppingBag, title, subtitle, children, footer, panelTitle, panelText }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-rose-50">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-8 sm:py-12 lg:grid-cols-2 lg:gap-12">
        {/* ---- Brand panel ---- */}
        <aside className="relative hidden h-full min-h-[520px] animate-slideInLeft overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-rose-500 to-amber-500 bg-[length:200%_200%] p-10 text-white shadow-2xl lg:flex lg:animate-gradient lg:flex-col lg:justify-between">
          <Bubbles />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold">
              <ShoppingBag size={24} /> ShopEase
            </Link>
          </div>
          <div className="relative">
            <h2 className="animate-fadeInUp text-4xl font-extrabold leading-tight" style={{ animationDelay: '150ms' }}>
              {panelTitle || 'Shopping made simple.'}
            </h2>
            <p className="mt-3 max-w-sm animate-fadeInUp text-white/85" style={{ animationDelay: '250ms' }}>
              {panelText || 'Thousands of products, secure checkout and live order tracking - all in one place.'}
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                [Truck, 'Live order tracking'],
                [ShieldCheck, 'Secure payments'],
                [Sparkles, 'Fresh deals every week'],
              ].map(([I, t], i) => (
                <li key={t} className="flex animate-slideInLeft items-center gap-3" style={{ animationDelay: `${350 + i * 100}ms` }}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><I size={16} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-xs text-white/70">© {new Date().getFullYear()} ShopEase</p>
        </aside>

        {/* ---- Form card ---- */}
        <div className="mx-auto w-full max-w-md">
          <div className="animate-scaleIn rounded-2xl border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <div className="mb-6 text-center">
              <span className="mx-auto flex h-14 w-14 animate-pop items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-rose-500 text-white shadow-lg shadow-brand-500/30">
                <Icon size={26} />
              </span>
              <h1 className="mt-4 animate-fadeInDown text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="mt-1 animate-fadeIn text-sm text-gray-500">{subtitle}</p>}
            </div>
            {children}
          </div>
          {footer && <div className="mt-5 animate-fadeIn text-center text-sm text-gray-600" style={{ animationDelay: '400ms' }}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}
