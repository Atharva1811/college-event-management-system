import axios, { AxiosError } from 'axios';

export const isMockMode = () => {
  const envMock = import.meta.env.VITE_USE_MOCK_DATA;
  if (typeof envMock === 'string') {
    return envMock.toLowerCase() === 'true';
  }
  // Default to normal mode (real backend API & MongoDB Atlas database)
  return false;
};

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'https://college-event-management-system-1qmx.onrender.com/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set or clear the common Authorization header directly on Axios instance
export const setApiAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Initialize with stored token if present on initial load
const initialToken = localStorage.getItem('cems_token');
if (initialToken) {
  setApiAuthToken(initialToken);
}

// Request interceptor to attach or purge JWT token dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cems_token');
    if (config.headers) {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error, 401 token expiry, and 403 suspension handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success?: boolean; message?: string; code?: string }>) => {
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    const base = import.meta.env.BASE_URL || '/';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    const currentPath = window.location.pathname;

    // Requirement 11: Global Suspension Detection & Redirection to /access-denied
    if (
      error.response?.status === 403 &&
      (error.response?.data?.code === 'ACCOUNT_SUSPENDED' ||
        error.response?.data?.message?.toLowerCase().includes('suspended'))
    ) {
      const suspensionMsg =
        error.response?.data?.message ||
        'Your account has been suspended by the administrator.';
      sessionStorage.setItem('cems_suspension_reason', suspensionMsg);
      localStorage.removeItem('cems_token');
      localStorage.removeItem('cems_user');

      if (!currentPath.includes('/access-denied')) {
        window.location.href = `${normalizedBase}access-denied`;
      }
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Clear token on 401 session expiry and redirect to login if not already on auth page
      localStorage.removeItem('cems_token');
      localStorage.removeItem('cems_user');
      if (
        !currentPath.includes('/signin') &&
        !currentPath.includes('/login')
      ) {
        window.location.href = `${normalizedBase}signin`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
