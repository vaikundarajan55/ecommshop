import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SWIPE_PX = 40;

// Cards visible at once: 2 on phones, 3 on tablets, 4 on desktop
export const defaultPerView = (w) => (w >= 1024 ? 4 : w >= 640 ? 3 : 2);

/**
 * Auto-moving carousel used on the home page (categories, featured/current products).
 * - moves one card every `interval` ms and loops seamlessly (first cards are cloned at the end)
 * - fewer items than fit on screen are repeated so the row can still loop
 * - pauses on hover / focus / touch and while the tab is hidden; no autoplay with reduced motion
 * - arrows, dots and swipe
 *
 *   <Carousel items={list} getKey={(p) => p.id} label="Featured products" renderItem={(p, i) => <Card ... />} />
 */
export default function Carousel({ items: source, renderItem, getKey, label, interval = 3000, perViewFor = defaultPerView, dotLabel = () => '' }) {
  const [perView, setPerView] = useState(() => perViewFor(window.innerWidth));
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true); // false = jump without transition (loop reset)
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const reducedMotion = useRef(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const real = source.length;
  const base = real > 1 && real <= perView
    ? Array.from({ length: Math.ceil((perView + 1) / real) }, () => source).flat()
    : source;
  const count = base.length;
  const slides = real > 1 && count > perView;
  const items = slides ? [...base, ...base.slice(0, perView)] : base;

  useEffect(() => {
    const onResize = () => setPerView(perViewFor(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [perViewFor]);

  // Layout changed (resize / new data) -> start again from the first card
  useEffect(() => { setAnimate(false); setIndex(0); }, [perView, count]);

  // Turn the transition back on one frame after an instant jump
  useEffect(() => {
    if (animate) return undefined;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  const next = useCallback(() => {
    if (!slides) return;
    setAnimate(true);
    setIndex((i) => Math.min(i + 1, count));
  }, [slides, count]);

  const prev = useCallback(() => {
    if (!slides) return;
    if (index === 0) {
      // Jump (invisibly) to the cloned copy at the end, then slide back one
      setAnimate(false);
      setIndex(count);
      requestAnimationFrame(() => requestAnimationFrame(() => { setAnimate(true); setIndex(count - 1); }));
    } else {
      setAnimate(true);
      setIndex((i) => i - 1);
    }
  }, [slides, index, count]);

  // Reached the clones -> snap back to the real first card without animation
  const onTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return; // ignore transitions bubbling up from the cards
    if (index >= count) {
      setAnimate(false);
      setIndex(0);
    }
  };

  useEffect(() => {
    if (!slides || paused || reducedMotion.current) return undefined;
    const id = setInterval(() => { if (!document.hidden) next(); }, interval);
    return () => clearInterval(id);
  }, [slides, paused, next, interval]);

  // Events from portals (e.g. a Quick view modal opened from a card) bubble here too - ignore those
  const inside = (e) => e.currentTarget.contains(e.target);
  const onTouchStart = (e) => {
    if (!inside(e)) return;
    touchX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx <= -SWIPE_PX) next();
    else if (dx >= SWIPE_PX) prev();
    touchX.current = null;
    setPaused(false);
  };

  const active = real ? index % real : 0; // dot = real item, not a repeat
  const arrowCls = 'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg ring-1 ring-gray-100 backdrop-blur transition-all duration-200 hover:scale-110 hover:bg-white hover:text-brand-600 active:scale-95';

  return (
    <div
      className="group/slider relative"
      role="region" aria-roledescription="carousel" aria-label={label}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={(e) => inside(e) && setPaused(true)} onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      {/* vertical padding gives card hover lift/shadow room inside the clipped track */}
      <div className="-mx-2 -my-3 overflow-hidden py-3">
        <div
          className={`flex ${animate ? 'transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]' : ''}`}
          style={{ transform: `translateX(-${(index * 100) / perView}%)` }}
          onTransitionEnd={onTransitionEnd}
        >
          {items.map((item, i) => (
            <div
              key={`${getKey(item)}-${i}`}
              className="shrink-0 px-2"
              style={{ width: `${100 / perView}%` }}
              aria-hidden={slides && (i < index || i >= index + perView) ? true : undefined}
            >
              {renderItem(item, Math.min(i, perView))}
            </div>
          ))}
        </div>
      </div>

      {slides && (
        <>
          <button type="button" onClick={prev} aria-label={`Previous ${label}`} className={`${arrowCls} -left-3 sm:-left-5 sm:opacity-0 sm:group-hover/slider:opacity-100 sm:focus-visible:opacity-100`}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={next} aria-label={`Next ${label}`} className={`${arrowCls} -right-3 sm:-right-5 sm:opacity-0 sm:group-hover/slider:opacity-100 sm:focus-visible:opacity-100`}>
            <ChevronRight size={20} />
          </button>

          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {source.map((item, i) => (
              <button
                key={getKey(item)} type="button" onClick={() => { setAnimate(true); setIndex(i); }}
                aria-label={`Go to ${dotLabel(item) || `item ${i + 1}`}`} aria-current={i === active ? 'true' : undefined}
                className={`h-2 rounded-full transition-all duration-500 ${i === active ? 'w-6 bg-gradient-to-r from-brand-500 to-rose-500' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
