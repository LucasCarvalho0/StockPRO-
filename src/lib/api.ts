import axios from 'axios';

const api = axios.create({
  // Chamadas diretas para as API Routes do mesmo projeto Next.js
  baseURL: typeof window !== 'undefined' ? '/api' : `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('stockpro_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('stockpro_token');
      localStorage.removeItem('stockpro_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;
