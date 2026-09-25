import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ImageOff, Loader2, Star, Flame, Minus } from 'lucide-react';
import {
  PRODUCT_FIELDS as FIELDS, fetchProducts, fetchProductById, createProduct, updateProduct, deleteProduct,
  deleteProductImage, setPrimaryProductImage,
} from '../../store/slices/admin/productSlice';
import { fetchCategories } from '../../store/slices/admin/categorySlice';
import { fetchSubcategories } from '../../store/slices/admin/subcategorySlice';
import { notify } from '../../utils/notify';
import { imageUrl } from '../../utils/imageUrl';
import { confirmDialog } from '../../components/common/ConfirmDialog';
import DataTable from '../../components/admin/common/DataTable';
import ActionButton, { ActionGroup } from '../../components/admin/common/ActionButton';
import Modal from '../../components/admin/common/Modal';
import MultiImageUpload from '../../components/admin/common/MultiImageUpload';
import StatusBadge from '../../components/admin/common/StatusBadge';
import Thumb from '../../components/admin/common/Thumb';
import { productErrors, findDuplicate } from '../../utils/validators';

// "Show on home page" options - each maps to a section on the website home page
const HIGHLIGHTS = [
  { id: 'none', label: 'None', text: 'Only in product listing', icon: Minus, on: 'border-gray-400 bg-gray-50 text-gray-700', badge: '' },
  { id: 'featured', label: 'Featured product', text: 'Home > Featured Products', icon: Star, on: 'border-amber-400 bg-amber-50 text-amber-700', badge: 'bg-gradient-to-r from-amber-400 to-orange-500' },
  { id: 'current', label: 'Current product', text: 'Home > Current Products', icon: Flame, on: 'border-rose-400 bg-rose-50 text-rose-700', badge: 'bg-gradient-to-r from-rose-500 to-fuchsia-500' },
];

function HighlightBadge({ value }) {
  const h = HIGHLIGHTS.find((x) => x.id === value);
  if (!h || h.id === 'none') return <span className="text-gray-300">—</span>;
  const Icon = h.icon;
  return (
    <span className={`inline-flex animate-pop items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold text-white shadow-sm ${h.badge}`}>
      <Icon size={11} className={h.id === 'featured' ? 'fill-current' : ''} /> {h.id === 'featured' ? 'Featured' : 'Current'}
    </span>
  );
}

const emptyForm = {
  id: null, category_id: '', subcategory_id: '', name: '', sku: '',
  description: '', price: '', discount_price: '', stock: '', status: 'active', highlight: 'none',
  images: [], existingImages: [],
};

const inputCls = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';
const errorCls = 'w-full rounded-md border border-red-400 px-3 py-2 text-sm transition-colors focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20';
const money = (v) => (v === null || v === undefined || v === '' ? '—' : `₹${Number(v).toLocaleString('en-IN')}`);

// Titled block inside the modal; `delay` staggers the entrance animation
function Section({ title, delay = 0, children }) {
  return (
    <section className="animate-fadeInUp rounded-lg border border-gray-100 bg-gray-50/60 p-4" style={{ animationDelay: `${delay}ms` }}>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h4>
      {children}
    </section>
  );
}

function Field({ label, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-gray-600">{label}</span>
      {children}
      {error && <span className="mt-1 block animate-fadeIn text-xs text-red-600">{error}</span>}
    </label>
  );
}

