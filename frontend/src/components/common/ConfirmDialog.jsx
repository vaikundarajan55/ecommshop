import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { notify, errorMessage } from '../../utils/notify';

// Global confirm dialog. Mount <ConfirmDialogHost /> once; call confirmDialog() from anywhere.
//
//   const ok = await confirmDialog({
//     title: 'Delete category?',
//     message: '"Shoes" will be permanently deleted.',
//     onConfirm: () => api.delete(`/categories/${id}`),   // runs while the dialog shows a spinner
//   });
//
// Resolves true once onConfirm succeeded (after the success animation), false if cancelled or failed.

let openDialog = null;

export const confirmDialog = (options) =>
  new Promise((resolve) => {
    if (!openDialog) { resolve(window.confirm(options.message || options.title)); return; }
    openDialog({ ...options, resolve });
  });

const SUCCESS_HOLD_MS = 900; // how long the "Deleted!" tick stays before the dialog closes
const CLOSE_ANIM_MS = 200;

export function ConfirmDialogHost() {
  const [dialog, setDialog] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | working | done | closing

  useEffect(() => {
    openDialog = (opts) => { setDialog(opts); setPhase('idle'); };
    return () => { openDialog = null; };
  }, []);

  const close = (result) => {
    setPhase('closing');
    setTimeout(() => { dialog.resolve(result); setDialog(null); setPhase('idle'); }, CLOSE_ANIM_MS);
  };

  const handleConfirm = async () => {
    if (!dialog.onConfirm) { close(true); return; }
    setPhase('working');
    try {
      await dialog.onConfirm();
      setPhase('done');
      setTimeout(() => close(true), SUCCESS_HOLD_MS);
    } catch (err) {
      notify.error(errorMessage(err, 'Delete failed'));
      close(false);
    }
  };

  // Esc cancels (but not while the request is running)
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => { if (e.key === 'Escape' && phase === 'idle') close(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!dialog) return null;
  const closing = phase === 'closing';

  return (
    <div
      data-confirm-dialog
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px] ${closing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      onClick={() => phase === 'idle' && close(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl ${closing ? 'animate-scaleOut' : 'animate-scaleIn'}`}
      >
        {phase === 'done' ? (
          <div className="py-4">
            <span className="mx-auto flex h-16 w-16 animate-pop items-center justify-center rounded-full bg-emerald-100">
              <Check size={34} className="text-emerald-600" strokeWidth={3} />
            </span>
            <p className="mt-4 animate-fadeInUp text-lg font-semibold text-gray-800">{dialog.doneText || 'Deleted!'}</p>
          </div>
        ) : (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={30} className={`text-red-600 ${phase === 'idle' ? 'animate-shake' : ''}`} />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-gray-800">{dialog.title || 'Are you sure?'}</h3>
            {dialog.message && <p className="mt-1 text-sm text-gray-500">{dialog.message}</p>}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => close(false)} disabled={phase !== 'idle'}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
              >
                {dialog.cancelText || 'No, cancel'}
              </button>
              <button
                onClick={handleConfirm} disabled={phase !== 'idle'} autoFocus
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-80"
              >
                {phase === 'working' && <Loader2 size={16} className="animate-spin" />}
                {phase === 'working' ? 'Deleting...' : dialog.confirmText || 'Yes, delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
