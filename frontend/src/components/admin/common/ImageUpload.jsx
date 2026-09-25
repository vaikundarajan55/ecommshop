import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { notify } from '../../../utils/notify';
import { imageUrl } from '../../../utils/imageUrl';

// Single image picker with animated preview.
//   file      - newly picked File (or null)
//   existing  - stored path of the saved image (edit mode), e.g. '/uploads/1.jpg'
//   onChange  - called with the new File, or null to go back to the saved image
export default function ImageUpload({ file, existing, onChange, height = 'h-44' }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Reset the native input so picking the same file again still fires onChange
  useEffect(() => { if (!file && inputRef.current) inputRef.current.value = ''; }, [file]);

  const pick = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { notify.error('Please choose an image file'); return; }
    onChange(f);
  };

  const shown = preview || imageUrl(existing);

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files[0])} />
      {shown ? (
        <div key={shown} className="group relative animate-scaleIn overflow-hidden rounded-lg border border-gray-200">
          <img src={shown} alt="Preview" className={`${height} w-full animate-fadeIn object-cover`} />
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {preview ? 'New image' : 'Current image'}
          </span>
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button" onClick={() => inputRef.current?.click()}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-transform hover:scale-105"
            >
              Change
            </button>
            {preview && (
              <button
                type="button" onClick={() => onChange(null)} title={existing ? 'Back to current image' : 'Remove'}
                className="rounded-md bg-white p-1.5 text-red-600 transition-transform hover:scale-105"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button" onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
          className={`flex ${height} w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 transition-colors duration-200 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600`}
        >
          <ImagePlus size={28} />
          Click or drop an image (jpg, png, webp)
        </button>
      )}
    </>
  );
}
