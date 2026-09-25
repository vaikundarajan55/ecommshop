import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { KeyRound, Lock, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { notify } from '../../utils/notify';
import { changePassword } from '../../store/slices/website/siteAuthSlice';
import useSeo from '../../hooks/useSeo';
import AccountLayout from '../../components/website/account/AccountLayout';
import AuthInput from '../../components/common/auth/AuthInput';
import PasswordStrength, { MIN_PASSWORD } from '../../components/common/auth/PasswordStrength';

const empty = { oldPassword: '', newPassword: '', confirmPassword: '' };

export default function ChangePassword() {
  useSeo({ title: 'Change password', noindex: true });
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const dispatch = useDispatch();

  const mismatch = form.confirmPassword && form.newPassword !== form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < MIN_PASSWORD) return notify.error(`Password must be at least ${MIN_PASSWORD} characters`);
    if (form.newPassword !== form.confirmPassword) return notify.error('Passwords do not match');
    if (form.newPassword === form.oldPassword) return notify.error('New password must be different from the current one');
    setSaving(true);
    try {
      await dispatch(changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword })).unwrap();
      notify.updated('Password changed successfully');
      setForm(empty);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      notify.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountLayout icon={KeyRound} title="Change password" subtitle="Keep your account secure">
      <form onSubmit={handleSubmit} className="animate-fadeInUp overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 px-5 py-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow"><Lock size={19} /></span>
          <div>
            <h2 className="font-semibold text-gray-900">Update your password</h2>
            <p className="text-xs text-gray-500">Use at least {MIN_PASSWORD} characters - mixing letters, numbers and symbols is stronger</p>
          </div>
        </div>

        <div className="max-w-lg space-y-4 p-5 sm:p-6">
          {done && (
            <p className="flex animate-scaleIn items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 size={16} className="animate-pop" /> Your password has been updated.
            </p>
          )}
          <AuthInput label="Current password" icon={Lock} type="password" required autoComplete="current-password" delay={60}
            value={form.oldPassword} onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} />
          <div>
            <AuthInput label="New password" icon={KeyRound} type="password" required autoComplete="new-password" delay={120}
              placeholder={`At least ${MIN_PASSWORD} characters`} value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
            <PasswordStrength password={form.newPassword} />
          </div>
          <AuthInput label="Confirm new password" icon={KeyRound} type="password" required autoComplete="new-password" delay={180}
            value={form.confirmPassword} error={mismatch ? 'Passwords do not match' : ''}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        </div>

        <div className="flex justify-end border-t border-gray-100 px-5 py-4 sm:px-6">
          <button disabled={saving} className="flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {saving ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </form>
    </AccountLayout>
  );
}
