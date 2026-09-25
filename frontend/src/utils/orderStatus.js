// Shared order-status helpers for the customer account pages
export const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

export const statusLabel = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// all | active | completed | cancelled
export const statusGroup = (status) => {
  if (status === 'delivered') return 'completed';
  if (status === 'cancelled' || status === 'returned') return 'cancelled';
  return 'active';
};

// 0-100 progress through the delivery steps (cancelled/returned = 0)
export const statusProgress = (status) => {
  const i = STATUS_STEPS.indexOf(status);
  return i < 0 ? 0 : Math.round((i / (STATUS_STEPS.length - 1)) * 100);
};

export const GROUP_STYLE = {
  active: { badge: 'bg-sky-50 text-sky-700 ring-sky-600/20', bar: 'from-sky-500 to-indigo-500' },
  completed: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', bar: 'from-emerald-500 to-teal-500' },
  cancelled: { badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', bar: 'from-rose-400 to-red-500' },
};

export const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const orderDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
