import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { fetchCaptcha } from '../../../store/slices/website/siteAuthSlice';

// Image captcha for the website login. The server keeps the answer; each captcha works once,
// so the parent bumps `version` after a failed login to load a fresh one.
export default function Captcha({ value, onChange, onIdChange, error, version = 0, delay = 0 }) {
  const [svg, setSvg] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const load = useCallback(async () => {
    setLoading(true);
    onChange('');
    try {
      const captcha = await dispatch(fetchCaptcha()).unwrap();
      setSvg(captcha.svg);
      onIdChange(captcha.captchaId);
    } catch {
      setSvg('');
      onIdChange('');
    } finally {
      setLoading(false);
    }
  }, [dispatch, onChange, onIdChange]);

  useEffect(() => { load(); }, [load, version]);

  return (
    <div className="animate-fadeInUp" style={{ animationDelay: `${delay}ms` }}>
      <span className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700"><ShieldCheck size={15} className="text-brand-600" /> Security check</span>
      <div className="flex items-stretch gap-2">
        {/* SVG comes from our own API (svg-captcha: paths only, no scripts) */}
        <div
          role="img" aria-label="Captcha image - type the characters you see"
          className={`flex h-[50px] w-[150px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-orange-200 bg-orange-50 transition-opacity ${loading ? 'opacity-40' : ''}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <button
          type="button" onClick={load} disabled={loading} title="Get a new captcha" aria-label="Get a new captcha"
          className="flex w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-600 disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
        </button>
        <input
          value={value} onChange={(e) => onChange(e.target.value)} required maxLength={5}
          autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Type here" aria-label="Captcha characters"
          className={`min-w-0 flex-1 rounded-lg border bg-white/90 px-3 text-sm font-semibold uppercase tracking-[0.3em] outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 ${error ? 'border-red-400' : 'border-gray-300'}`}
        />
      </div>
      {error
        ? <span className="mt-1 block animate-fadeIn text-xs text-red-600">{error}</span>
        : <span className="mt-1 block text-xs text-gray-400">Not case-sensitive. Can&apos;t read it? Tap refresh.</span>}
    </div>
  );
}
