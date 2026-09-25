import { Package, ChevronRight, CheckCircle2, XCircle, Truck } from 'lucide-react';
import { statusGroup, statusLabel, statusProgress, GROUP_STYLE, money, orderDate } from '../../../utils/orderStatus';

const ICON = { active: Truck, completed: CheckCircle2, cancelled: XCircle };

// One order as a clickable card with an animated progress bar
export default function OrderCard({ order, onClick, index = 0, selected = false }) {
  const group = statusGroup(order.status);
  const style = GROUP_STYLE[group];
  const Icon = ICON[group];
  const progress = statusProgress(order.status);

  return (
    <button
      type="button" onClick={onClick}
      className={`group flex w-full animate-fadeInUp flex-col rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        selected ? 'ring-2 ring-rose-400' : 'ring-gray-100 hover:ring-rose-200'
      }`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-rose-100 text-rose-600 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
            <Package size={20} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">#{order.order_no}</p>
            <p className="text-xs text-gray-500">{orderDate(order.created_at)} · {order.item_count ?? '-'} item{Number(order.item_count) === 1 ? '' : 's'}</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}>
          <Icon size={12} /> {statusLabel(order.status)}
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <span
          className={`block h-full origin-left rounded-full bg-gradient-to-r ${style.bar} transition-all duration-1000 ease-out`}
          style={{ width: group === 'cancelled' ? '100%' : `${Math.max(progress, 6)}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-bold tabular-nums text-gray-900">{money(order.total_amount)}</span>
        <span className="flex items-center gap-0.5 text-xs font-medium text-rose-600">
          Details <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  );
}
