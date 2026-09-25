import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { notify } from '../../utils/notify';
import { loginUser } from '../../store/slices/website/siteAuthSlice';
import useSeo from '../../hooks/useSeo';
import AuthShell from '../../components/website/auth/AuthShell';
import AuthInput from '../../components/common/auth/AuthInput';
import Captcha from '../../components/common/auth/Captcha';

export default function Login() {
  useSeo({ title: 'Login', description: 'Sign in to your ShopEase account to track orders and check out faster.', noindex: true });
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaVersion, setCaptchaVersion] = useState(0); // bump = load a new captcha
  const [captchaError, setCaptchaError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaAnswer.trim()) return setCaptchaError('Please enter the captcha');
    setCaptchaError('');
    setLoading(true);
    try {
      const { user } = await dispatch(loginUser({ ...form, captchaId, captchaAnswer })).unwrap();
      notify.login(`Welcome back, ${user?.name || 'there'}!`);
      navigate(location.state?.from || '/dashboard');
    } catch (err) {
      setCaptchaError(err.errors?.captcha || '');
      notify.error(err.message);
      setCaptchaVersion((v) => v + 1); // every captcha works once - load a new one
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      icon={LogIn}
      title="Welcome back"
      subtitle="Sign in to continue shopping"
      footer={<>New to ShopEase? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Email" icon={Mail} type="email" required autoComplete="email" delay={100}
          placeholder="you@example.com" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <AuthInput
          label="Password" icon={Lock} type="password" required autoComplete="current-password" delay={180}
          placeholder="••••••••" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Captcha
          value={captchaAnswer} onChange={setCaptchaAnswer} onIdChange={setCaptchaId}
          error={captchaError} version={captchaVersion} delay={220}
        />
        <div className="flex animate-fadeIn justify-end text-sm" style={{ animationDelay: '250ms' }}>
          <Link to="/forgot-password" className="font-medium text-brand-600 hover:underline">Forgot password?</Link>
        </div>
        <button
          disabled={loading || !captchaId}
          className="flex w-full animate-fadeInUp items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-70"
          style={{ animationDelay: '300ms' }}
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
