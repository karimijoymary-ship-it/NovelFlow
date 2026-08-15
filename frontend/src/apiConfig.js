// API Configuration for local development and Render production deployment
let base = import.meta.env.VITE_API_BASE_URL || '';
if (base && !base.startsWith('http://') && !base.startsWith('https://')) {
  base = `https://${base}`;
}
export const API_BASE = base;

export const getApiUrl = (path) => {
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};
