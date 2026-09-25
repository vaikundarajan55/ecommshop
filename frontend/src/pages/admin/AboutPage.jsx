import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, Save, Info, Target, Eye, ExternalLink } from 'lucide-react';
import { ABOUT_FIELDS as FIELDS, fetchAbout, updateAbout } from '../../store/slices/admin/aboutSlice';
import { notify } from '../../utils/notify';
import { imageUrl } from '../../utils/imageUrl';
import ImageUpload from '../../components/admin/common/ImageUpload';

const inputCls = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

function Section({ title, icon: Icon, delay, children }) {
  return (
    <section className="animate-fadeInUp rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100" style={{ animationDelay: `${delay}ms` }}>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 text-white"><Icon size={15} /></span>
        {title}
      </h3>
      {children}
    </section>
  );
}

// The About page is one record: this screen only edits it (no add / delete)
export default function AboutPage() {
  const dispatch = useDispatch();
  const { data: saved, saving } = useSelector((state) => state.about);
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState(null);

  const pickedImage = form?.image;
  useEffect(() => {
    if (!pickedImage) { setPreview(null); return undefined; }
    const url = URL.createObjectURL(pickedImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pickedImage]);

  useEffect(() => { dispatch(fetchAbout()).unwrap().catch(notify.error); }, [dispatch]);

  // Refill the form whenever the stored record changes (after loading and after each save)
  useEffect(() => {
    if (!saved) return;
    setForm({ ...Object.fromEntries(FIELDS.map((k) => [k, saved[k] || ''])), image: null, existingImage: saved.image });
  }, [saved]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const dirty = form && saved && (FIELDS.some((k) => form[k] !== (saved[k] || '')) || !!form.image);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateAbout(form)).unwrap();
      notify.updated('About page updated successfully');
    } catch (message) {
      notify.error(message);
    }
  };

  if (!form) {
    return <div className="flex h-64 items-center justify-center text-gray-400"><Loader2 className="animate-spin" size={28} /></div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">About Page</h2>
          <p className="text-sm text-gray-500">
            Edit the content of the website About page{saved?.updated_at ? ` · last updated ${new Date(saved.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/about" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ExternalLink size={15} /> View page
          </a>
          <button disabled={saving || !dirty} className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Saving...' : 'Update'}
          </button>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Section title="Page header" icon={Info} delay={0}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Title</label>
                <input required maxLength={150} value={form.title} onChange={set('title')} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Subtitle</label>
                <input maxLength={255} value={form.subtitle} onChange={set('subtitle')} className={inputCls} />
              </div>
            </div>
          </Section>

          <Section title="Our story" icon={Info} delay={80}>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Heading</label>
                <input maxLength={200} value={form.heading} onChange={set('heading')} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Content <span className="font-normal text-gray-400">(blank line = new paragraph)</span></label>
                <textarea rows={6} value={form.content} onChange={set('content')} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Image</label>
                <ImageUpload file={form.image} existing={form.existingImage} onChange={(file) => setForm((f) => ({ ...f, image: file }))} />
              </div>
            </div>
          </Section>

          <Section title="Mission & vision" icon={Target} delay={160}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Mission</label>
                <textarea rows={3} value={form.mission} onChange={set('mission')} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Vision</label>
                <textarea rows={3} value={form.vision} onChange={set('vision')} className={inputCls} />
              </div>
            </div>
          </Section>
        </div>

        {/* Live preview */}
        <aside className="animate-slideInRight overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100 xl:sticky xl:top-24">
          <p className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400"><Eye size={14} /> Preview</p>
          <div className="animate-gradient bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500 bg-[length:200%_200%] px-5 py-6 text-white">
            <p className="text-xl font-extrabold">{form.title || 'Title'}</p>
            {form.subtitle && <p className="mt-1 text-sm text-white/85">{form.subtitle}</p>}
          </div>
          <div className="space-y-3 p-5">
            {(preview || form.existingImage) && (
              <img key={preview || form.existingImage} src={preview || imageUrl(form.existingImage)} alt="" className="aspect-video w-full animate-scaleIn rounded-lg object-cover" />
            )}
            {form.heading && <p className="font-bold text-gray-900">{form.heading}</p>}
            <p className="line-clamp-6 whitespace-pre-line text-sm text-gray-600">{form.content || 'Your story...'}</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg bg-violet-50 p-3"><p className="text-xs font-semibold text-violet-700">Mission</p><p className="line-clamp-3 text-xs text-gray-600">{form.mission || '—'}</p></div>
              <div className="rounded-lg bg-fuchsia-50 p-3"><p className="text-xs font-semibold text-fuchsia-700">Vision</p><p className="line-clamp-3 text-xs text-gray-600">{form.vision || '—'}</p></div>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
