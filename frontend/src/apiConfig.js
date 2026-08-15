// API Configuration for local development and Render production deployment
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const getApiUrl = (path) => {
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};
