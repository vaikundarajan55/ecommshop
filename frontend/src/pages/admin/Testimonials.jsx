import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Quote, Loader2 } from 'lucide-react';
import { fetchAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '../../store/slices/admin/testimonialSlice';
import { notify } from '../../utils/notify';
import { imageUrl } from '../../utils/imageUrl';
import { confirmDialog } from '../../components/common/ConfirmDialog';
import DataTable from '../../components/admin/common/DataTable';
import Modal from '../../components/admin/common/Modal';
import ImageUpload from '../../components/admin/common/ImageUpload';
import StatusBadge from '../../components/admin/common/StatusBadge';
import ActionButton, { ActionGroup } from '../../components/admin/common/ActionButton';
import Stars from '../../components/common/Stars';

const emptyForm = { id: null, name: '', designation: '', message: '', rating: 5, sort_order: 0, status: 'active', image: null, existingImage: null };
const inputCls = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm';

function Avatar({ name, image, size = 'h-10 w-10' }) {
  if (image) return <img src={imageUrl(image)} alt={name} className={`${size} shrink-0 animate-scaleIn rounded-full object-cover ring-2 ring-white shadow`} />;
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 text-sm font-semibold text-white shadow`}>{initials}</span>;
}

export default function Testimonials() {
  const dispatch = useDispatch();
  const { items: rows, saving } = useSelector((state) => state.testimonials);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => { dispatch(fetchAllTestimonials()); }, [dispatch]);

  const openCreate = () => { setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row) => {
    setForm({ ...emptyForm, ...row, designation: row.designation || '', image: null, existingImage: row.image });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await dispatch(updateTestimonial(form)).unwrap();
        notify.updated('Testimonial updated successfully');
      } else {
        await dispatch(createTestimonial(form)).unwrap();
        notify.created('Testimonial added successfully');
      }
      setModalOpen(false);
    } catch (message) {
      notify.error(message);
    }
  };

  const handleDelete = async (row) => {
    const ok = await confirmDialog({
      title: 'Delete testimonial?',
      message: `The testimonial from "${row.name}" will be permanently deleted.`,
      onConfirm: () => dispatch(deleteTestimonial(row.id)).unwrap(),
    });
    if (!ok) return;
    notify.deleted('Testimonial deleted successfully');
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Testimonials</h2>
          <p className="text-sm text-gray-500">Customer reviews shown on the website home page</p>
        </div>
        <button onClick={openCreate} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white">+ Add Testimonial</button>
      </div>

      <DataTable
        columns={[
          {
            key: 'name', label: 'Customer',
            render: (r) => (
              <div className="flex items-center gap-3">
                <Avatar name={r.name} image={r.image} />
                <div className="min-w-0"><p className="font-medium text-gray-800">{r.name}</p><p className="text-xs text-gray-400">{r.designation || '—'}</p></div>
              </div>
            ),
          },
          { key: 'message', label: 'Message', render: (r) => <p className="line-clamp-2 max-w-md text-gray-600">{r.message}</p> },
          { key: 'rating', label: 'Rating', render: (r) => <Stars value={r.rating} size={14} /> },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
        rows={rows}
        emptyText="No testimonials yet"
        renderActions={(row) => (
          <ActionGroup>
            <ActionButton type="view" onClick={() => { setViewRow(row); setViewOpen(true); }} />
            <ActionButton type="edit" onClick={() => openEdit(row)} />
            <ActionButton type="delete" onClick={() => handleDelete(row)} />
          </ActionGroup>
        )}
      />

      <Modal open={modalOpen} size="max-w-2xl" title={form.id ? 'Edit Testimonial' : 'Add Testimonial'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Photo</label>
            <ImageUpload file={form.image} existing={form.existingImage} onChange={(file) => setForm((f) => ({ ...f, image: file }))} height="h-40" />
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Name</label>
                <input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Designation / city</label>
                <input maxLength={120} placeholder="e.g. Verified buyer, Chennai" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">Message</label>
              <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="mb-1 block text-sm font-medium text-gray-600">Rating</span>
                <div className="flex h-[38px] items-center"><Stars value={Number(form.rating)} onChange={(n) => setForm({ ...form, rating: n })} size={20} /></div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <button disabled={saving} className="flex items-center justify-center gap-2 rounded-md bg-primary-600 py-2 text-sm font-semibold text-white disabled:opacity-70 sm:col-span-2">
            {saving && <Loader2 size={16} className="animate-spin" />} Save
          </button>
        </form>
      </Modal>

      <Modal open={viewOpen} title="Testimonial" onClose={() => setViewOpen(false)}>
        {viewRow && (
          <figure className="animate-scaleIn rounded-2xl bg-gradient-to-br from-primary-50 via-white to-violet-50 p-6 text-center ring-1 ring-primary-100">
            <Quote size={32} className="mx-auto animate-pop text-primary-300" />
            <blockquote className="mt-3 text-gray-700">&ldquo;{viewRow.message}&rdquo;</blockquote>
            <div className="mt-3"><Stars value={viewRow.rating} /></div>
            <figcaption className="mt-4 flex items-center justify-center gap-3">
              <Avatar name={viewRow.name} image={viewRow.image} size="h-12 w-12" />
              <div className="text-left"><p className="font-semibold text-gray-900">{viewRow.name}</p><p className="text-xs text-gray-500">{viewRow.designation}</p></div>
            </figcaption>
            <div className="mt-4"><StatusBadge status={viewRow.status} /></div>
          </figure>
        )}
      </Modal>
    </div>
  );
}
