import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, fetchOrderById, updateOrderStatus } from '../../store/slices/admin/orderSlice';
import { notify } from '../../utils/notify';
import api from '../../services/adminApi'; // only handed to InvoiceModal
import { socket, connectAdminSocket } from '../../services/socket';
import DataTable from '../../components/admin/common/DataTable';
import ActionButton, { ActionGroup } from '../../components/admin/common/ActionButton';
import InvoiceModal from '../../components/common/InvoiceModal';
import Modal from '../../components/admin/common/Modal';

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

export default function OrderList() {
  const dispatch = useDispatch();
  const { items: orders, filters: lastFilters, saving } = useSelector((state) => state.orders);
  const [filters, setFilters] = useState(lastFilters);
  const [trackModal, setTrackModal] = useState({ open: false, order: null, tracking: [] });
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });

  useEffect(() => {
    dispatch(fetchOrders(filters)).unwrap().catch(notify.error);
    // Live reloads reuse the last applied filter stored in the slice
    const reload = () => dispatch(fetchOrders());
    connectAdminSocket();
    socket.on('new_order', reload);
    socket.on('order_status_updated', reload);
    return () => { socket.off('new_order', reload); socket.off('order_status_updated', reload); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const applyFilters = (e) => {
    e.preventDefault();
    dispatch(fetchOrders(filters)).unwrap().catch(notify.error);
  };

  const openTracking = async (order) => {
    try {
      const full = await dispatch(fetchOrderById(order.id)).unwrap();
      setTrackModal({ open: true, order: full, tracking: full.tracking });
      setStatusForm({ status: order.status, note: '' });
    } catch (message) {
      notify.error(message);
    }
  };

  const submitStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateOrderStatus({ id: trackModal.order.id, ...statusForm })).unwrap();
      notify.updated('Order status updated — customer notified in real time');
      setTrackModal({ open: false, order: null, tracking: [] });
    } catch (message) {
      notify.error(message);
    }
  };

  // Invoice is fetched with the admin token inside InvoiceModal (a plain window.open had no token -> 401)
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const openInvoice = (row) => { setInvoiceOrder(row); setInvoiceOpen(true); };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Order List</h2>

      <form onSubmit={applyFilters} className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5 sm:[&>button]:col-span-2 lg:[&>button]:col-span-1">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="">All Status</option>
          {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Search order#/customer" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Filter</button>
      </form>

      <DataTable
        columns={[
          { key: 'order_no', label: 'Order #' },
          { key: 'customer_name', label: 'Customer' },
          { key: 'total_amount', label: 'Amount' },
          { key: 'payment_status', label: 'Payment' },
          { key: 'status', label: 'Status' },
          { key: 'created_at', label: 'Date' },
        ]}
        rows={orders}
        renderActions={(row) => (
          <ActionGroup>
            <ActionButton type="track" onClick={() => openTracking(row)} />
            <ActionButton type="invoice" onClick={() => openInvoice(row)} label="Invoice" />
          </ActionGroup>
        )}
      />

      <Modal open={trackModal.open} title={`Order ${trackModal.order?.order_no || ''} - Tracking`} onClose={() => setTrackModal({ open: false, order: null, tracking: [] })}>
        <div className="mb-4 max-h-48 space-y-2 overflow-y-auto border-b pb-4">
          {trackModal.tracking.map((t) => (
            <div key={t.id} className="text-sm">
              <span className="font-semibold capitalize">{t.status.replace('_', ' ')}</span>
              {t.note && <span className="text-gray-500"> — {t.note}</span>}
              <span className="block text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</span>
              {t.predicted_delivery && (
                <span className="block text-xs text-emerald-600">AI predicted delivery: {new Date(t.predicted_delivery).toLocaleDateString()}</span>
              )}
            </div>
          ))}
        </div>
        <form onSubmit={submitStatusUpdate} className="space-y-3">
          <select value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Note (optional)" value={statusForm.note} onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <button disabled={saving} className="w-full rounded-md bg-primary-600 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
            Update Status (notifies customer live)
          </button>
        </form>
      </Modal>
      <InvoiceModal api={api} order={invoiceOrder} open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />
    </div>
  );
}
