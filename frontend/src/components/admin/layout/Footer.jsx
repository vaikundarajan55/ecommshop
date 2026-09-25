import { Heart } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="animate-fadeInUp border-t border-gray-200 bg-white/80 px-4 py-3 text-center text-xs text-gray-500 backdrop-blur-sm sm:px-6">
      <p className="flex flex-wrap items-center justify-center gap-1">
        © {year} Admin Panel. Made with
        <Heart size={12} className="inline-block animate-pulse fill-red-500 text-red-500" />
        All rights reserved.
      </p>
    </footer>
  );
}
