import { Quote } from 'lucide-react';
import { imageUrl } from '../../../utils/imageUrl';
import useReveal from '../../../hooks/useReveal';
import Stars from '../../common/Stars';

function Avatar({ name, image }) {
  if (image) return <img src={imageUrl(image)} alt={name} loading="lazy" className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow" />;
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-500 font-semibold text-white shadow">{initials}</span>;
}

export default function TestimonialsSection({ items }) {
  const [ref, visible] = useReveal();
  if (!items.length) return null;

  return (
    <section ref={ref} className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-rose-50 to-fuchsia-50 py-16">
      <span aria-hidden="true" className="pointer-events-none absolute -left-10 top-10 h-40 w-40 animate-float rounded-full bg-orange-200/40 blur-2xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 bottom-10 h-48 w-48 animate-float rounded-full bg-fuchsia-200/40 blur-2xl [animation-delay:-2s]" />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className={`text-center transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm ring-1 ring-rose-100">
            <Quote size={13} /> Testimonials
          </span>
          <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">What our customers say</h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((t, i) => (
            <figure
              key={t.id}
              className={`group relative flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-700 hover:-translate-y-2 hover:shadow-xl hover:shadow-rose-500/10 ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: visible ? `${150 + i * 100}ms` : '0ms' }}
            >
              <Quote size={40} className="absolute right-5 top-5 text-rose-100 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
              <Stars value={t.rating} />
              <blockquote className="relative mt-3 flex-1 text-sm leading-relaxed text-gray-600">&ldquo;{t.message}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                <Avatar name={t.name} image={t.image} />
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  {t.designation && <p className="text-xs text-gray-500">{t.designation}</p>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
