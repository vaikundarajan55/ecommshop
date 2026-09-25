import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Info, Truck, ShieldCheck, RotateCcw, Headphones, Sparkles, HeartHandshake, ArrowRight, Target, Eye } from 'lucide-react';
import { fetchAbout } from '../../store/slices/website/cmsSlice';
import { imageUrl } from '../../utils/imageUrl';
import useSeo from '../../hooks/useSeo';
import useReveal from '../../hooks/useReveal';
import PageHero from '../../components/website/common/PageHero';

const VALUES = [
  { icon: Truck, title: 'Fast delivery', text: 'Orders are packed quickly and you can follow every step with live tracking.', color: 'from-violet-500 to-purple-600' },
  { icon: ShieldCheck, title: 'Secure checkout', text: 'Pay with cash on delivery, cards, UPI or net banking - your details stay protected.', color: 'from-fuchsia-500 to-pink-600' },
  { icon: RotateCcw, title: 'Easy returns', text: 'Something not right? Returns are simple and our team is here to help.', color: 'from-purple-500 to-indigo-600' },
  { icon: Headphones, title: 'Real support', text: 'Questions about an order? Reach a real person who can sort it out.', color: 'from-pink-500 to-rose-500' },
];

// Used if the About content can't be loaded
const FALLBACK = {
  title: 'About ShopEase',
  subtitle: 'Everyday essentials, delivered with care.',
  heading: 'Shopping that feels simple and friendly',
  content: 'ShopEase brings electronics, fashion and home essentials together in one place.',
};

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function About() {
  const dispatch = useDispatch();
  const { about: loaded, aboutFailed } = useSelector((s) => s.cms);
  const about = loaded || (aboutFailed ? FALLBACK : null);

  useEffect(() => { dispatch(fetchAbout()); }, [dispatch]);

  const page = about || FALLBACK;
  useSeo({ title: 'About us', description: page.subtitle ? `${page.subtitle} ${page.content || ''}` : undefined, image: about?.image ? imageUrl(about.image) : undefined });

  // Blank lines in the admin text become separate paragraphs
  const paragraphs = String(page.content || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div>
      <PageHero theme="about" icon={Info} title={page.title} subtitle={page.subtitle} crumbs={[{ label: 'About' }]} />

      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Story */}
        {!about ? (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">{[60, 90, 80, 70].map((w, i) => <div key={i} className="h-4 animate-shimmer rounded bg-gradient-to-r from-gray-100 via-white to-gray-100 bg-[length:200%_100%]" style={{ width: `${w}%` }} />)}</div>
            <div className="aspect-square max-w-sm animate-shimmer rounded-[2rem] bg-gradient-to-r from-gray-100 via-white to-gray-100 bg-[length:200%_100%]" />
          </div>
        ) : (
          <Reveal className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                <Sparkles size={13} /> Our story
              </span>
              {page.heading && (
                <h2 className="mt-3 bg-gradient-to-r from-gray-900 via-violet-800 to-fuchsia-700 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">{page.heading}</h2>
              )}
              {paragraphs.map((p, i) => (
                <p key={i} className="mt-4 animate-fadeInUp whitespace-pre-line leading-relaxed text-gray-600" style={{ animationDelay: `${150 + i * 100}ms` }}>{p}</p>
              ))}
            </div>
            <div className="relative mx-auto aspect-square w-full max-w-sm">
              <div className="absolute inset-0 animate-float rounded-[2rem] bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-2xl [--tilt:-4deg]" />
              {page.image ? (
                <img src={imageUrl(page.image)} alt={page.heading || page.title} className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] animate-scaleIn rounded-[1.5rem] object-cover shadow-xl" />
              ) : (
                <div className="absolute inset-6 flex flex-col items-center justify-center rounded-[1.5rem] bg-white/15 text-center text-white ring-1 ring-white/30 backdrop-blur">
                  <HeartHandshake size={64} className="animate-pop" />
                  <p className="mt-4 px-6 text-lg font-semibold">Made for customers who value their time</p>
                </div>
              )}
            </div>
          </Reveal>
        )}

        {/* Mission & vision */}
        {(page.mission || page.vision) && (
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {[
              { icon: Target, title: 'Our mission', text: page.mission, color: 'from-violet-600 to-purple-600' },
              { icon: Eye, title: 'Our vision', text: page.vision, color: 'from-fuchsia-600 to-pink-600' },
            ].filter((b) => b.text).map(({ icon: Icon, title, text, color }, i) => (
              <Reveal key={title} delay={i * 120}>
                <div className={`group relative h-full overflow-hidden rounded-3xl bg-gradient-to-br ${color} p-7 text-white shadow-xl transition-transform duration-500 hover:-translate-y-1`}>
                  <span className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-150" />
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur"><Icon size={24} /></span>
                  <h3 className="relative mt-4 text-xl font-bold">{title}</h3>
                  <p className="relative mt-2 whitespace-pre-line leading-relaxed text-white/90">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* Values */}
        <Reveal className="mt-16">
          <h2 className="text-center text-2xl font-bold text-gray-900">Why shop with us</h2>
          <p className="mt-1 text-center text-sm text-gray-500">What you can count on with every order</p>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text, color }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="group h-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-violet-500/10">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA */}
        <Reveal className="mt-16">
          <div className="relative animate-gradient overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 bg-[length:200%_200%] px-6 py-10 text-center text-white shadow-xl sm:px-12">
            <h2 className="text-2xl font-bold">Ready to start shopping?</h2>
            <p className="mt-2 text-white/85">Browse the full catalogue - or get in touch if you have a question.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-violet-700 shadow transition-transform hover:scale-105">
                Shop now <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/60 transition-colors hover:bg-white/10">
                Contact us
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
