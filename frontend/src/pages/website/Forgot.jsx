import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, KeyRound, Send, Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import { notify } from '../../utils/notify';
import { forgotPassword } from '../../store/slices/website/siteAuthSlice';
import useSeo from '../../hooks/useSeo';
import AuthShell from '../../components/website/auth/AuthShell';
import AuthInput from '../../components/common/auth/AuthInput';

export default function Forgot() {
  useSeo({ title: 'Forgot password', description: 'Reset your ShopEase account password.', noindex: true });
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(forgotPassword(email)).unwrap();
      setSent(true);
    } catch (err) {
      notify.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      icon={KeyRound}
      title={sent ? 'Check your inbox' : 'Forgot password?'}
      subtitle={sent ? undefined : "Enter your email and we'll send you a reset link"}
      panelTitle="Locked out? No problem."
      panelText="We'll email you a secure link to set a new password. The link expires in 1 hour."
      footer={<Link to="/login" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"><ArrowLeft size={15} /> Back to sign in</Link>}
    >
      {sent ? (
        <div className="animate-scaleIn text-center">
          <span className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-200/60" />
            <span className="relative flex h-20 w-20 animate-pop items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
              <MailCheck size={36} />
            </span>
          </span>
          <p className="mt-5 text-sm text-gray-600">
            If an account exists for <span className="font-semibold text-gray-800">{email}</span>, a password reset link is on its way.
            It expires in 1 hour.
          </p>
          <p className="mt-2 text-xs text-gray-400">Didn&apos;t get it? Check your spam folder, or try again.</p>
          <button onClick={() => setSent(false)} className="mt-5 text-sm font-medium text-brand-600 hover:underline">
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthInput label="Email" icon={Mail} type="email" required autoComplete="email" delay={100}
            placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button
            disabled={loading}
            className="flex w-full animate-fadeInUp items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-70"
            style={{ animationDelay: '200ms' }}
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
