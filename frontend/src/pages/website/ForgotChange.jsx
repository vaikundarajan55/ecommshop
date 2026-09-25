import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Lock, KeyRound, ShieldCheck, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { notify } from '../../utils/notify';
import { resetPassword } from '../../store/slices/website/siteAuthSlice';
import useSeo from '../../hooks/useSeo';
import AuthShell from '../../components/website/auth/AuthShell';
import AuthInput from '../../components/common/auth/AuthInput';
import PasswordStrength, { MIN_PASSWORD } from '../../components/common/auth/PasswordStrength';

export default function ForgotChange() {
  useSeo({ title: 'Reset password', noindex: true });
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const dispatch = useDispatch();

  const mismatch = form.confirmPassword && form.newPassword !== form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < MIN_PASSWORD) return notify.error(`Password must be at least ${MIN_PASSWORD} characters`);
    if (form.newPassword !== form.confirmPassword) return notify.error('Passwords do not match');
    setLoading(true);
    try {
      await dispatch(resetPassword({ token, newPassword: form.newPassword })).unwrap();
      notify.updated('Password reset successfully');
      setDone(true);
    } catch (err) {
      notify.error(err);
    } finally {
      setLoading(false);
    }
  };

  const footer = <Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>;

  // Opened without a token (e.g. typed the URL) - nothing to reset
  if (!token) {
    return (
      <AuthShell icon={KeyRound} title="Reset link missing" footer={footer}>
        <div className="animate-fadeIn text-center">
          <AlertTriangle size={36} className="mx-auto animate-shake text-amber-500" />
          <p className="mt-3 text-sm text-gray-600">Open this page from the link in your reset email, or request a new link.</p>
          <Link to="/forgot-password" className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={ShieldCheck}
      title={done ? 'Password updated' : 'Set a new password'}
      subtitle={done ? undefined : 'Choose a strong password you have not used before'}
      panelTitle="Almost there."
      panelText="Pick a new password and you'll be back to shopping in seconds."
      footer={done ? null : footer}
    >
      {done ? (
        <div className="animate-scaleIn text-center">
          <span className="mx-auto flex h-20 w-20 animate-pop items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
            <CheckCircle2 size={40} />
          </span>
          <p className="mt-5 text-sm text-gray-600">Your password has been changed. You can now sign in with your new password.</p>
          <Link to="/login" className="mt-5 inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white">
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <AuthInput label="New password" icon={Lock} type="password" required autoComplete="new-password" delay={100}
              placeholder={`At least ${MIN_PASSWORD} characters`} value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
            <PasswordStrength password={form.newPassword} />
          </div>
          <AuthInput label="Confirm new password" icon={Lock} type="password" required autoComplete="new-password" delay={180}
            placeholder="Repeat password" value={form.confirmPassword} error={mismatch ? 'Passwords do not match' : ''}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          <button
            disabled={loading}
            className="flex w-full animate-fadeInUp items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-70"
            style={{ animationDelay: '260ms' }}
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
            {loading ? 'Saving...' : 'Reset password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
