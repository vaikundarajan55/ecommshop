import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ShoppingBag, MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, Youtube, MessageCircle, ChevronRight, Truck, ShieldCheck, RotateCcw,
} from 'lucide-react';
import useReveal from '../../../hooks/useReveal';
import useShop, { fullAddress } from '../../../hooks/useShop';
import { imageUrl } from '../../../utils/imageUrl';

// Only networks with a link set in Admin > Home > Contact Us are shown
const socialLinks = (shop) => [
  { icon: Facebook, label: 'Facebook', href: shop.facebook_url },
  { icon: Instagram, label: 'Instagram', href: shop.instagram_url },
  { icon: Twitter, label: 'X (Twitter)', href: shop.twitter_url },
  { icon: Youtube, label: 'YouTube', href: shop.youtube_url },
  { icon: MessageCircle, label: 'WhatsApp', href: shop.whatsapp && `https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}` },
].filter((s) => s.href);

const COMPANY = [
  ['/about', 'About us'],
  ['/contact', 'Contact us'],
  ['/products', 'All products'],
  ['/cart', 'Shopping cart'],
  ['/', 'Home'],
];

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="group inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white">
        <ChevronRight size={14} className="-ml-1 text-orange-500 opacity-0 transition-all duration-300 group-hover:ml-0 group-hover:opacity-100" />
        <span className="transition-transform duration-300 group-hover:translate-x-0.5">{children}</span>
      </Link>
    </li>
  );
}

function Column({ title, delay, visible, children }) {
  return (
    <div className={`transition-all duration-700 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`} style={{ transitionDelay: `${delay}ms` }}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
        {title}
        <span className="mt-2 block h-0.5 w-8 rounded-full bg-gradient-to-r from-orange-500 to-rose-500" />
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function Footer() {
  const user = useSelector((s) => s.auth.user);
  const [ref, visible] = useReveal({ threshold: 0.1 });
  const shop = useShop();
  const SOCIAL = socialLinks(shop);
  const phones = [shop.mobile, shop.alt_phone].filter(Boolean);

  const account = user
    ? [['/dashboard', 'Dashboard'], ['/my-orders', 'My orders'], ['/profile', 'Profile'], ['/change-password', 'Change password']]
    : [['/login', 'Login'], ['/register', 'Create account'], ['/forgot-password', 'Forgot password'], ['/my-orders', 'Track my order']];

  return (
    <footer ref={ref} className="relative mt-16 overflow-hidden bg-gray-950 text-gray-400">
      {/* animated gradient top edge */}
      <span className="absolute inset-x-0 top-0 h-1 animate-gradient bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 bg-[length:200%_200%]" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

      {/* Perks strip */}
      <div className="relative border-b border-white/10">
        <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-3">
          {[[Truck, 'Fast delivery', 'Live order tracking'], [ShieldCheck, 'Secure payments', 'COD, UPI, cards & more'], [RotateCcw, 'Easy returns', 'Hassle-free support']].map(([Icon, t, s], i) => (
            <li key={t} className={`flex items-center gap-3 transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: `${i * 100}ms` }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg shadow-rose-500/20"><Icon size={19} /></span>
              <span><span className="block text-sm font-semibold text-white">{t}</span><span className="block text-xs">{s}</span></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        {/* 1. Logo + content */}
        <div className={`transition-all duration-700 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
          <Link to="/" className="group inline-flex items-center gap-2" aria-label={`${shop.shop_name} home`}>
            {shop.logo ? (
              <img src={imageUrl(shop.logo)} alt="" className="h-11 w-11 rounded-xl bg-white object-contain p-1 shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg shadow-rose-500/30 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                <ShoppingBag size={22} />
              </span>
            )}
            <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-2xl font-extrabold text-transparent">{shop.shop_name}</span>
          </Link>
          {shop.tagline && <p className="mt-2 text-xs font-medium uppercase tracking-wider text-orange-400/80">{shop.tagline}</p>}
          {shop.description && <p className="mt-3 max-w-xs text-sm leading-relaxed">{shop.description}</p>}
          {SOCIAL.length > 0 && (
            <ul className="mt-5 flex gap-2">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noreferrer" aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-300 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-orange-500 hover:to-rose-500 hover:text-white hover:ring-transparent">
                    <Icon size={16} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 2. Account */}
        <Column title="Account" delay={100} visible={visible}>
          <nav aria-label="Account"><ul className="space-y-2.5">{account.map(([to, l]) => <FooterLink key={to + l} to={to}>{l}</FooterLink>)}</ul></nav>
        </Column>

        {/* 3. Company */}
        <Column title="Company" delay={200} visible={visible}>
          <nav aria-label="Company"><ul className="space-y-2.5">{COMPANY.map(([to, l]) => <FooterLink key={to + l} to={to}>{l}</FooterLink>)}</ul></nav>
        </Column>

        {/* 4. Address */}
        <Column title="Address" delay={300} visible={visible}>
          <address className="space-y-3 text-sm not-italic">
            {fullAddress(shop) && (
              <p className="flex gap-3"><MapPin size={17} className="mt-0.5 shrink-0 text-orange-500" />
                <span>{fullAddress(shop)}{shop.country ? `, ${shop.country}` : ''}
                  {shop.map_url && <a href={shop.map_url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs font-medium text-orange-400 hover:text-orange-300">Get directions →</a>}
                </span></p>
            )}
            {phones.length > 0 && (
              <p className="flex gap-3"><Phone size={17} className="mt-0.5 shrink-0 text-orange-500" />
                <span className="flex flex-col">{phones.map((p) => <a key={p} href={`tel:${p.replace(/\s+/g, '')}`} className="transition-colors hover:text-white">{p}</a>)}</span></p>
            )}
            {shop.email && (
              <p className="flex gap-3"><Mail size={17} className="mt-0.5 shrink-0 text-orange-500" />
                <a href={`mailto:${shop.email}`} className="break-all transition-colors hover:text-white">{shop.email}</a></p>
            )}
            {shop.opening_hours && <p className="flex gap-3"><Clock size={17} className="mt-0.5 shrink-0 text-orange-500" /><span>{shop.opening_hours}</span></p>}
          </address>
        </Column>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} {shop.shop_name}. All rights reserved.{shop.gstin ? ` · GSTIN ${shop.gstin}` : ''}</p>
          <p className="flex items-center gap-1.5">
            Secure payments with <span className="rounded bg-white/10 px-1.5 py-0.5 font-medium text-gray-300">COD</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-medium text-gray-300">UPI</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-medium text-gray-300">Cards</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
