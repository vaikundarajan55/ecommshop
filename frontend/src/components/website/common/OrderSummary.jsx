import { imageUrl } from '../../../utils/imageUrl';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Sticky order summary card used on cart / checkout / payment.
// `accent` is the gradient for the total strip so it matches the page theme.
export default function OrderSummary({ items, accent = 'from-amber-500 to-orange-500', showItems = false, children }) {
  const count = items.reduce((a, i) => a + i.quantity, 0);
  const total = items.reduce((a, i) => a + i.price * i.quantity, 0);

  return (
    <aside className="animate-slideInRight overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 lg:sticky lg:top-24">
      <div className="p-5">
        <h2 className="font-semibold text-gray-900">Order summary</h2>

        {showItems && (
          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map((item, i) => (
              <li key={item.productId} className="flex animate-fadeInUp items-center gap-3" style={{ animationDelay: `${i * 50}ms` }}>
                <span className="relative shrink-0">
                  {item.image
                    ? <img src={imageUrl(item.image)} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-gray-200" />
                    : <span className="block h-12 w-12 rounded-lg bg-gray-100" />}
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-800 px-1 text-[10px] font-semibold text-white">
                    {item.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{item.name}</span>
                <span className="text-sm font-medium tabular-nums text-gray-900">{money(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
          <div className="flex justify-between text-gray-600"><dt>Items ({count})</dt><dd className="tabular-nums">{money(total)}</dd></div>
          <div className="flex justify-between text-gray-600"><dt>Delivery</dt><dd className="font-medium text-emerald-600">Free</dd></div>
        </dl>
      </div>
      <div className={`flex animate-gradient items-center justify-between bg-gradient-to-r ${accent} bg-[length:200%_200%] px-5 py-4 text-white`}>
        <span className="text-sm font-medium">Total</span>
        <span key={total} className="animate-pop text-xl font-bold tabular-nums">{money(total)}</span>
      </div>
      {children && <div className="p-5 pt-4">{children}</div>}
    </aside>
  );
}
