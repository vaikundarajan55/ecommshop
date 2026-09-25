import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, ShieldCheck, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { notify } from '../../utils/notify';
import api from '../../services/adminApi';
import useSeo from '../../hooks/useSeo';
import AdminAuthShell from '../../components/admin/auth/AdminAuthShell';
import AuthInput from '../../components/common/auth/AuthInput';
import PasswordStrength, { MIN_PASSWORD } from '../../components/common/auth/PasswordStrength';

export default function ResetPassword() {
  useSeo({ title: 'Admin - Reset password', noindex: true });
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const mismatch = form.confirmPassword && form.newPassword !== form.confirmPassword;
  const backLink = <Link to="/admin/login" className="font-semibold text-primary-600 hover:underline">Back to login</Link>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < MIN_PASSWORD) return notify.error(`Password must be at least ${MIN_PASSWORD} characters`);
    if (form.newPassword !== form.confirmPassword) return notify.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/forgot-change-password', { token, newPassword: form.newPassword });
      notify.updated('Password reset successfully');
      setDone(true);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AdminAuthShell icon={AlertTriangle} title="Reset link missing" footer={backLink}>
        <p className="animate-fadeIn text-center text-sm text-gray-600">Open this page from the link in your reset email, or request a new one.</p>
        <Link to="/admin/forgot-password" className="mt-5 block rounded-md bg-primary-600 py-2.5 text-center text-sm font-semibold text-white">
          Request a new link
        </Link>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell
      icon={ShieldCheck}
      title={done ? 'Password updated' : 'Set a new password'}
      subtitle={done ? undefined : 'Choose a strong password for your admin account'}
      footer={done ? null : backLink}
    >
      {done ? (
        <div className="animate-scaleIn text-center">
          <span className="mx-auto flex h-20 w-20 animate-pop items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
            <CheckCircle2 size={40} />
          </span>
          <p className="mt-5 text-sm text-gray-600">Your admin password has been changed.</p>
          <Link to="/admin/login" className="mt-5 block rounded-md bg-primary-600 py-2.5 text-center text-sm font-semibold text-white">Go to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <AuthInput label="New password" icon={Lock} type="password" required autoComplete="new-password" accent="primary" delay={80}
              placeholder={`At least ${MIN_PASSWORD} characters`} value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
            <PasswordStrength password={form.newPassword} />
          </div>
          <AuthInput label="Confirm new password" icon={Lock} type="password" required autoComplete="new-password" accent="primary" delay={140}
            placeholder="Repeat password" value={form.confirmPassword} error={mismatch ? 'Passwords do not match' : ''}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          <button
            disabled={loading}
            className="flex w-full animate-fadeInUp items-center justify-center gap-2 rounded-md bg-primary-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ animationDelay: '200ms' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {loading ? 'Saving...' : 'Reset password'}
          </button>
        </form>
      )}
    </AdminAuthShell>
  );
}
