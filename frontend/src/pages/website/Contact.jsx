import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Phone, MapPin, Clock, User, Send, Loader2, MessageSquare, CheckCircle2, Tag, Navigation, MessageCircle } from 'lucide-react';
import { sendContactMessage } from '../../store/slices/website/cmsSlice';
import { notify } from '../../utils/notify';
import useShop, { fullAddress } from '../../hooks/useShop';
import useSeo from '../../hooks/useSeo';
import PageHero from '../../components/website/common/PageHero';
import AuthInput from '../../components/common/auth/AuthInput';

const tel = (p) => `tel:${String(p).replace(/\s+/g, '')}`;

// Cards built from Admin > Home > Contact Us; empty fields are left out
const infoCards = (shop) => [
  { icon: MapPin, title: 'Visit us', value: [fullAddress(shop), shop.country].filter(Boolean).join(', '), href: shop.map_url, external: true, color: 'from-teal-500 to-emerald-500' },
  { icon: Phone, title: 'Call us', value: [shop.mobile, shop.alt_phone].filter(Boolean).join(' / '), href: shop.mobile && tel(shop.mobile), color: 'from-emerald-500 to-lime-500' },
  { icon: Mail, title: 'Email us', value: shop.email, href: shop.email && `mailto:${shop.email}`, color: 'from-sky-500 to-teal-500' },
  { icon: Clock, title: 'Opening hours', value: shop.opening_hours, color: 'from-lime-500 to-green-600' },
].filter((c) => c.value);

export default function Contact() {
  const shop = useShop();
  const INFO = infoCards(shop);
  useSeo({
    title: 'Contact us',
    description: `Get in touch with ${shop.shop_name}${shop.mobile ? ` - call ${shop.mobile}` : ''}${shop.email ? `, email ${shop.email}` : ''} or send us a message.`,
  });
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const blank = { name: user?.name || '', email: user?.email || '', phone: user?.phone || '', subject: '', message: '' };
  const [form, setForm] = useState(blank);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const message = await dispatch(sendContactMessage(form)).unwrap();
      notify.success(message);
      setSent(true);
      setForm(blank);
    } catch (err) {
      notify.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHero theme="contact" icon={MessageSquare} title="Contact us" subtitle="Questions about an order or a product? We're happy to help." crumbs={[{ label: 'Contact us' }]} />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Info cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INFO.map(({ icon: Icon, title, value, href, external, color }, i) => {
            const Wrapper = href ? 'a' : 'div';
            return (
              <Wrapper
                key={title} href={href} {...(href && external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="group animate-fadeInUp rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:ring-teal-200"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
                  <Icon size={22} />
                </span>
                <p className="mt-4 text-sm font-semibold text-gray-900">{title}</p>
                <p className="mt-0.5 break-words text-sm text-gray-500 group-hover:text-teal-700">{value}</p>
              </Wrapper>
            );
          })}
        </div>

        {/* Form */}
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-5">
          <div className="animate-slideInLeft lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Send us a <span className="bg-gradient-to-r from-teal-600 to-lime-500 bg-clip-text text-transparent">message</span>
            </h2>
            <p className="mt-3 leading-relaxed text-gray-600">
              Fill in the form and our team will get back to you by email, usually within one working day.
              For order questions, include your order number so we can help faster.
            </p>
            {(shop.map_url || shop.whatsapp) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {shop.map_url && (
                  <a href={shop.map_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105">
                    <Navigation size={15} /> Get directions
                  </a>
                )}
                {shop.whatsapp && (
                  <a href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105">
                    <MessageCircle size={15} /> Chat on WhatsApp
                  </a>
                )}
              </div>
            )}
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              {['Order and delivery questions', 'Returns and refunds', 'Product information', 'Feedback and suggestions'].map((t, i) => (
                <li key={t} className="flex animate-fadeInUp items-center gap-2" style={{ animationDelay: `${300 + i * 70}ms` }}>
                  <CheckCircle2 size={17} className="text-emerald-500" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            {sent ? (
              <div className="flex animate-scaleIn flex-col items-center rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
                <span className="relative flex h-20 w-20 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-200/60" />
                  <span className="relative flex h-20 w-20 animate-pop items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-lime-500 text-white shadow-lg">
                    <Send size={34} />
                  </span>
                </span>
                <h3 className="mt-5 text-xl font-bold text-gray-900">Message sent!</h3>
                <p className="mt-1 text-sm text-gray-500">Thanks for reaching out. We&apos;ll reply to your email soon.</p>
                <button onClick={() => setSent(false)} className="mt-5 text-sm font-medium text-teal-600 hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="animate-fadeInUp space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-7" style={{ animationDelay: '150ms' }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <AuthInput label="Your name" icon={User} required maxLength={120} autoComplete="name" delay={200} value={form.name} onChange={set('name')} />
                  <AuthInput label="Email" icon={Mail} type="email" required maxLength={150} autoComplete="email" delay={260} value={form.email} onChange={set('email')} />
                  <AuthInput label="Phone (optional)" icon={Phone} type="tel" maxLength={20} autoComplete="tel" delay={320} value={form.phone} onChange={set('phone')} />
                  <AuthInput label="Subject" icon={Tag} required maxLength={150} delay={380} placeholder="e.g. Question about my order" value={form.subject} onChange={set('subject')} />
                </div>
                <label className="block animate-fadeInUp" style={{ animationDelay: '440ms' }}>
                  <span className="mb-1 flex justify-between text-sm font-medium text-gray-700">
                    Message <span className="font-normal text-gray-400">{form.message.length}/2000</span>
                  </span>
                  <textarea
                    required minLength={10} maxLength={2000} rows={5} value={form.message} onChange={set('message')}
                    placeholder="How can we help?"
                    className="w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20"
                  />
                </label>
                <button disabled={sending} className="flex w-full animate-fadeInUp items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-70 sm:w-auto sm:px-8" style={{ animationDelay: '500ms' }}>
                  {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                  {sending ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
