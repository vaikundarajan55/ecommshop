import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Images, Star, X } from 'lucide-react';
import { notify } from '../../../utils/notify';
import { imageUrl } from '../../../utils/imageUrl';

// Multi-image grid for products.
//   existing        - saved images [{ id, image, is_primary }] (edit mode)
//   files           - newly picked Files, uploaded on Save
//   onFilesChange   - (files) => void
//   onRemoveExisting / onSetPrimary - (image) => void, for saved images
//   max             - max new files per save (matches upload.array('images', 6) on the backend)
export default function MultiImageUpload({ existing = [], files, onFilesChange, onRemoveExisting, onSetPrimary, max = 6 }) {
  const inputRef = useRef(null);

  const [previews, setPreviews] = useState([]);
  useEffect(() => {
    const next = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews(next);
    return () => next.forEach((p) => URL.revokeObjectURL(p.url));
  }, [files]);

  const addFiles = (list) => {
    const images = Array.from(list || []).filter((f) => f.type.startsWith('image/'));
    if (images.length < (list?.length || 0)) notify.error('Only image files are allowed');
    const room = max - files.length;
    if (images.length > room) notify.error(`You can add up to ${max} new images at a time`);
    if (images.length && room > 0) onFilesChange([...files, ...images.slice(0, room)]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeNew = (file) => onFilesChange(files.filter((f) => f !== file));
  const noPrimaryYet = !existing.some((img) => img.is_primary);
  const isEmpty = !existing.length && !files.length;

  const input = (
    <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
  );

  // Nothing picked yet: one big drop area that makes multi-select obvious
  if (isEmpty) {
    return (
      <div>
        {input}
        <button
          type="button" onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-8 text-center transition-colors duration-200 hover:border-primary-500 hover:bg-primary-50"
        >
          <span className="flex h-12 w-12 animate-pop items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <Images size={24} />
          </span>
          <span className="text-sm font-semibold text-gray-700">Click to choose images, or drag them here</span>
          <span className="text-xs text-gray-500">
            Select several at once (hold Ctrl / Shift) · up to {max} images · jpg, png or webp, max 5 MB each
          </span>
        </button>
      </div>
    );
  }

  return (
    <div>
      {input}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {existing.map((img, idx) => (
          <div
            key={`saved-${img.id}`}
            className={`group relative aspect-square animate-scaleIn overflow-hidden rounded-lg border-2 ${img.is_primary ? 'border-amber-400' : 'border-gray-200'}`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <img src={imageUrl(img.image)} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
            {img.is_primary ? (
              <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                <Star size={10} fill="currentColor" /> Main
              </span>
            ) : null}
            <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {!img.is_primary ? (
                <button type="button" onClick={() => onSetPrimary(img)} title="Set as main image"
                  className="rounded-md bg-white/90 p-1 text-amber-500 transition-transform hover:scale-110">
                  <Star size={13} />
                </button>
              ) : <span />}
              <button type="button" onClick={() => onRemoveExisting(img)} title="Remove image"
                className="rounded-md bg-white/90 p-1 text-red-600 transition-transform hover:scale-110">
                <X size={13} />
              </button>
            </div>
          </div>
        ))}

        {previews.map(({ file, url }, idx) => (
          <div
            key={url}
            className="group relative aspect-square animate-scaleIn overflow-hidden rounded-lg border-2 border-dashed border-primary-400"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <img src={url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
            <span className="absolute left-1 top-1 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
              {noPrimaryYet && idx === 0 ? 'New · Main' : 'New'}
            </span>
            <button type="button" onClick={() => removeNew(file)} title="Remove"
              className="absolute right-1 top-1 rounded-md bg-white/90 p-1 text-red-600 opacity-0 transition-all hover:scale-110 group-hover:opacity-100">
              <X size={13} />
            </button>
          </div>
        ))}

        {files.length < max && (
          <button
            type="button" onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-500 transition-colors duration-200 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600"
          >
            <ImagePlus size={22} />
            Add images
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-gray-400">You can pick several images at once. New images upload when you click Save.</span>
        <span className={`rounded-full px-2 py-0.5 font-medium ${files.length >= max ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
          {files.length} / {max} new selected
        </span>
      </div>
    </div>
  );
}
