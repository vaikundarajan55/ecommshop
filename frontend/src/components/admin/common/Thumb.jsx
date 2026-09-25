import { ImageOff } from 'lucide-react';
import { imageUrl } from '../../../utils/imageUrl';

// Small table thumbnail with a placeholder when there is no image
export default function Thumb({ src, alt = '', size = 'h-10 w-10' }) {
  if (!src) {
    return (
      <div className={`flex ${size} items-center justify-center rounded-md bg-gray-100 text-gray-300`}>
        <ImageOff size={16} />
      </div>
    );
  }
  return (
    <img
      src={imageUrl(src)} alt={alt} loading="lazy"
      className={`${size} animate-scaleIn rounded-md border border-gray-200 object-cover transition-transform duration-200 hover:scale-150`}
    />
  );
}
