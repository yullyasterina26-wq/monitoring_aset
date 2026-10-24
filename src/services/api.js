import axios from 'axios';

export function getApiBaseUrl() {
  const custom = localStorage.getItem('custom_api_base_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  return (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
}

export function setCustomApiBaseUrl(url) {
  if (!url || !url.trim()) {
    localStorage.removeItem('custom_api_base_url');
  } else {
    let clean = url.trim().replace(/\/+$/, '');
    // Ensure /api suffix if not present and url looks like http://...:8000
    if (/^https?:\/\/[^/]+(?::\d+)?$/i.test(clean)) {
      clean += '/api';
    }
    localStorage.setItem('custom_api_base_url', clean);
  }
}

export function resetCustomApiBaseUrl() {
  localStorage.removeItem('custom_api_base_url');
}

const api = axios.create({
  headers: {
    'Accept': 'application/json',
    'X-Client-App': 'SIMA-Operator-Mobile',
    'X-App-Version': '1.0.0',
  },
  timeout: 15000,
});

// Request interceptor - attach dynamic base URL & auth token
api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401, 429, network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Clear expired / invalid token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');

        // Dispatch an unauthorized event so AuthContext/UI can react
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));

        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (status === 429) {
        if (!error.response.data?.message) {
          error.response.data = {
            ...(error.response.data || {}),
            message: 'Batas permintaan ke server terlampaui (rate limit). Mohon tunggu beberapa saat sebelum mencoba kembali.',
          };
        }
      } else if (status === 403) {
        if (!error.response.data?.message) {
          error.response.data = {
            ...(error.response.data || {}),
            message: 'Akses ditolak. Akun Anda tidak memiliki izin untuk tindakan ini.',
          };
        }
      }
    } else if (error.request) {
      error.isNetworkError = true;
    }
    return Promise.reject(error);
  }
);

// Helper to test server connectivity
export async function testApiConnection(baseUrl) {
  const url = (baseUrl || getApiBaseUrl()).replace(/\/+$/, '');
  try {
    const res = await axios.get(`${url}/categories`, {
      headers: { Accept: 'application/json' },
      timeout: 5000,
    });
    return { success: res.status >= 200 && res.status < 300, data: res.data };
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.message || err.message || 'Gagal terhubung ke server',
      status: err.response?.status,
    };
  }
}

export default api;
