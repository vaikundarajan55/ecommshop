import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { User, Mail, Phone, Lock, UserPlus, Loader2 } from 'lucide-react';
import { notify } from '../../utils/notify';
import { registerUser } from '../../store/slices/website/siteAuthSlice';
import useSeo from '../../hooks/useSeo';
import AuthShell from '../../components/website/auth/AuthShell';
import AuthInput from '../../components/common/auth/AuthInput';
import PasswordStrength, { MIN_PASSWORD } from '../../components/common/auth/PasswordStrength';
import { personNameError, emailError, phoneError, clean, normalizePhone } from '../../utils/validators';

const validate = (form) => {
  const errors = {
    name: personNameError(form.name),
    phone: phoneError(form.phone),
    email: emailError(form.email),
    password: form.password.length < MIN_PASSWORD ? `Password must be at least ${MIN_PASSWORD} characters` : '',
    confirmPassword: form.password !== form.confirmPassword ? 'Passwords do not match' : '',
  };
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
};

export default function Register() {
  useSeo({ title: 'Create account', description: 'Create a free ShopEase account for faster checkout and live order tracking.', noindex: true });
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Show a field's error once it has been left (or after a submit attempt)
  const liveErrors = { ...validate(form), ...errors };
  const errorFor = (field) => (touched[field] ? liveErrors[field] : '');
  const field = (name) => ({
    value: form[name],
    error: errorFor(name),
    onChange: (e) => {
      setForm({ ...form, [name]: e.target.value });
      if (errors[name]) setErrors(({ [name]: _, ...rest }) => rest); // clear a server error once edited
    },
    onBlur: () => setTouched((t) => ({ ...t, [name]: true })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    if (Object.keys(found).length) {
      setTouched({ name: true, phone: true, email: true, password: true, confirmPassword: true });
      return notify.error(Object.values(found)[0]);
    }
    setLoading(true);
    try {
      const body = { name: clean(form.name), email: clean(form.email), password: form.password, phone: normalizePhone(form.phone) };
      await dispatch(registerUser(body)).unwrap();
      notify.created(`Welcome to ShopEase, ${body.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const fieldErrors = err.errors || {}; // e.g. email / mobile already registered
      setErrors(fieldErrors);
      setTouched((t) => ({ ...t, ...Object.fromEntries(Object.keys(fieldErrors).map((k) => [k, true])) }));
      notify.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      icon={UserPlus}
      title="Create your account"
      subtitle="It takes less than a minute"
      panelTitle="Join ShopEase today."
      panelText="Save your details for faster checkout, track every order live and get member-only deals."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput label="Full name" icon={User} required autoComplete="name" delay={80} maxLength={60}
            placeholder="Your name" {...field('name')} />
          <AuthInput label="Mobile number" icon={Phone} type="tel" required autoComplete="tel" delay={140} inputMode="numeric" maxLength={15}
            placeholder="10-digit mobile" hint="One account per mobile number" {...field('phone')} />
        </div>
        <AuthInput label="Email" icon={Mail} type="email" required autoComplete="email" delay={200} maxLength={150}
          placeholder="you@example.com" hint="One account per email" {...field('email')} />
        <div>
          <AuthInput label="Password" icon={Lock} type="password" required autoComplete="new-password" delay={260}
            placeholder={`At least ${MIN_PASSWORD} characters`} {...field('password')} />
          <PasswordStrength password={form.password} />
        </div>
        <AuthInput label="Confirm password" icon={Lock} type="password" required autoComplete="new-password" delay={320}
          placeholder="Repeat password" {...field('confirmPassword')}
          error={(touched.confirmPassword || form.confirmPassword) ? liveErrors.confirmPassword : ''} />
        <button
          disabled={loading}
          className="flex w-full animate-fadeInUp items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-70"
          style={{ animationDelay: '380ms' }}
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
