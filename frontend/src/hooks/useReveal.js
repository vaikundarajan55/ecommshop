import { useEffect, useState } from 'react';

// Returns [ref, visible]: visible turns true once the element scrolls into view (and stays true).
// `ref` is a callback ref, so it also works for elements that only render after data loads
// (e.g. a section that returns null until its items arrive).
export default function useReveal(options = { threshold: 0.15 }) {
  const [node, setNode] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!node || visible) return undefined;
    if (!('IntersectionObserver' in window)) { setVisible(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, options);
    io.observe(node);
    return () => io.disconnect();
  }, [node, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  return [setNode, visible];
}
