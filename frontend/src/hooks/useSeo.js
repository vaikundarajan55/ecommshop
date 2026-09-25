import { useEffect } from 'react';

const SITE_NAME = 'ShopEase';
const DEFAULT_DESCRIPTION = 'Shop electronics, fashion and home essentials at ShopEase - secure checkout, fast delivery and live order tracking.';
// Public site origin for canonical/og:url. Set VITE_SITE_URL in production (e.g. https://www.shopease.com).
const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

// Create or update a <meta>/<link> tag in <head>
const upsert = (selector, create, attrs) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
};
const meta = (key, content, attr = 'name') =>
  upsert(`meta[${attr}="${key}"]`, () => { const m = document.createElement('meta'); m.setAttribute(attr, key); return m; }, { content });

/**
 * Per-page SEO for this client-rendered app.
 *   useSeo({ title, description, image, path, noindex, jsonLd })
 * - title       -> "<title> | ShopEase" (home page passes no title)
 * - noindex     -> robots noindex,nofollow (admin, account, cart and auth pages)
 * - jsonLd      -> schema.org object rendered as <script type="application/ld+json">
 */
export default function useSeo({ title, description = DEFAULT_DESCRIPTION, image, path, noindex = false, jsonLd } = {}) {
  const jsonKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Shop online with fast delivery`;
    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    const desc = String(description || DEFAULT_DESCRIPTION).replace(/\s+/g, ' ').trim().slice(0, 160);

    document.title = fullTitle;
    meta('description', desc);
    meta('robots', noindex ? 'noindex, nofollow' : 'index, follow');
    upsert('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; }, { href: url });

    meta('og:site_name', SITE_NAME, 'property');
    meta('og:type', jsonLd?.['@type'] === 'Product' ? 'product' : 'website', 'property');
    meta('og:title', fullTitle, 'property');
    meta('og:description', desc, 'property');
    meta('og:url', url, 'property');
    meta('twitter:card', image ? 'summary_large_image' : 'summary');
    meta('twitter:title', fullTitle);
    meta('twitter:description', desc);
    if (image) {
      meta('og:image', image, 'property');
      meta('twitter:image', image);
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
      document.head.querySelector('meta[name="twitter:image"]')?.remove();
    }

    let script = document.getElementById('page-jsonld');
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'page-jsonld';
        document.head.appendChild(script);
      }
      script.textContent = jsonKey;
    } else {
      script?.remove();
    }
  }, [title, description, image, path, noindex, jsonKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
