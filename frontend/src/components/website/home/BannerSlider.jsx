import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { imageUrl } from '../../../utils/imageUrl';

const INTERVAL_MS = 5500;

// Button: internal paths use the router, full URLs open in a new tab
function BannerButton({ banner }) {
  if (!banner.button_text) return null;
  const cls = 'group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg transition-transform hover:scale-105';
  const inner = <>{banner.button_text} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>;
  const link = banner.button_link || '/products';
  return link.startsWith('/')
    ? <Link to={link} className={cls}>{inner}</Link>
    : <a href={link} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
}

// Home page slideshow: auto-plays, pauses on hover/focus, arrows, dots and swipe
export default function BannerSlider({ banners }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const count = banners.length;

  const go = useCallback((i) => setIndex((i + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return undefined;
    const t = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, paused, count, go]);

  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    touchX.current = null;
  };

  return (
    <section
      className="relative h-[420px] overflow-hidden bg-gray-900 sm:h-[500px]"
      aria-roledescription="carousel" aria-label="Featured offers"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }} onTouchEnd={onTouchEnd}
    >
      {banners.map((b, i) => {
        const active = i === index;
        return (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${active ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
            aria-hidden={!active} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}
          >
            {b.image ? (
              <img
                src={imageUrl(b.image)} alt="" loading={i === 0 ? 'eager' : 'lazy'}
                className={`h-full w-full object-cover transition-transform ease-out ${active ? 'scale-110 duration-[6000ms]' : 'scale-100 duration-0'}`}
              />
            ) : (
              <div className="h-full w-full animate-gradient bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-600 bg-[length:200%_200%]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

            {/* key on index replays the text animation for each slide */}
            {active && (
              <div key={index} className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-center px-6 text-white sm:px-8">
                <h2 className="max-w-2xl animate-fadeInUp text-3xl font-extrabold leading-tight drop-shadow sm:text-5xl">{b.title}</h2>
                {b.subtitle && <p className="mt-4 max-w-xl animate-fadeInUp text-base text-white/85 sm:text-lg" style={{ animationDelay: '150ms' }}>{b.subtitle}</p>}
                <div className="mt-7 animate-fadeInUp" style={{ animationDelay: '300ms' }}><BannerButton banner={b} /></div>
              </div>
            )}
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button onClick={() => go(index - 1)} aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white ring-1 ring-white/30 backdrop-blur transition-all hover:scale-110 hover:bg-white/30 sm:block">
            <ChevronLeft size={22} />
          </button>
          <button onClick={() => go(index + 1)} aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white ring-1 ring-white/30 backdrop-blur transition-all hover:scale-110 hover:bg-white/30 sm:block">
            <ChevronRight size={22} />
          </button>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {banners.map((b, i) => (
              <button key={b.id} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} aria-current={i === index}
                className={`h-2.5 overflow-hidden rounded-full bg-white/40 transition-all duration-500 ${i === index ? 'w-10' : 'w-2.5 hover:bg-white/70'}`}>
                {/* progress fill for the current slide */}
                {i === index && (
                  <span
                    key={`${index}-${paused}`}
                    className={`block h-full origin-left bg-white ${paused ? 'w-full' : 'animate-shrink'}`}
                    style={{ animationDuration: `${INTERVAL_MS}ms`, animationDirection: 'reverse' }}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
