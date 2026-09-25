import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserCircle2, User, Phone, Mail, Save, Loader2, ShieldCheck } from 'lucide-react';
import { notify } from '../../utils/notify';
import { updateProfile } from '../../store/slices/website/siteAuthSlice';
import useSeo from '../../hooks/useSeo';
import AccountLayout from '../../components/website/account/AccountLayout';
import AuthInput from '../../components/common/auth/AuthInput';
import { personNameError, phoneError, clean, normalizePhone } from '../../utils/validators';

export default function Profile() {
  useSeo({ title: 'My profile', noindex: true });
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { if (user) setForm({ name: user.name || '', phone: user.phone || '' }); }, [user]);

  const dirty = user && (form.name !== (user.name || '') || form.phone !== (user.phone || ''));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = Object.fromEntries(Object.entries({ name: personNameError(form.name), phone: phoneError(form.phone) }).filter(([, v]) => v));
    setErrors(found);
    if (Object.keys(found).length) return notify.error(Object.values(found)[0]);
    setSaving(true);
    try {
      await dispatch(updateProfile({ name: clean(form.name), phone: normalizePhone(form.phone) })).unwrap();
      notify.updated('Profile updated successfully');
    } catch (err) {
      setErrors(err.errors || {}); // e.g. mobile number used by another account
      notify.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountLayout icon={UserCircle2} title="Profile" subtitle="Manage your personal details">
      <form onSubmit={handleSubmit} className="animate-fadeInUp overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 px-5 py-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow"><User size={19} /></span>
          <div>
            <h2 className="font-semibold text-gray-900">Personal information</h2>
            <p className="text-xs text-gray-500">This is used on your orders and invoices</p>
          </div>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthInput label="Full name" icon={User} required autoComplete="name" delay={80}
              maxLength={60} error={errors.name}
              value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }); }} />
            <AuthInput label="Mobile number" icon={Phone} type="tel" required autoComplete="tel" delay={140} inputMode="numeric" maxLength={15}
              error={errors.phone} hint="One account per mobile number"
              value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: '' }); }} />
          </div>
          <AuthInput label="Email" icon={Mail} type="email" disabled value={user?.email || ''} delay={200} hint="Email can't be changed" />
          <p className="flex animate-fadeIn items-center gap-1.5 text-xs text-gray-400" style={{ animationDelay: '260ms' }}>
            <ShieldCheck size={14} className="text-emerald-500" /> Your details are only used to deliver your orders.
          </p>
        </div>
        <div className="flex justify-end border-t border-gray-100 px-5 py-4 sm:px-6">
          <button disabled={saving || !dirty} className="flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </AccountLayout>
  );
}
