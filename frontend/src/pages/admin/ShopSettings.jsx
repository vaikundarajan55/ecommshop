import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Loader2, Save, Store, Phone, MapPin, Share2, Receipt, Eye, Mail, Clock, ShoppingBag, ExternalLink,
  Facebook, Instagram, Twitter, Youtube, MessageCircle,
} from 'lucide-react';
import { SHOP_FIELDS as FIELDS, fetchShopSettings, updateShopSettings } from '../../store/slices/admin/shopSettingsSlice';
import { notify } from '../../utils/notify';
import { imageUrl } from '../../utils/imageUrl';
import { setShop } from '../../store/slices/website/cmsSlice';
import ImageUpload from '../../components/admin/common/ImageUpload';

const inputCls = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

function Section({ title, icon: Icon, delay, children }) {
  return (
    <section className="animate-fadeInUp rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100" style={{ animationDelay: `${delay}ms` }}>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 text-white"><Icon size={15} /></span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, hint, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-gray-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

// Shop details are one record: this screen only edits it (no add / delete)
export default function ShopSettings() {
  const dispatch = useDispatch();
  const { data: saved, saving } = useSelector((state) => state.shopSettings);
  const [form, setForm] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => { dispatch(fetchShopSettings()).unwrap().catch(notify.error); }, [dispatch]);

  // Refill the form whenever the stored record changes (after loading and after each save)
  useEffect(() => {
    if (!saved) return;
    setForm({ ...Object.fromEntries(FIELDS.map((k) => [k, saved[k] || ''])), logo: null, existingLogo: saved.logo });
  }, [saved]);

  const pickedLogo = form?.logo;
  useEffect(() => {
    if (!pickedLogo) { setLogoPreview(null); return undefined; }
    const url = URL.createObjectURL(pickedLogo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pickedLogo]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const dirty = form && saved && (FIELDS.some((k) => form[k] !== (saved[k] || '')) || !!form.logo);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const shop = await dispatch(updateShopSettings(form)).unwrap();
      dispatch(setShop(shop)); // website header/footer pick it up right away
      notify.updated('Shop details updated successfully');
    } catch (message) {
      notify.error(message);
    }
  };

  if (!form) return <div className="flex h-64 items-center justify-center text-gray-400"><Loader2 className="animate-spin" size={28} /></div>;

  const logoSrc = logoPreview || imageUrl(form.existingLogo);
  const address = [form.address_line, form.city, form.state, form.pincode].filter(Boolean).join(', ');
  const socials = [[Facebook, form.facebook_url], [Instagram, form.instagram_url], [Twitter, form.twitter_url], [Youtube, form.youtube_url], [MessageCircle, form.whatsapp]].filter(([, v]) => v);

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Contact Us</h2>
          <p className="text-sm text-gray-500">
            Shop name, logo and contact details used across the website and on invoices
            {saved?.updated_at ? ` · last updated ${new Date(saved.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/contact" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ExternalLink size={15} /> View page
          </a>
          <button disabled={saving || !dirty} className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Saving...' : 'Update'}
          </button>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Section title="Shop & logo" icon={Store} delay={0}>
            <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
              <div>
                <span className="mb-1 block text-sm font-medium text-gray-600">Logo</span>
                <ImageUpload file={form.logo} existing={form.existingLogo} onChange={(file) => setForm((f) => ({ ...f, logo: file }))} height="h-36" />
                <span className="mt-1 block text-xs text-gray-400">Square PNG/JPG works best (also printed on invoices)</span>
              </div>
              <div className="space-y-4">
                <Field label="Shop name"><input required maxLength={120} value={form.shop_name} onChange={set('shop_name')} className={inputCls} /></Field>
                <Field label="Tagline"><input maxLength={160} value={form.tagline} onChange={set('tagline')} className={inputCls} placeholder="Everyday essentials, delivered fast" /></Field>
                <Field label="Short description" hint="Shown in the website footer">
                  <textarea rows={3} maxLength={500} value={form.description} onChange={set('description')} className={inputCls} />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Contact" icon={Phone} delay={80}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email"><input type="email" maxLength={150} value={form.email} onChange={set('email')} className={inputCls} placeholder="support@yourshop.com" /></Field>
              <Field label="Mobile"><input type="tel" maxLength={20} value={form.mobile} onChange={set('mobile')} className={inputCls} placeholder="+91 98765 43210" /></Field>
              <Field label="Alternate phone"><input type="tel" maxLength={20} value={form.alt_phone} onChange={set('alt_phone')} className={inputCls} /></Field>
              <Field label="WhatsApp number" hint="With country code, e.g. 919876543210"><input maxLength={20} value={form.whatsapp} onChange={set('whatsapp')} className={inputCls} /></Field>
              <Field label="Opening hours" className="sm:col-span-2"><input maxLength={120} value={form.opening_hours} onChange={set('opening_hours')} className={inputCls} placeholder="Mon - Sat, 9:00 AM - 7:00 PM" /></Field>
            </div>
          </Section>

          <Section title="Address" icon={MapPin} delay={160}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Address line" className="sm:col-span-2"><input maxLength={255} value={form.address_line} onChange={set('address_line')} className={inputCls} placeholder="Door no, street, area" /></Field>
              <Field label="City"><input maxLength={80} value={form.city} onChange={set('city')} className={inputCls} /></Field>
              <Field label="State"><input maxLength={80} value={form.state} onChange={set('state')} className={inputCls} /></Field>
              <Field label="Pincode"><input maxLength={12} value={form.pincode} onChange={set('pincode')} className={inputCls} /></Field>
              <Field label="Country"><input maxLength={80} value={form.country} onChange={set('country')} className={inputCls} /></Field>
              <Field label="Google Maps link" hint="Share link from Google Maps - shows a 'Get directions' button" className="sm:col-span-2">
                <input maxLength={500} value={form.map_url} onChange={set('map_url')} className={inputCls} placeholder="https://maps.google.com/..." />
              </Field>
            </div>
          </Section>

          <Section title="Business & social" icon={Share2} delay={240}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="GSTIN" hint="Printed on invoices"><input maxLength={20} value={form.gstin} onChange={set('gstin')} className={`${inputCls} uppercase`} /></Field>
              <div />
              <Field label="Facebook"><input value={form.facebook_url} onChange={set('facebook_url')} className={inputCls} placeholder="https://facebook.com/yourshop" /></Field>
              <Field label="Instagram"><input value={form.instagram_url} onChange={set('instagram_url')} className={inputCls} placeholder="https://instagram.com/yourshop" /></Field>
              <Field label="X (Twitter)"><input value={form.twitter_url} onChange={set('twitter_url')} className={inputCls} placeholder="https://x.com/yourshop" /></Field>
              <Field label="YouTube"><input value={form.youtube_url} onChange={set('youtube_url')} className={inputCls} placeholder="https://youtube.com/@yourshop" /></Field>
            </div>
          </Section>
        </div>

        {/* Live preview - roughly how the website footer / contact card shows it */}
        <aside className="animate-slideInRight overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100 xl:sticky xl:top-24">
          <p className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400"><Eye size={14} /> Preview</p>
          <div className="bg-gray-950 p-5 text-gray-400">
            <div className="flex items-center gap-3">
              {logoSrc
                ? <img key={logoSrc} src={logoSrc} alt="" className="h-12 w-12 animate-pop rounded-xl bg-white object-contain p-1" />
                : <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white"><ShoppingBag size={22} /></span>}
              <div className="min-w-0">
                <p className="truncate bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-lg font-extrabold text-transparent">{form.shop_name || 'Shop name'}</p>
                {form.tagline && <p className="truncate text-xs">{form.tagline}</p>}
              </div>
            </div>
            {form.description && <p className="mt-3 line-clamp-3 text-xs leading-relaxed">{form.description}</p>}
            <ul className="mt-4 space-y-2 text-xs">
              {address && <li className="flex gap-2"><MapPin size={14} className="shrink-0 text-orange-500" />{address}{form.country ? `, ${form.country}` : ''}</li>}
              {form.mobile && <li className="flex gap-2"><Phone size={14} className="shrink-0 text-orange-500" />{form.mobile}{form.alt_phone ? ` / ${form.alt_phone}` : ''}</li>}
              {form.email && <li className="flex gap-2"><Mail size={14} className="shrink-0 text-orange-500" />{form.email}</li>}
              {form.opening_hours && <li className="flex gap-2"><Clock size={14} className="shrink-0 text-orange-500" />{form.opening_hours}</li>}
              {form.gstin && <li className="flex gap-2"><Receipt size={14} className="shrink-0 text-orange-500" />GSTIN {form.gstin.toUpperCase()}</li>}
            </ul>
            {socials.length > 0 && (
              <div className="mt-4 flex gap-2">
                {socials.map(([Icon], i) => (
                  <span key={i} className="flex h-8 w-8 animate-scaleIn items-center justify-center rounded-full bg-white/10 text-gray-300" style={{ animationDelay: `${i * 60}ms` }}><Icon size={14} /></span>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
