import axios from 'axios';

const siteApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api',
});

siteApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('site_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default siteApi;
