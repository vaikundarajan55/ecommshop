import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Phone, Reply, CheckCheck, MailOpen, Inbox } from 'lucide-react';
import { fetchContacts, updateContactStatus, deleteContact } from '../../store/slices/admin/contactSlice';
import { notify } from '../../utils/notify';
import { confirmDialog } from '../../components/common/ConfirmDialog';
import DataTable from '../../components/admin/common/DataTable';
import Modal from '../../components/admin/common/Modal';
import ActionButton, { ActionGroup } from '../../components/admin/common/ActionButton';

const STATUS = {
  new: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  read: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  replied: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};
const FILTERS = [['', 'All'], ['new', 'New'], ['read', 'Read'], ['replied', 'Replied']];
const when = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STATUS[status]}`}>
      {status === 'new' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />}
      {status}
    </span>
  );
}

export default function ContactMessages() {
  const dispatch = useDispatch();
  const all = useSelector((state) => state.contacts.items);
  const [filter, setFilter] = useState('');
  const [viewId, setViewId] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const viewRow = all.find((m) => m.id === viewId); // read from the store so status changes show right away

  useEffect(() => { dispatch(fetchContacts()); }, [dispatch]);

  const setStatus = async (row, status, silent = false) => {
    try {
      await dispatch(updateContactStatus({ id: row.id, status })).unwrap();
      if (!silent) notify.updated(`Marked as ${status}`);
    } catch (message) {
      notify.error(message);
    }
  };

  // Opening a new message marks it as read
  const openView = (row) => {
    setViewId(row.id);
    setViewOpen(true);
    if (row.status === 'new') setStatus(row, 'read', true);
  };

  const handleDelete = async (row) => {
    const ok = await confirmDialog({
      title: 'Delete enquiry?',
      message: `The enquiry from "${row.name}" will be permanently deleted.`,
      onConfirm: () => dispatch(deleteContact(row.id)).unwrap(),
    });
    if (!ok) return;
    notify.deleted('Enquiry deleted');
    setViewOpen(false);
  };

  const rows = filter ? all.filter((m) => m.status === filter) : all;
  const count = (s) => (s ? all.filter((m) => m.status === s).length : all.length);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Enquiry</h2>
          <p className="text-sm text-gray-500">Enquiries sent from the website Contact us page</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-gray-100">
          {FILTERS.map(([id, label]) => (
            <button
              key={id} onClick={() => setFilter(id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                filter === id ? 'bg-gradient-to-r from-primary-600 to-violet-600 text-white shadow' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 text-xs ${filter === id ? 'bg-white/25' : 'bg-gray-100'}`}>{count(id)}</span>
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: 'name', label: 'From',
            render: (r) => (
              <div className="min-w-0">
                <p className={`text-gray-800 ${r.status === 'new' ? 'font-semibold' : 'font-medium'}`}>{r.name}</p>
                <p className="text-xs text-gray-400">{r.email}</p>
              </div>
            ),
          },
          {
            key: 'subject', label: 'Subject',
            render: (r) => (
              <div className="max-w-sm">
                <p className={`truncate ${r.status === 'new' ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{r.subject}</p>
                <p className="truncate text-xs text-gray-400">{r.message}</p>
              </div>
            ),
          },
          { key: 'created_at', label: 'Received', render: (r) => <span className="whitespace-nowrap text-gray-500">{when(r.created_at)}</span> },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} /> },
        ]}
        rows={rows}
        emptyText={filter ? `No ${filter} enquiries` : 'No enquiries yet'}
        renderActions={(row) => (
          <ActionGroup>
            <ActionButton type="view" onClick={() => openView(row)} label="Read" />
            <ActionButton type="delete" onClick={() => handleDelete(row)} />
          </ActionGroup>
        )}
      />

      <Modal open={viewOpen} size="max-w-2xl" title="Enquiry" onClose={() => setViewOpen(false)}>
        {viewRow && (
          <div className="space-y-4">
            <div className="flex animate-fadeInUp flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 font-semibold text-white">
                  {viewRow.name.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{viewRow.name}</p>
                  <p className="flex flex-wrap gap-x-3 text-xs text-gray-500">
                    <a href={`mailto:${viewRow.email}`} className="flex items-center gap-1 hover:text-primary-600"><Mail size={12} /> {viewRow.email}</a>
                    {viewRow.phone && <a href={`tel:${viewRow.phone}`} className="flex items-center gap-1 hover:text-primary-600"><Phone size={12} /> {viewRow.phone}</a>}
                  </p>
                </div>
              </div>
              <div className="text-right"><Badge status={viewRow.status} /><p className="mt-1 text-xs text-gray-400">{when(viewRow.created_at)}</p></div>
            </div>

            <div className="animate-fadeInUp rounded-xl bg-gradient-to-br from-gray-50 to-primary-50/40 p-4 ring-1 ring-gray-100" style={{ animationDelay: '80ms' }}>
              <p className="font-semibold text-gray-900">{viewRow.subject}</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">{viewRow.message}</p>
            </div>

            <div className="flex animate-fadeInUp flex-wrap gap-2" style={{ animationDelay: '160ms' }}>
              <a
                href={`mailto:${viewRow.email}?subject=${encodeURIComponent(`Re: ${viewRow.subject}`)}`}
                onClick={() => viewRow.status !== 'replied' && setStatus(viewRow, 'replied', true)}
                className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
              >
                <Reply size={16} /> Reply by email
              </a>
              {viewRow.status !== 'replied' && (
                <button onClick={() => setStatus(viewRow, 'replied')} className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                  <CheckCheck size={16} /> Mark as replied
                </button>
              )}
              {viewRow.status !== 'new' && (
                <button onClick={() => setStatus(viewRow, 'new')} className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <MailOpen size={16} /> Mark as unread
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {all.length === 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400"><Inbox size={16} /> New enquiries appear here as soon as a visitor sends one.</p>
      )}
    </div>
  );
}
