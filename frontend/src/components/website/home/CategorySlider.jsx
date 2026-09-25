import { Link } from 'react-router-dom';
import { ArrowRight, ImageOff } from 'lucide-react';
import { imageUrl } from '../../../utils/imageUrl';
import Carousel from './Carousel';

function CategoryCard({ category: c, index }) {
  return (
    <Link
      to={`/products?categoryId=${c.id}`}
      className="group relative block aspect-[4/3] animate-scaleIn overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-rose-100 shadow-sm transition-shadow duration-300 hover:shadow-xl"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {c.image ? (
        <img src={imageUrl(c.image)} alt={c.name} loading="lazy" draggable={false} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
      ) : (
        <div className="flex h-full items-center justify-center text-brand-500/40"><ImageOff size={30} /></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-300 group-hover:from-black/80" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3 text-white">
        <span className="font-semibold drop-shadow">{c.name}</span>
        <span className="flex h-7 w-7 -translate-x-2 items-center justify-center rounded-full bg-white/20 opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

// Home page "Shop by Category" - auto-moving carousel
export default function CategorySlider({ categories }) {
  return (
    <Carousel
      items={categories}
      getKey={(c) => c.id}
      label="categories"
      dotLabel={(c) => c.name}
      renderItem={(c, i) => <CategoryCard category={c} index={i} />}
    />
  );
}
