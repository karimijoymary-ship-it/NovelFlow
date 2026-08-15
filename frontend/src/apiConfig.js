// API Configuration for local development and Render production deployment

// Your live Render backend URL fallback:
const RENDER_BACKEND_FALLBACK = 'https://novelflow-yrk2.onrender.com';

const isProductionRender = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');

let base = import.meta.env.VITE_API_BASE_URL || (isProductionRender ? RENDER_BACKEND_FALLBACK : '');

if (base && !base.startsWith('http://') && !base.startsWith('https://')) {
  base = `https://${base}`;
}

export const API_BASE = base;

export const getApiUrl = (path) => {
  if (!path) return API_BASE;
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};
