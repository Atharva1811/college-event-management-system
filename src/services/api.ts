import axios, { AxiosError } from 'axios';

export const isMockMode = () => {
  const envMock = import.meta.env.VITE_USE_MOCK_DATA;
  if (typeof envMock === 'string') {
    return envMock.toLowerCase() === 'true';
  }
  // Default to mock mode since MongoDB Atlas is not yet configured
  return true;
};

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'https://college-event-management-system-1qmx.onrender.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cems_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error and 401 token expiry handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token on 401 and redirect to login if not already on auth page
      localStorage.removeItem('cems_token');
      localStorage.removeItem('cems_user');
      if (
        !window.location.pathname.startsWith('/signin') &&
        !window.location.pathname.startsWith('/login')
      ) {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
