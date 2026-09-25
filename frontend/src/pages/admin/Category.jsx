import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ImageOff } from 'lucide-react';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../store/slices/admin/categorySlice';
import { notify } from '../../utils/notify';
import { imageUrl } from '../../utils/imageUrl';
import { confirmDialog } from '../../components/common/ConfirmDialog';
import DataTable from '../../components/admin/common/DataTable';
import ActionButton, { ActionGroup } from '../../components/admin/common/ActionButton';
import Modal from '../../components/admin/common/Modal';
import ImageUpload from '../../components/admin/common/ImageUpload';
import StatusBadge from '../../components/admin/common/StatusBadge';
import Thumb from '../../components/admin/common/Thumb';
import { nameError, findDuplicate } from '../../utils/validators';

const emptyForm = { id: null, name: '', status: 'active', image: null, existingImage: null };

export default function Category() {
  const dispatch = useDispatch();
  const { items: categories, saving } = useSelector((state) => state.categories);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [viewRow, setViewRow] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

  const openCreate = () => { setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (row) => {
    setForm({ id: row.id, name: row.name, status: row.status, image: null, existingImage: row.image });
    setErrors({});
    setModalOpen(true);
  };

  // Shown while typing: server error, or another category already using this name
  const duplicate = findDuplicate(categories, form.name, form.id);
  const nameProblem = errors.name || (duplicate ? `A category named "${duplicate.name}" already exists` : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = nameError(form.name, 'Category name') || nameProblem;
    if (problem) {
      setErrors({ name: problem });
      return notify.error(problem);
    }
    try {
      if (form.id) {
        await dispatch(updateCategory(form)).unwrap();
        notify.updated('Category updated successfully');
      } else {
        await dispatch(createCategory(form)).unwrap();
        notify.created('Category added successfully');
      }
      setModalOpen(false);
    } catch (err) {
      setErrors(err.errors || {}); // e.g. name already used
      notify.error(err.message);
    }
  };

  const handleDelete = async (row) => {
    const ok = await confirmDialog({
      title: 'Delete category?',
      message: `"${row.name}" and its subcategories will be permanently deleted. This cannot be undone.`,
      onConfirm: () => dispatch(deleteCategory(row.id)).unwrap(),
    });
    if (!ok) return;
    notify.deleted(`Category "${row.name}" deleted successfully`);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Category</h2>
        <button onClick={openCreate} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          + Add Category
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'image', label: 'Image', render: (row) => <Thumb src={row.image} alt={row.name} /> },
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'created_at', label: 'Created' },
        ]}
        rows={categories}
        renderActions={(row) => (
          <ActionGroup>
            <ActionButton type="view" onClick={() => { setViewRow(row); setViewOpen(true); }} />
            <ActionButton type="edit" onClick={() => openEdit(row)} />
            <ActionButton type="delete" onClick={() => handleDelete(row)} />
          </ActionGroup>
        )}
      />

      <Modal open={modalOpen} title={form.id ? 'Edit Category' : 'Add Category'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Name</label>
            <input
              required maxLength={100} value={form.name} aria-invalid={!!nameProblem}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({}); }}
              className={`w-full rounded-md border px-3 py-2 text-sm ${nameProblem ? 'border-red-400' : 'border-gray-300'}`}
            />
            {nameProblem && <p className="mt-1 animate-fadeIn text-xs text-red-600">{nameProblem}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Status</label>
            <select
              value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Image</label>
            <ImageUpload
              file={form.image} existing={form.existingImage}
              onChange={(file) => setForm((f) => ({ ...f, image: file }))}
            />
          </div>
          <button disabled={saving || !!duplicate} className="w-full rounded-md bg-primary-600 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </Modal>

      <Modal open={viewOpen} title="Category Details" onClose={() => setViewOpen(false)}>
        {viewRow && (
          <div className="space-y-4">
            {viewRow.image ? (
              <img src={imageUrl(viewRow.image)} alt={viewRow.name} className="h-56 w-full animate-scaleIn rounded-lg object-cover" />
            ) : (
              <div className="flex h-40 animate-scaleIn flex-col items-center justify-center gap-2 rounded-lg bg-gray-100 text-sm text-gray-400">
                <ImageOff size={28} /> No image
              </div>
            )}
            <dl className="grid animate-fadeInUp grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-gray-500">Name</dt><dd className="font-medium text-gray-800">{viewRow.name}</dd>
              <dt className="text-gray-500">Slug</dt><dd className="text-gray-700">{viewRow.slug}</dd>
              <dt className="text-gray-500">Status</dt><dd><StatusBadge status={viewRow.status} /></dd>
              <dt className="text-gray-500">Created</dt><dd className="text-gray-700">{viewRow.created_at}</dd>
            </dl>
            <button
              onClick={() => { setViewOpen(false); openEdit(viewRow); }}
              className="w-full rounded-md border border-primary-600 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
            >
              Edit this category
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
