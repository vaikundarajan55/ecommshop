import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const CLOSE_ANIM_MS = 200;

// Rendered into <body> via a portal: the page wrapper in AdminLayout is animated with a
// CSS transform, which would otherwise trap this `fixed` overlay underneath the sticky header.
export default function Modal({ open, title, onClose, children, size = 'max-w-lg' }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const overlayRef = useRef(null);

  // Keep the modal on screen long enough to play the close animation
  useEffect(() => {
    if (open) { setMounted(true); setClosing(false); return; }
    if (!mounted) return;
    setClosing(true);
    const t = setTimeout(() => { setMounted(false); setClosing(false); }, CLOSE_ANIM_MS);
    return () => clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock page scroll and close on Esc while open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key !== 'Escape' || document.querySelector('[data-confirm-dialog]')) return; // confirm dialog on top handles Esc
      // With stacked modals (e.g. invoice over order details) only the top-most one closes
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs[dialogs.length - 1] === overlayRef.current) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[55] flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px] sm:items-center sm:p-6 ${
        closing ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-label={title}
    >
      <div
        className={`my-auto flex max-h-[calc(100dvh-2rem)] w-full ${size} flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] ${
          closing ? 'animate-scaleOut' : 'animate-scaleIn'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="truncate pr-4 text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose} aria-label="Close"
            className="rounded-md p-1 text-gray-400 transition-all duration-150 hover:rotate-90 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>
        {/* Only the body scrolls - header stays visible on long forms */}
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
