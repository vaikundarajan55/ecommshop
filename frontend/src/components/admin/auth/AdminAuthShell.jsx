import Bubbles from '../../common/Bubbles';

// Admin login / forgot / reset layout: animated gradient + floating bubbles behind a glass card
export default function AdminAuthShell({ icon: Icon, title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen animate-gradient items-center justify-center overflow-hidden bg-gradient-to-br from-primary-100 via-white to-violet-100 bg-[length:200%_200%] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 -top-16 h-72 w-72 animate-blob rounded-full bg-primary-100 blur-3xl" />
        <div className="absolute -right-10 top-1/3 h-80 w-80 animate-blob rounded-full bg-violet-200/60 blur-3xl [animation-delay:2s]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 animate-blob rounded-full bg-indigo-200/50 blur-3xl [animation-delay:4s]" />
      </div>
      <Bubbles />

      <div className="relative z-10 w-full max-w-sm sm:max-w-md">
        <div className="animate-scaleIn rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-shadow duration-300 hover:shadow-2xl sm:p-8">
          <div className="mb-6 flex animate-fadeInDown flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 animate-pop items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 text-white shadow-lg shadow-primary-600/30 transition-transform duration-300 hover:rotate-3 hover:scale-105">
              <Icon size={26} />
            </div>
            <h1 className="bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-2xl font-bold text-transparent">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && <div className="mt-5 animate-fadeIn text-center text-sm text-gray-600" style={{ animationDelay: '350ms' }}>{footer}</div>}
      </div>
    </div>
  );
}
