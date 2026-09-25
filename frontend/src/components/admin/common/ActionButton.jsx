import { Eye, Pencil, Trash2, Truck, FileDown, Ban, CheckCircle2, Loader2 } from 'lucide-react';

// Icon-only row action with a hover tooltip. Each type has its own colour and icon motion.
const TYPES = {
  view: {
    icon: Eye, label: 'View',
    idle: 'bg-sky-50 text-sky-600 ring-sky-200',
    hover: 'hover:from-sky-500 hover:to-cyan-500 hover:shadow-sky-500/40',
    motion: 'group-hover/act:scale-125',
  },
  edit: {
    icon: Pencil, label: 'Edit',
    idle: 'bg-indigo-50 text-indigo-600 ring-indigo-200',
    hover: 'hover:from-indigo-500 hover:to-violet-600 hover:shadow-indigo-500/40',
    motion: 'group-hover/act:-rotate-12 group-hover/act:scale-110',
  },
  delete: {
    icon: Trash2, label: 'Delete',
    idle: 'bg-rose-50 text-rose-600 ring-rose-200',
    hover: 'hover:from-rose-500 hover:to-red-600 hover:shadow-rose-500/40',
    motion: 'group-hover/act:animate-wiggle',
  },
  track: {
    icon: Truck, label: 'Track / Update',
    idle: 'bg-violet-50 text-violet-600 ring-violet-200',
    hover: 'hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-500/40',
    motion: 'group-hover/act:translate-x-0.5 group-hover/act:scale-110',
  },
  invoice: {
    icon: FileDown, label: 'Invoice',
    idle: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    hover: 'hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/40',
    motion: 'group-hover/act:translate-y-0.5 group-hover/act:scale-110',
  },
  block: {
    icon: Ban, label: 'Block',
    idle: 'bg-amber-50 text-amber-600 ring-amber-200',
    hover: 'hover:from-amber-500 hover:to-orange-500 hover:shadow-amber-500/40',
    motion: 'group-hover/act:rotate-90',
  },
  activate: {
    icon: CheckCircle2, label: 'Activate',
    idle: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    hover: 'hover:from-emerald-500 hover:to-green-600 hover:shadow-emerald-500/40',
    motion: 'group-hover/act:scale-125',
  },
};

export default function ActionButton({ type, onClick, label, disabled = false, loading = false }) {
  const t = TYPES[type];
  const Icon = t.icon;
  const text = label || t.label;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={text}
      className={`group/act relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset transition-all duration-200 ${t.idle} ${t.hover} hover:-translate-y-0.5 hover:text-white hover:shadow-md hover:ring-transparent disabled:pointer-events-none disabled:opacity-50`}
    >
      {loading
        ? <Loader2 size={15} className="animate-spin" />
        : <Icon size={15} className={`transition-transform duration-300 ${t.motion}`} />}

      {/* tooltip */}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover/act:translate-y-0 group-hover/act:opacity-100">
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </button>
  );
}

// Row wrapper - buttons pop in one after another
export function ActionGroup({ children }) {
  return <div className="flex items-center gap-1.5 [&>*]:animate-scaleIn [&>*:nth-child(2)]:[animation-delay:60ms] [&>*:nth-child(3)]:[animation-delay:120ms]">{children}</div>;
}
