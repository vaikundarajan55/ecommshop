const GREEN = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
const GRAY = 'bg-gray-100 text-gray-600 ring-gray-500/20';
const AMBER = 'bg-amber-50 text-amber-700 ring-amber-600/20';
const RED = 'bg-red-50 text-red-700 ring-red-600/20';
const BLUE = 'bg-sky-50 text-sky-700 ring-sky-600/20';
const INDIGO = 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';

const STYLES = {
  // records
  active: GREEN, inactive: GRAY, out_of_stock: AMBER, blocked: RED,
  // orders
  pending: AMBER, confirmed: BLUE, processing: BLUE, packed: INDIGO, shipped: INDIGO,
  out_for_delivery: INDIGO, delivered: GREEN, cancelled: RED, returned: GRAY,
  // payments
  paid: GREEN, failed: RED, refunded: GRAY,
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STYLES[status] || GRAY}`}>
      {String(status || '').replace(/_/g, ' ')}
    </span>
  );
}
