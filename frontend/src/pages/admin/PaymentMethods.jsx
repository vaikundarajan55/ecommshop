import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Star, Loader2 } from 'lucide-react';
import { fetchAllPaymentMethods, updatePaymentMethod, setDefaultPaymentMethod } from '../../store/slices/admin/paymentMethodSlice';
import { notify } from '../../utils/notify';
import { methodStyle } from '../../utils/paymentMethodStyle';
import DataTable from '../../components/admin/common/DataTable';
import Modal from '../../components/admin/common/Modal';
import ActionButton, { ActionGroup } from '../../components/admin/common/ActionButton';

const emptyForm = { id: null, code: '', name: '', description: '', sort_order: 0, is_active: true };

// On/off switch
function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function PaymentMethods() {
  const dispatch = useDispatch();
  const { items: rows, busyId, saving } = useSelector((state) => state.paymentMethods);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { dispatch(fetchAllPaymentMethods()); }, [dispatch]);

  const toggleActive = async (row) => {
    try {
      await dispatch(updatePaymentMethod({
        id: row.id, name: row.name, description: row.description, sort_order: row.sort_order, is_active: !row.is_active,
      })).unwrap();
      notify.updated(`${row.name} ${row.is_active ? 'turned off' : 'turned on'}`);
    } catch (message) {
      notify.error(message);
    }
  };

  const makeDefault = async (row) => {
    try {
      const message = await dispatch(setDefaultPaymentMethod(row.id)).unwrap();
      notify.updated(message);
    } catch (message) {
      notify.error(message);
    }
  };

  const openEdit = (row) => {
    setForm({ id: row.id, code: row.code, name: row.name, description: row.description || '', sort_order: row.sort_order, is_active: !!row.is_active, is_default: !!row.is_default });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updatePaymentMethod(form)).unwrap();
      notify.updated('Payment method updated successfully');
      setModalOpen(false);
    } catch (message) {
      notify.error(message);
    }
  };

  const activeCount = rows.filter((r) => r.is_active).length;
  const defaultRow = rows.find((r) => r.is_default);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Payment Methods</h2>
          <p className="text-sm text-gray-500">
            {activeCount} of {rows.length} shown to customers{defaultRow ? ` · default: ${defaultRow.name}` : ''}
          </p>
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: 'name', label: 'Method',
            render: (r) => {
              const { icon: Icon, color } = methodStyle(r.code);
              return (
                <div className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white shadow-sm ${r.is_active ? '' : 'opacity-40 grayscale'}`}>
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">{r.name}</p>
                    <p className="text-xs uppercase tracking-wide text-gray-400">{r.code}</p>
                  </div>
                </div>
              );
            },
          },
          { key: 'description', label: 'Description', render: (r) => <span className="text-gray-500">{r.description || '—'}</span> },
          { key: 'sort_order', label: 'Order', render: (r) => <span className="tabular-nums">{r.sort_order}</span> },
          {
            key: 'is_active', label: 'Active',
            render: (r) => (
              <div className="flex items-center gap-2">
                <Toggle
                  checked={!!r.is_active} onChange={() => toggleActive(r)} disabled={busyId === r.id}
                  label={`${r.is_active ? 'Turn off' : 'Turn on'} ${r.name}`}
                />
                {busyId === r.id && <Loader2 size={14} className="animate-spin text-gray-400" />}
              </div>
            ),
          },
          {
            key: 'is_default', label: 'Default',
            render: (r) => (r.is_default ? (
              <span className="inline-flex animate-pop items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                <Star size={12} fill="currentColor" /> Default
              </span>
            ) : (
              <button
                onClick={() => makeDefault(r)} disabled={!r.is_active || busyId === r.id}
                title={r.is_active ? 'Make default' : 'Turn on first'}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-gray-200 transition-all hover:bg-amber-50 hover:text-amber-600 hover:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Star size={12} /> Set default
              </button>
            )),
          },
        ]}
        rows={rows}
        renderActions={(row) => (
          <ActionGroup>
            <ActionButton type="edit" onClick={() => openEdit(row)} />
          </ActionGroup>
        )}
        emptyText="No payment methods found"
      />

      <Modal open={modalOpen} title={`Edit ${form.name || 'payment method'}`} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Code</label>
            <input value={form.code} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm uppercase text-gray-400" />
            <p className="mt-1 text-xs text-gray-400">Fixed - orders are stored with this code.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Display name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={160}
              placeholder="Shown under the name on the Payment page"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">Display order</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-600">Active</span>
              <div className="flex h-[38px] items-center gap-2">
                <Toggle checked={form.is_active} onChange={() => setForm({ ...form, is_active: !form.is_active })} disabled={form.is_default} label="Active" />
                <span className="text-xs text-gray-500">{form.is_default ? 'Default method stays on' : form.is_active ? 'Shown to customers' : 'Hidden'}</span>
              </div>
            </div>
          </div>
          <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 py-2 text-sm font-semibold text-white disabled:opacity-70">
            {saving && <Loader2 size={16} className="animate-spin" />} Save
          </button>
        </form>
      </Modal>
    </div>
  );
}
