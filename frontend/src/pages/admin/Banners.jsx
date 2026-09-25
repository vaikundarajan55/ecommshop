import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ImageOff, Loader2, ArrowRight } from 'lucide-react';
import { fetchAllBanners, createBanner, updateBanner, deleteBanner } from '../../store/slices/website/bannerSlice';
import { notify } from '../../utils/notify';
import { imageUrl } from '../../utils/imageUrl';
import { confirmDialog } from '../../components/common/ConfirmDialog';
import DataTable from '../../components/admin/common/DataTable';
import Modal from '../../components/admin/common/Modal';
import ImageUpload from '../../components/admin/common/ImageUpload';
import StatusBadge from '../../components/admin/common/StatusBadge';
import Thumb from '../../components/admin/common/Thumb';
import ActionButton, { ActionGroup } from '../../components/admin/common/ActionButton';

const emptyForm = { id: null, title: '', subtitle: '', button_text: '', button_link: '', sort_order: 0, status: 'active', image: null, existingImage: null };
const inputCls = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm';

// How the banner will look on the website home page
function BannerPreview({ title, subtitle, buttonText, image }) {
  return (
    <div className="relative aspect-[21/9] overflow-hidden rounded-lg bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-600">
      {image && <img src={image} alt="" className="absolute inset-0 h-full w-full animate-scaleIn object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
      <div className="relative flex h-full flex-col justify-center p-5 text-white">
        <p className="line-clamp-2 max-w-[70%] animate-fadeInUp text-lg font-bold sm:text-2xl">{title || 'Banner title'}</p>
        {subtitle && <p className="mt-1 line-clamp-2 max-w-[70%] animate-fadeInUp text-xs text-white/85 sm:text-sm">{subtitle}</p>}
        {buttonText && (
          <span className="mt-3 inline-flex w-fit animate-fadeInUp items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-900">
            {buttonText} <ArrowRight size={12} />
          </span>
        )}
      </div>
    </div>
  );
}

export default function Banners() {
  const dispatch = useDispatch();
  const { items: rows, saving } = useSelector((state) => state.banners);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => { dispatch(fetchAllBanners()); }, [dispatch]);

  // Live preview of a newly picked file
  useEffect(() => {
    if (!form.image) { setPreview(null); return undefined; }
    const url = URL.createObjectURL(form.image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.image]);

  const openCreate = () => { setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row) => {
    setForm({ ...emptyForm, ...row, subtitle: row.subtitle || '', button_text: row.button_text || '', button_link: row.button_link || '', image: null, existingImage: row.image });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await dispatch(updateBanner(form)).unwrap();
        notify.updated('Banner updated successfully');
      } else {
        await dispatch(createBanner(form)).unwrap();
        notify.created('Banner added successfully');
      }
      setModalOpen(false);
    } catch (message) {
      notify.error(message);
    }
  };

  const handleDelete = async (row) => {
    const ok = await confirmDialog({
      title: 'Delete banner?',
      message: `"${row.title}" will be removed from the home page. This cannot be undone.`,
      onConfirm: () => dispatch(deleteBanner(row.id)).unwrap(),
    });
    if (!ok) return;
    notify.deleted(`Banner "${row.title}" deleted successfully`);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Banners</h2>
          <p className="text-sm text-gray-500">Slides on the website home page · lowest order shows first</p>
        </div>
        <button onClick={openCreate} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white">+ Add Banner</button>
      </div>

      <DataTable
        columns={[
          { key: 'image', label: 'Image', render: (r) => <Thumb src={r.image} alt={r.title} size="h-10 w-16" /> },
          { key: 'title', label: 'Title', render: (r) => <span className="font-medium text-gray-800">{r.title}</span> },
          { key: 'button_text', label: 'Button', render: (r) => r.button_text ? <span className="text-gray-600">{r.button_text} <span className="text-gray-400">→ {r.button_link || '/'}</span></span> : <span className="text-gray-300">—</span> },
          { key: 'sort_order', label: 'Order' },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
        rows={rows}
        emptyText="No banners yet - add one to show a slideshow on the home page"
        renderActions={(row) => (
          <ActionGroup>
            <ActionButton type="view" onClick={() => { setViewRow(row); setViewOpen(true); }} />
            <ActionButton type="edit" onClick={() => openEdit(row)} />
            <ActionButton type="delete" onClick={() => handleDelete(row)} />
          </ActionGroup>
        )}
      />

      <Modal open={modalOpen} size="max-w-2xl" title={form.id ? 'Edit Banner' : 'Add Banner'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="animate-fadeInUp">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Live preview</p>
            <BannerPreview title={form.title} subtitle={form.subtitle} buttonText={form.button_text} image={preview || imageUrl(form.existingImage)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-600">Title</label>
              <input required maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-600">Subtitle</label>
              <input maxLength={255} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">Button text</label>
              <input maxLength={60} placeholder="Shop now" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">Button link</label>
              <input placeholder="/products" value={form.button_link} onChange={(e) => setForm({ ...form, button_link: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">Display order</label>
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Background image <span className="font-normal text-gray-400">(wide images work best, e.g. 1600×700)</span></label>
            <ImageUpload file={form.image} existing={form.existingImage} onChange={(file) => setForm((f) => ({ ...f, image: file }))} height="h-32" />
          </div>
          <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 py-2 text-sm font-semibold text-white disabled:opacity-70">
            {saving && <Loader2 size={16} className="animate-spin" />} Save
          </button>
        </form>
      </Modal>

      <Modal open={viewOpen} size="max-w-2xl" title="Banner" onClose={() => setViewOpen(false)}>
        {viewRow && (
          <div className="space-y-4">
            <BannerPreview title={viewRow.title} subtitle={viewRow.subtitle} buttonText={viewRow.button_text} image={imageUrl(viewRow.image)} />
            {!viewRow.image && <p className="flex items-center gap-1.5 text-xs text-gray-400"><ImageOff size={14} /> No image - the website shows a gradient instead.</p>}
            <dl className="grid animate-fadeInUp grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Button link</dt><dd className="text-gray-700">{viewRow.button_link || '—'}</dd>
              <dt className="text-gray-500">Order</dt><dd className="text-gray-700">{viewRow.sort_order}</dd>
              <dt className="text-gray-500">Status</dt><dd><StatusBadge status={viewRow.status} /></dd>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}
