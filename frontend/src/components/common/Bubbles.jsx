// Decorative bubbles that float up from the bottom of their (relative, overflow-hidden) parent.
// Positions/sizes are fixed per index so the layout doesn't jump between renders.
const BUBBLES = Array.from({ length: 18 }, (_, i) => {
  const seed = (n) => ((i + 1) * n) % 100; // cheap deterministic "random" 0-99
  return {
    left: `${seed(37) * 0.97}%`,
    size: 14 + (seed(53) % 60),
    duration: 11 + (seed(29) % 12),
    delay: -((seed(71) % 20)),               // negative delay: bubbles are mid-flight on first paint
    sway: `${(i % 2 ? 1 : -1) * (20 + seed(17) % 50)}px`,
    tone: i % 3,
  };
});

const TONES = [
  'from-primary-500/30 to-violet-400/20 ring-primary-500/30',
  'from-brand-500/30 to-rose-400/20 ring-brand-500/30',
  'from-sky-400/35 to-emerald-300/20 ring-sky-300/40',
];

export default function Bubbles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className={`absolute -bottom-24 animate-bubble rounded-full bg-gradient-to-br ring-1 backdrop-blur-[1px] ${TONES[b.tone]}`}
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            '--sway': b.sway,
          }}
        >
          {/* highlight dot makes it read as a bubble */}
          <span className="absolute left-[22%] top-[18%] h-1/4 w-1/4 rounded-full bg-white/70" />
        </span>
      ))}
    </div>
  );
}
