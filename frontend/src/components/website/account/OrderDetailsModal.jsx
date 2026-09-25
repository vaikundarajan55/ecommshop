import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Check, Loader2, MapPin, Receipt, Sparkles, XCircle } from 'lucide-react';
import siteApi from '../../../services/siteApi';
import { fetchMyOrderById } from '../../../store/slices/website/myOrderSlice';
import { socket, joinOrderRoom } from '../../../services/socket';
import Modal from '../../admin/common/Modal';
import InvoiceModal from '../../common/InvoiceModal';
import { STATUS_STEPS, statusLabel, statusGroup, money, orderDate } from '../../../utils/orderStatus';

const parseAddress = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return { line1: String(raw) }; }
};

// Order popup: live status timeline (socket updates), items, address and invoice
export default function OrderDetailsModal({ orderId, open, onClose, onChanged }) {
  const dispatch = useDispatch();
  const [loaded, setLoaded] = useState(false);
  const cached = useSelector((s) => s.myOrders.details[orderId]);
  const order = loaded ? cached : null; // always show the latest status
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const load = () => dispatch(fetchMyOrderById(orderId)).unwrap().then(() => setLoaded(true)).catch(() => {});

  useEffect(() => {
    if (!open || !orderId) return undefined;
    setLoaded(false);
    load();
    joinOrderRoom(orderId);
    const onUpdate = (payload) => {
      if (String(payload.orderId) !== String(orderId)) return;
      load();
      onChanged?.();
    };
    socket.on('order_status_updated', onUpdate);
    return () => socket.off('order_status_updated', onUpdate);
  }, [open, orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelled = order && statusGroup(order.status) === 'cancelled';
  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const addr = parseAddress(order?.shipping_address);
  const prediction = order?.tracking?.slice().reverse().find((t) => t.predicted_delivery)?.predicted_delivery;

  return (
    <>
      <Modal open={open} onClose={onClose} size="max-w-3xl" title={order ? `Order #${order.order_no}` : 'Order'}>
        {!order ? (
          <div className="flex h-60 items-center justify-center text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
        ) : (
          <div className="space-y-5">
            {/* Summary strip */}
            <div className="grid animate-fadeInUp grid-cols-2 gap-3 rounded-xl bg-gradient-to-r from-orange-50 via-rose-50 to-fuchsia-50 p-4 text-sm sm:grid-cols-4">
              <div><p className="text-xs text-gray-500">Placed on</p><p className="font-semibold text-gray-900">{orderDate(order.created_at)}</p></div>
              <div><p className="text-xs text-gray-500">Total</p><p className="font-semibold text-gray-900">{money(order.total_amount)}</p></div>
              <div><p className="text-xs text-gray-500">Payment</p><p className="font-semibold capitalize text-gray-900">{statusLabel(order.payment_status)}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><p className="font-semibold text-rose-600">{statusLabel(order.status)}</p></div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Timeline */}
              <section className="animate-fadeInUp" style={{ animationDelay: '80ms' }}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  Live tracking <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
                </h3>
                {cancelled ? (
                  <p className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"><XCircle size={16} /> This order was {order.status}.</p>
                ) : (
                  <ol className="relative space-y-3 pl-1">
                    {STATUS_STEPS.map((step, i) => {
                      const done = i <= currentStep;
                      const now = i === currentStep;
                      return (
                        <li key={step} className="relative flex animate-slideInLeft items-center gap-3" style={{ animationDelay: `${150 + i * 60}ms` }}>
                          {i < STATUS_STEPS.length - 1 && (
                            <span className={`absolute left-[11px] top-6 h-4 w-0.5 ${i < currentStep ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                          )}
                          <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white transition-all duration-500 ${
                            done ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gray-200'
                          } ${now ? 'ring-4 ring-emerald-100' : ''}`}>
                            {done && <Check size={13} strokeWidth={3} />}
                            {now && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />}
                          </span>
                          <span className={`text-sm ${now ? 'font-semibold text-gray-900' : done ? 'text-gray-700' : 'text-gray-400'}`}>{statusLabel(step)}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}
                {prediction && !cancelled && order.status !== 'delivered' && (
                  <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    <Sparkles size={14} /> Estimated delivery: {orderDate(prediction)}
                  </p>
                )}
                {order.tracking?.length > 0 && (
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">History</p>
                    <ul className="max-h-36 space-y-1.5 overflow-y-auto pr-1 text-xs">
                      {order.tracking.slice().reverse().map((t) => (
                        <li key={t.id} className="flex flex-wrap gap-x-2 text-gray-500">
                          <span className="font-medium text-gray-700">{statusLabel(t.status)}</span>
                          <span>{new Date(t.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          {t.note && <span className="w-full text-gray-400">{t.note}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Items + address */}
              <section className="space-y-4 animate-fadeInUp" style={{ animationDelay: '160ms' }}>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Items</h3>
                  <ul className="divide-y divide-gray-100 rounded-lg ring-1 ring-gray-100">
                    {order.items?.map((it) => (
                      <li key={it.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <span className="min-w-0 truncate text-gray-700">{it.product_name} <span className="text-gray-400">× {it.quantity}</span></span>
                        <span className="font-medium tabular-nums text-gray-900">{money(it.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Delivery address</h3>
                  <p className="flex gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-rose-500" />
                    <span>{[addr.line1, addr.city, addr.state].filter(Boolean).join(', ')}{addr.pincode ? ` - ${addr.pincode}` : ''}{addr.phone ? <><br />Phone: {addr.phone}</> : null}</span>
                  </p>
                </div>
                <button
                  onClick={() => setInvoiceOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-sm font-semibold text-white"
                >
                  <Receipt size={16} /> View invoice
                </button>
              </section>
            </div>
          </div>
        )}
      </Modal>
      <InvoiceModal api={siteApi} order={order} open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />
    </>
  );
}
