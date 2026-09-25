import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, Send, Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import { notify } from '../../utils/notify';
import api from '../../services/adminApi';
import useSeo from '../../hooks/useSeo';
import AdminAuthShell from '../../components/admin/auth/AdminAuthShell';
import AuthInput from '../../components/common/auth/AuthInput';

export default function ForgotPassword() {
  useSeo({ title: 'Admin - Forgot password', noindex: true });
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email, portal: 'admin' });
      setSent(true);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthShell
      icon={KeyRound}
      title={sent ? 'Check your inbox' : 'Forgot password?'}
      subtitle={sent ? undefined : 'We will email a reset link to your admin account'}
      footer={<Link to="/admin/login" className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:underline"><ArrowLeft size={15} /> Back to login</Link>}
    >
      {sent ? (
        <div className="animate-scaleIn text-center">
          <span className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary-100" />
            <span className="relative flex h-20 w-20 animate-pop items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 text-white shadow-lg">
              <MailCheck size={36} />
            </span>
          </span>
          <p className="mt-5 text-sm text-gray-600">
            If an admin account exists for <span className="font-semibold text-gray-800">{email}</span>, a reset link has been sent. It expires in 1 hour.
          </p>
          <button onClick={() => setSent(false)} className="mt-5 text-sm font-medium text-primary-600 hover:underline">Use a different email</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthInput label="Admin email" icon={Mail} type="email" required autoComplete="username" accent="primary" delay={80}
            placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button
            disabled={loading}
            className="flex w-full animate-fadeInUp items-center justify-center gap-2 rounded-md bg-primary-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ animationDelay: '160ms' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AdminAuthShell>
  );
}
