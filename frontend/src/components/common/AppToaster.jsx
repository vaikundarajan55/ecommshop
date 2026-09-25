import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle2, Pencil, Trash2, LogIn, LogOut, XCircle, Info, X } from 'lucide-react';

const VARIANTS = {
  created: { title: 'Added', icon: CheckCircle2, accent: 'bg-emerald-500', iconColor: 'text-emerald-500', ring: 'bg-emerald-50' },
  updated: { title: 'Updated', icon: Pencil, accent: 'bg-sky-500', iconColor: 'text-sky-500', ring: 'bg-sky-50' },
  deleted: { title: 'Deleted', icon: Trash2, accent: 'bg-rose-500', iconColor: 'text-rose-500', ring: 'bg-rose-50' },
  login: { title: 'Welcome', icon: LogIn, accent: 'bg-primary-500', iconColor: 'text-primary-500', ring: 'bg-primary-50' },
  logout: { title: 'Logged out', icon: LogOut, accent: 'bg-gray-500', iconColor: 'text-gray-500', ring: 'bg-gray-100' },
  success: { title: 'Success', icon: CheckCircle2, accent: 'bg-emerald-500', iconColor: 'text-emerald-500', ring: 'bg-emerald-50' },
  error: { title: 'Error', icon: XCircle, accent: 'bg-red-500', iconColor: 'text-red-500', ring: 'bg-red-50' },
  blank: { title: 'Notice', icon: Info, accent: 'bg-primary-500', iconColor: 'text-primary-500', ring: 'bg-primary-50' },
};

function AppToast({ t }) {
  const v = VARIANTS[t.variant] || VARIANTS[t.type] || VARIANTS.blank;
  const Icon = v.icon;
  // "updated" alerts are the small compact popup; the rest are full cards
  const compact = t.variant === 'updated' || t.variant === 'logout';

  return (
    <div
      className={`pointer-events-auto relative flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5 ${
        compact ? 'px-3 py-2' : 'p-4'
      } ${t.visible ? 'animate-toastIn' : 'animate-toastOut'}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${v.accent}`} />
      <span className={`flex shrink-0 items-center justify-center rounded-full ${v.ring} ${compact ? 'h-7 w-7' : 'h-9 w-9'} animate-pop`}>
        <Icon size={compact ? 15 : 18} className={v.iconColor} />
      </span>
      <div className="min-w-0 flex-1">
        {!compact && <p className="text-sm font-semibold text-gray-800">{v.title}</p>}
        <p className={`break-words text-gray-600 ${compact ? 'pt-1 text-xs font-medium' : 'text-sm'}`}>{t.message}</p>
      </div>
      <button onClick={() => toast.dismiss(t.id)} className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
        <X size={14} />
      </button>
      {/* Time-left bar */}
      <span
        className={`absolute bottom-0 left-0 h-0.5 w-full origin-left animate-shrink ${v.accent} opacity-60`}
        style={{ animationDuration: `${t.duration}ms` }}
      />
    </div>
  );
}

export default function AppToaster() {
  return (
    <Toaster position="top-right" gutter={10} containerStyle={{ top: 16, right: 16 }} toastOptions={{ duration: 3000 }}>
      {(t) => <AppToast t={t} />}
    </Toaster>
  );
}
