import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, Lock, LogIn } from 'lucide-react';
import { notify } from '../../utils/notify';
import api from '../../services/adminApi';
import { setCredentials } from '../../store/slices/admin/adminAuthSlice';
import useSeo from '../../hooks/useSeo';
import AdminAuthShell from '../../components/admin/auth/AdminAuthShell';
import AuthInput from '../../components/common/auth/AuthInput';

export default function Login() {
  useSeo({ title: 'Admin Login', noindex: true });
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { ...form, portal: 'admin' }); // admin portal: no captcha, admin/staff only
      if (data.data.user.role !== 'admin' && data.data.user.role !== 'staff') {
        notify.error('This login is for admin/staff only');
        return;
      }
      dispatch(setCredentials(data.data));
      notify.login(`Welcome back, ${data.data.user.name || 'Admin'}!`);
      navigate('/admin/dashboard');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthShell icon={LogIn} title="Admin Login" subtitle="Sign in to manage your store">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput label="Email" icon={Mail} type="email" required autoComplete="username" accent="primary" delay={50}
          placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <AuthInput label="Password" icon={Lock} type="password" required autoComplete="current-password" accent="primary" delay={100}
          placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div className="flex animate-fadeIn justify-end text-sm" style={{ animationDelay: '150ms' }}>
          <Link to="/admin/forgot-password" className="font-medium text-primary-600 hover:underline">Forgot password?</Link>
        </div>
        <button
          disabled={loading}
          className="w-full animate-fadeInUp rounded-md bg-primary-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/30 disabled:opacity-60 [animation-delay:.2s]"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </span>
        </button>
      </form>
    </AdminAuthShell>
  );
}