export default function Product() {
  const dispatch = useDispatch();
  const { items: rows, saving } = useSelector((state) => state.products);
  const categories = useSelector((state) => state.categories.items);
  const subcategories = useSelector((state) => state.subcategories.items);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null); // 'view' | 'edit' - which button shows the spinner
  const [viewData, setViewData] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    dispatch(fetchSubcategories());
  }, [dispatch]);

  // Full product with its images (the list only carries the primary image)
  const fetchProduct = async (id, action) => {
    setLoadingId(id);
    setLoadingAction(action);
    try {
      return await dispatch(fetchProductById(id)).unwrap();
    } catch (message) {
      notify.error(message);
      return null;
    } finally {
      setLoadingId(null);
    }
  };

  const openCreate = () => { setForm(emptyForm); setErrors({}); setModalOpen(true); };

  const openEdit = async (row) => {
    const product = await fetchProduct(row.id, 'edit');
    if (!product) return;
    const values = Object.fromEntries(FIELDS.map((k) => [k, product[k] ?? '']));
    setForm({ ...emptyForm, ...values, id: product.id, existingImages: product.images || [] });
    setErrors({});
    setModalOpen(true);
  };

  // Update one field and clear its error message
  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(({ [key]: _cleared, ...rest }) => rest);
  };
  const cls = (key) => (errors[key] ? errorCls : inputCls);

  const openView = async (row) => {
    const product = await fetchProduct(row.id, 'view');
    if (!product) return;
    const images = [...(product.images || [])].sort((a, b) => b.is_primary - a.is_primary);
    setViewData({ ...product, images });
    setActiveImage(0);
    setViewOpen(true);
  };

  // The thunks reload the list (its thumbnail follows the primary image); this refreshes the open form
  const refreshImages = async () => {
    try {
      const product = await dispatch(fetchProductById(form.id)).unwrap();
      setForm((f) => ({ ...f, existingImages: product.images || [] }));
    } catch (message) {
      notify.error(message);
    }
  };

  const removeExistingImage = async (img) => {
    const ok = await confirmDialog({
      title: 'Remove this image?',
      message: 'The image will be deleted from the product right away.',
      confirmText: 'Yes, remove',
      doneText: 'Removed!',
      onConfirm: () => dispatch(deleteProductImage({ productId: form.id, imageId: img.id })).unwrap(),
    });
    if (!ok) return;
    notify.deleted('Product image removed');
    refreshImages();
  };

  const setPrimaryImage = async (img) => {
    try {
      await dispatch(setPrimaryProductImage({ productId: form.id, imageId: img.id })).unwrap();
      notify.updated('Main image updated');
      refreshImages();
    } catch (message) {
      notify.error(message);
    }
  };

  const changeCategory = (categoryId) => {
    // Clear the subcategory if it doesn't belong to the newly chosen category
    const keepSub = subcategories.some((s) => String(s.id) === String(form.subcategory_id) && String(s.category_id) === String(categoryId));
    setForm({ ...form, category_id: categoryId, subcategory_id: keepSub ? form.subcategory_id : '' });
    setErrors(({ category_id: _c, subcategory_id: _s, ...rest }) => rest);
  };

  // Loaded products (the server checks all of them) already using this name
  const duplicate = findDuplicate(rows, form.name, form.id);
  const nameError = errors.name || (duplicate ? `A product named "${duplicate.name}" already exists` : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = productErrors(form);
    if (!found.name && nameError) found.name = nameError;
    if (Object.keys(found).length) {
      setErrors(found);
      return notify.error(Object.values(found)[0]);
    }
    try {
      if (form.id) {
        await dispatch(updateProduct(form)).unwrap();
        notify.updated('Product updated successfully');
      } else {
        await dispatch(createProduct(form)).unwrap();
        notify.created('Product added successfully');
      }
      setModalOpen(false);
    } catch (err) {
      setErrors(err.errors || {}); // e.g. name or SKU already used
      notify.error(err.message);
    }
  };

  const handleDelete = async (row) => {
    const ok = await confirmDialog({
      title: 'Delete product?',
      message: `"${row.name}" and all its images will be permanently deleted. This cannot be undone.`,
      onConfirm: () => dispatch(deleteProduct(row.id)).unwrap(),
    });
    if (!ok) return;
    notify.deleted(`Product "${row.name}" deleted successfully`);
  };

  const filteredSubcategories = subcategories.filter((s) => !form.category_id || String(s.category_id) === String(form.category_id));
  const discountPct = (p) => (p.discount_price && Number(p.price) > 0
    ? Math.round((1 - Number(p.discount_price) / Number(p.price)) * 100) : 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Product</h2>
        <button onClick={openCreate} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          + Add Product
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'image', label: 'Image', render: (row) => <Thumb src={row.primary_image} alt={row.name} /> },
          { key: 'name', label: 'Name' },
          { key: 'category_name', label: 'Category' },
          { key: 'price', label: 'Price', render: (row) => money(row.price) },
          { key: 'stock', label: 'Stock' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'highlight', label: 'Home page', render: (row) => <HighlightBadge value={row.highlight} /> },
        ]}
        rows={rows}
        renderActions={(row) => (
          <ActionGroup>
            <ActionButton type="view" onClick={() => openView(row)} disabled={!!loadingId} loading={loadingId === row.id && loadingAction === 'view'} />
            <ActionButton type="edit" onClick={() => openEdit(row)} disabled={!!loadingId} loading={loadingId === row.id && loadingAction === 'edit'} />
            <ActionButton type="delete" onClick={() => handleDelete(row)} />
          </ActionGroup>
        )}
      />

      {/* ---------- Add / Edit ---------- */}
      <Modal open={modalOpen} size="max-w-3xl" title={form.id ? 'Edit Product' : 'Add Product'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Section title="Category" delay={0}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category" error={errors.category_id}>
                <select required value={form.category_id} onChange={(e) => changeCategory(e.target.value)} className={cls('category_id')}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Subcategory" error={errors.subcategory_id}>
                <select value={form.subcategory_id} onChange={(e) => set('subcategory_id', e.target.value)} className={cls('subcategory_id')}>
                  <option value="">{form.category_id && !filteredSubcategories.length ? 'No subcategories' : 'Select subcategory'}</option>
                  {filteredSubcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Basic info" delay={60}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" className="sm:col-span-2" error={nameError}>
                <input required maxLength={150} value={form.name} onChange={(e) => set('name', e.target.value)} className={nameError ? errorCls : inputCls} />
              </Field>
              <Field label="SKU" error={errors.sku}>
                <input maxLength={40} value={form.sku} onChange={(e) => set('sku', e.target.value)} className={cls('sku')} placeholder="Optional, e.g. TSHIRT-RED-M" />
              </Field>
              <Field label="Status" error={errors.status}>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className={cls('status')}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="out_of_stock">Out of stock</option>
                </select>
              </Field>
              <Field label="Description" className="sm:col-span-2" error={errors.description}>
                <textarea rows={3} maxLength={5000} value={form.description} onChange={(e) => set('description', e.target.value)} className={cls('description')} />
              </Field>
              <div className="sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-gray-600">Show on home page</span>
                <div role="radiogroup" aria-label="Show on home page" className="grid gap-2 sm:grid-cols-3">
                  {HIGHLIGHTS.map(({ id, label, text, icon: Icon, on }) => {
                    const selected = (form.highlight || 'none') === id;
                    return (
                      <button
                        key={id} type="button" role="radio" aria-checked={selected}
                        onClick={() => setForm({ ...form, highlight: id })}
                        className={`flex items-center gap-2.5 rounded-lg border-2 px-3 py-2 text-left transition-all duration-300 ${
                          selected ? `${on} scale-[1.02] shadow-sm` : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={18} className={`shrink-0 transition-transform duration-300 ${selected ? 'scale-125' : ''} ${selected && id === 'featured' ? 'fill-current' : ''}`} />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{label}</span>
                          <span className="block truncate text-[11px] opacity-75">{text}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Pricing & stock" delay={120}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Price (₹)" error={errors.price}>
                <input type="number" min="0.01" step="0.01" required value={form.price} onChange={(e) => set('price', e.target.value)} className={cls('price')} />
              </Field>
              <Field label="Discount price (₹)" error={errors.discount_price}>
                <input type="number" min="0" step="0.01" value={form.discount_price} onChange={(e) => set('discount_price', e.target.value)} className={cls('discount_price')} placeholder="Optional" />
              </Field>
              <Field label="Stock" error={errors.stock}>
                <input type="number" min="0" step="1" value={form.stock} onChange={(e) => set('stock', e.target.value)} className={cls('stock')} />
              </Field>
            </div>
            {discountPct(form) > 0 && (
              <p className="mt-2 animate-fadeIn text-xs font-medium text-emerald-600">{discountPct(form)}% off for customers</p>
            )}
          </Section>

          <Section title={`Images${form.existingImages.length ? ` (${form.existingImages.length} saved)` : ''}`} delay={180}>
            <MultiImageUpload
              existing={form.existingImages}
              files={form.images}
              onFilesChange={(images) => setForm((f) => ({ ...f, images }))}
              onRemoveExisting={removeExistingImage}
              onSetPrimary={setPrimaryImage}
            />
          </Section>

          <button
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-700 active:scale-[0.99] disabled:opacity-70"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </Modal>

      {/* ---------- View ---------- */}
      <Modal open={viewOpen} size="max-w-3xl" title="Product Details" onClose={() => setViewOpen(false)}>
        {viewData && (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="animate-fadeInUp">
              {viewData.images.length ? (
                <>
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img
                      key={activeImage}
                      src={imageUrl(viewData.images[activeImage]?.image)} alt={viewData.name}
                      className="aspect-square w-full animate-scaleIn object-cover"
                    />
                  </div>
                  {viewData.images.length > 1 && (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {viewData.images.map((img, idx) => (
                        <button
                          key={img.id} type="button" onClick={() => setActiveImage(idx)}
                          className={`aspect-square animate-scaleIn overflow-hidden rounded-md border-2 transition-all duration-200 ${
                            idx === activeImage ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          style={{ animationDelay: `${idx * 40}ms` }}
                        >
                          <img src={imageUrl(img.image)} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg bg-gray-100 text-sm text-gray-400">
                  <ImageOff size={32} /> No images
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="animate-fadeInUp" style={{ animationDelay: '60ms' }}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-800">{viewData.name}</h3>
                  <StatusBadge status={viewData.status} />
                  <HighlightBadge value={viewData.highlight} />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {viewData.category_name}{viewData.subcategory_name ? ` › ${viewData.subcategory_name}` : ''}
                  {viewData.sku ? ` · SKU ${viewData.sku}` : ''}
                </p>
              </div>

              <Section title="Pricing & stock" delay={120}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-800">{money(viewData.discount_price || viewData.price)}</span>
                  {viewData.discount_price ? (
                    <>
                      <span className="text-sm text-gray-400 line-through">{money(viewData.price)}</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{discountPct(viewData)}% off</span>
                    </>
                  ) : null}
                </div>
                <p className={`mt-2 text-sm font-medium ${Number(viewData.stock) > 0 ? 'text-gray-700' : 'text-red-600'}`}>
                  {Number(viewData.stock) > 0 ? `${viewData.stock} in stock` : 'Out of stock'}
                </p>
              </Section>

              <Section title="Description" delay={180}>
                <p className="whitespace-pre-line text-sm text-gray-600">{viewData.description || 'No description'}</p>
              </Section>

              <p className="animate-fadeIn text-xs text-gray-400" style={{ animationDelay: '240ms' }}>
                Created {viewData.created_at}{viewData.updated_at ? ` · Updated ${viewData.updated_at}` : ''}
              </p>

              <button
                onClick={() => { setViewOpen(false); openEdit(viewData); }}
                className="w-full rounded-md border border-primary-600 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
              >
                Edit this product
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
