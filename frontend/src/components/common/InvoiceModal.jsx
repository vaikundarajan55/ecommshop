import { useEffect, useRef, useState } from 'react';
import { Download, Printer, ExternalLink, Loader2, FileWarning, FileText, Receipt, ShoppingBag } from 'lucide-react';
import Modal from '../admin/common/Modal';
import { notify } from '../../utils/notify';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const label = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const PAYMENT_LABELS = { cod: 'Cash on Delivery', upi: 'UPI', card: 'Credit / Debit card', netbanking: 'Net banking', wallet: 'Wallet' };
const parseAddress = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return { line1: String(raw) }; }
};

// Counts up to `value` - used for the invoice total
function CountUp({ value, duration = 900 }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return money(shown);
}

// Animated on-screen invoice built from the order details
function InvoiceDocument({ order }) {
  const addr = parseAddress(order.shipping_address);
  const items = order.items || [];
  const subtotal = items.reduce((a, it) => a + Number(it.subtotal ?? it.price * it.quantity), 0);
  const total = Number(order.total_amount);
  const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const paid = order.payment_status === 'paid';

  return (
    <article className="relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      {/* Header */}
      <header className="relative animate-gradient overflow-hidden bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 bg-[length:200%_200%] px-6 py-6 text-white sm:px-8">
        <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 animate-float rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="animate-slideInLeft">
            <p className="flex items-center gap-2 text-2xl font-extrabold"><ShoppingBag size={24} /> ShopEase</p>
            <p className="mt-1 text-xs text-white/80">Tax invoice / bill of supply</p>
          </div>
          <div className="animate-slideInRight text-right">
            <p className="text-3xl font-black tracking-wider">INVOICE</p>
            <p className="mt-1 text-xs text-white/85">No: INV-{order.order_no}</p>
            <p className="text-xs text-white/85">Date: {date}</p>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-6 sm:p-8">
        {/* Parties */}
        <div className="grid gap-4 text-sm sm:grid-cols-3">
          {[
            ['Bill to', [order.customer_name, order.customer_email, addr.phone && `Phone: ${addr.phone}`]],
            ['Ship to', [order.customer_name, addr.line1, [addr.city, addr.state].filter(Boolean).join(', '), addr.pincode && `PIN ${addr.pincode}`]],
            ['Order', [`#${order.order_no}`, `Status: ${label(order.status)}`, `Payment: ${PAYMENT_LABELS[order.payment_method] || label(order.payment_method)}`, `Payment status: ${label(order.payment_status)}`]],
          ].map(([title, lines], i) => (
            <div key={title} className="animate-fadeInUp rounded-lg bg-gray-50 p-3" style={{ animationDelay: `${150 + i * 80}ms` }}>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{title}</p>
              {lines.filter(Boolean).map((l, j) => (
                <p key={j} className={j === 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}>{l}</p>
              ))}
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="animate-fadeIn bg-gray-900 text-left text-xs uppercase tracking-wide text-white">
                <th className="rounded-l-lg px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Item</th>
                <th className="px-3 py-2.5 text-right">Qty</th>
                <th className="px-3 py-2.5 text-right">Price</th>
                <th className="rounded-r-lg px-3 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id ?? i} className="animate-fadeInUp border-b border-gray-100 odd:bg-white even:bg-gray-50/70" style={{ animationDelay: `${350 + i * 70}ms` }}>
                  <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">{it.product_name}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{it.quantity}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">{money(it.price)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-gray-900">{money(it.subtotal ?? it.price * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-h-[60px]">
            {paid && (
              <span className="inline-block -rotate-12 animate-pop rounded-lg border-4 border-emerald-500 px-4 py-1 text-2xl font-black tracking-widest text-emerald-500" style={{ animationDelay: `${500 + items.length * 70}ms` }}>
                PAID
              </span>
            )}
          </div>
          <dl className="w-full animate-slideInRight space-y-1.5 text-sm sm:w-72" style={{ animationDelay: `${400 + items.length * 70}ms` }}>
            <div className="flex justify-between text-gray-500"><dt>Subtotal</dt><dd className="tabular-nums">{money(subtotal)}</dd></div>
            <div className="flex justify-between text-gray-500"><dt>Delivery</dt><dd className="text-emerald-600">Free</dd></div>
            {Math.abs(total - subtotal) >= 0.01 && (
              <div className="flex justify-between text-gray-500"><dt>{total < subtotal ? 'Discount' : 'Adjustments'}</dt><dd className="tabular-nums">{money(total - subtotal)}</dd></div>
            )}
            <div className="mt-2 flex items-center justify-between rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3 text-white shadow-md">
              <dt className="font-semibold">Total</dt>
              <dd className="text-xl font-bold tabular-nums"><CountUp value={total} /></dd>
            </div>
          </dl>
        </div>

        <footer className="animate-fadeIn border-t border-gray-100 pt-4 text-center" style={{ animationDelay: `${600 + items.length * 70}ms` }}>
          <p className="font-semibold text-gray-800">Thank you for shopping with ShopEase!</p>
          <p className="text-xs text-gray-400">This is a computer-generated invoice and does not require a signature.</p>
        </footer>
      </div>
    </article>
  );
}

// Invoice popup with two formats: animated on-screen invoice + the printable PDF.
// Both are fetched with the caller's axios instance (adminApi / siteApi) so the login token is sent.
export default function InvoiceModal({ api, order, open, onClose }) {
  const [view, setView] = useState('invoice'); // 'invoice' | 'pdf'
  const [details, setDetails] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState('');
  const frameRef = useRef(null);
  const fileName = order ? `invoice-${order.order_no}.pdf` : 'invoice.pdf';

  useEffect(() => {
    if (!open || !order) return undefined;
    let objectUrl;
    let cancelled = false;
    setView('invoice'); setDetails(null); setPdfUrl(null); setError('');

    api.get(`/orders/${order.id}`)
      .then(({ data }) => { if (!cancelled) setDetails(data.data); })
      .catch(() => { if (!cancelled) setError('Could not load the invoice. Please try again.'); });
    api.get(`/orders/${order.id}/invoice`, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        setPdfUrl(objectUrl);
      })
      .catch(() => {});

    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [open, order?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const download = () => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    notify.success(`${fileName} downloaded`);
  };

  const print = () => {
    // Print the PDF (exact paper layout). The iframe only exists on the PDF tab, so fall back to a new tab.
    try {
      if (view === 'pdf' && frameRef.current?.contentWindow) frameRef.current.contentWindow.print();
      else window.open(pdfUrl, '_blank');
    } catch { window.open(pdfUrl, '_blank'); }
  };

  const tabCls = (active) => `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
    active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
  }`;

  return (
    <Modal open={open} onClose={onClose} size="max-w-4xl" title={order ? `Invoice · ${order.order_no}` : 'Invoice'}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Invoice format">
            <button role="tab" aria-selected={view === 'invoice'} onClick={() => setView('invoice')} className={tabCls(view === 'invoice')}>
              <Receipt size={15} /> Invoice
            </button>
            <button role="tab" aria-selected={view === 'pdf'} onClick={() => setView('pdf')} className={tabCls(view === 'pdf')}>
              <FileText size={15} /> PDF
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={download} disabled={!pdfUrl}
              className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {pdfUrl ? <Download size={16} /> : <Loader2 size={16} className="animate-spin" />} Download PDF
            </button>
            <button onClick={print} disabled={!pdfUrl}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50">
              <Printer size={16} /> Print
            </button>
            <a href={pdfUrl || undefined} target="_blank" rel="noreferrer" aria-label="Open PDF in new tab"
              className={`flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50 ${pdfUrl ? '' : 'pointer-events-none opacity-50'}`}>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {error ? (
          <div className="flex h-60 animate-fadeIn flex-col items-center justify-center gap-2 text-sm text-red-600">
            <FileWarning size={32} /> {error}
          </div>
        ) : view === 'invoice' ? (
          details ? <InvoiceDocument key={details.id} order={details} /> : (
            <div className="flex h-72 flex-col items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 size={28} className="animate-spin text-primary-600" /> Preparing invoice...
            </div>
          )
        ) : (
          <div className="relative h-[65vh] overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200">
            {pdfUrl ? (
              <iframe ref={frameRef} src={pdfUrl} title={`Invoice ${order?.order_no}`} className="h-full w-full animate-fadeIn" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 size={28} className="animate-spin text-primary-600" /> Generating PDF...
              </div>
            )}
          </div>
        )}
        {view === 'pdf' && <p className="text-xs text-gray-400 sm:hidden">If the preview is blank on your phone, use Download or the open-in-new-tab button.</p>}
      </div>
    </Modal>
  );
}
