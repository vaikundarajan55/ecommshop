import { useEffect, useRef } from 'react';
import { socket } from '../services/socket';

// Live website content: calls onUpdate({ type, id }) whenever an admin saves one of `types`
// (banners, testimonials, about, shop, products, categories, subcategories).
// The server broadcasts 'content_updated' to every client, so no room is needed.
export default function useLiveContent(types, onUpdate) {
  const handler = useRef(onUpdate);
  handler.current = onUpdate; // latest closure, without re-subscribing every render
  const key = types.join(',');

  useEffect(() => {
    socket.connect(); // no-op if already connected
    const wanted = key.split(',');
    const listener = (e) => { if (wanted.includes(e.type)) handler.current(e); };
    socket.on('content_updated', listener);
    return () => socket.off('content_updated', listener);
  }, [key]);
}
