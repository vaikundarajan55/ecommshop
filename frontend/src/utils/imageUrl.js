// Images are stored as '/uploads/...' - serve them from the backend origin, not the Vite dev server
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export const imageUrl = (path) => (!path ? null : /^(https?:|blob:|data:)/.test(path) ? path : `${API_ORIGIN}${path}`);
