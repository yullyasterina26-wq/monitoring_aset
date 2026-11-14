import axios from 'axios';

const getResponseCache = new Map();
const inFlightRefreshes = new Map();
const CACHE_REFRESH_MS = 10_000;
let cacheGeneration = 0;

function stableParams(value) {
  if (Array.isArray(value)) return value.map(stableParams);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableParams(value[key]);
      return result;
    }, {});
  }
  return value;
}

function responseCacheKey(url, config = {}) {
  const token = localStorage.getItem('auth_token') || '';
  const base = config.baseURL || getApiBaseUrl();
  return `${token}|${base}|${url}|${JSON.stringify(stableParams(config.params || {}))}`;
}

function isPublicCatalogRequest(config) {
  if (config.method?.toLowerCase() !== 'get') return false;
  const path = String(config.url || '').split('?')[0].replace(/^\/api(?=\/)/, '');
  return path === '/categories' ||
    path === '/assets' ||
    /^\/assets\/(?:by-code\/[^/]+|\d+)\/?$/.test(path);
}

export function getApiBaseUrl() {
  const custom = localStorage.getItem('custom_api_base_url');
  if (custom && custom.trim()) {
    const normalized = normalizeApiBaseUrl(custom);
    if (import.meta.env.DEV) {
      try {
        const apiUrl = new URL(normalized, window.location.origin);
        const frontendHost = window.location.hostname.toLowerCase();
        const apiHost = apiUrl.hostname.toLowerCase();
        const isLoopback = (hostname) => ['localhost', '127.0.0.1', '::1'].includes(hostname);
        const sameLocalHost = apiHost === frontendHost ||
          (isLoopback(apiHost) && isLoopback(frontendHost));

        if (sameLocalHost && apiUrl.port === '8000' && apiUrl.pathname.replace(/\/+$/, '') === '/api') {
          return '/api';
        }
      } catch {
        return normalized;
      }
    }
    return normalized;
  }
  return (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
}

export function getStorageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBaseUrl().replace(/\/api\/?$/i, '');
  const normalizedPath = String(path).replace(/^\/+/, '').replace(/^storage\//i, '');
  return `${base}/storage/${normalizedPath}`;
}

function normalizeApiBaseUrl(url) {
  const clean = url.trim().replace(/\/+$/, '');
  if (/^https?:\/\/[^/]+(?::\d+)?$/i.test(clean)) {
    return `${clean}/api`;
  }
  return clean;
}

export function setCustomApiBaseUrl(url) {
  if (!url || !url.trim()) {
    localStorage.removeItem('custom_api_base_url');
  } else {
    localStorage.setItem('custom_api_base_url', normalizeApiBaseUrl(url));
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

// Reuse recently loaded GET responses on navigation, then refresh them quietly.
const axiosGet = api.get.bind(api);
api.get = (url, config = {}) => {
  if (config.responseType && config.responseType !== 'json') return axiosGet(url, config);

  const key = responseCacheKey(url, config);
  const cached = getResponseCache.get(key);
  const requestGeneration = cacheGeneration;

  if (cached) {
    if (Date.now() - cached.checkedAt >= CACHE_REFRESH_MS && !inFlightRefreshes.has(key)) {
      cached.checkedAt = Date.now();
      const refresh = axiosGet(url, config)
        .then((response) => {
          if (requestGeneration === cacheGeneration) {
            getResponseCache.set(key, { response, checkedAt: Date.now() });
          }
        })
        .catch(() => {})
        .finally(() => inFlightRefreshes.delete(key));
      inFlightRefreshes.set(key, refresh);
    }

    return Promise.resolve({
      ...cached.response,
      config: { ...cached.response.config, ...config },
    });
  }

  return axiosGet(url, config).then((response) => {
    if (requestGeneration === cacheGeneration) {
      getResponseCache.set(key, { response, checkedAt: Date.now() });
      if (getResponseCache.size > 100) getResponseCache.delete(getResponseCache.keys().next().value);
    }
    return response;
  });
};

// Request interceptor - attach dynamic base URL & auth token
api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    if (config.method && config.method.toLowerCase() !== 'get') {
      cacheGeneration += 1;
      getResponseCache.clear();
      inFlightRefreshes.clear();
    }
    const token = localStorage.getItem('auth_token');
    if (token && !isPublicCatalogRequest(config)) {
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
        cacheGeneration += 1;
        getResponseCache.clear();
        inFlightRefreshes.clear();

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
  const url = normalizeApiBaseUrl(baseUrl || getApiBaseUrl());
  try {
    const res = await axios.get(`${url}/categories`, {
      headers: { Accept: 'application/json' },
      timeout: 5000,
    });
    return { success: res.status >= 200 && res.status < 300, data: res.data };
  } catch (err) {
    let apiHost;
    try {
      apiHost = new URL(url).hostname.toLowerCase();
    } catch {
      apiHost = '';
    }

    const isLoopback = (hostname) => ['localhost', '127.0.0.1', '::1'].includes(hostname);
    const canUseDevProxy = import.meta.env.DEV &&
      window.location.port === '5173' &&
      (apiHost === window.location.hostname.toLowerCase() ||
        (isLoopback(apiHost) && isLoopback(window.location.hostname.toLowerCase())));

    if (err.request && canUseDevProxy) {
      try {
        const proxyResponse = await axios.get('/api/categories', {
          headers: { Accept: 'application/json' },
          timeout: 5000,
        });
        return {
          success: proxyResponse.status >= 200 && proxyResponse.status < 300,
          data: proxyResponse.data,
          viaProxy: true,
        };
      } catch (proxyError) {
        return {
          success: false,
          error: proxyError.response?.data?.message || proxyError.message || err.message || 'Gagal terhubung ke server',
          status: proxyError.response?.status,
        };
      }
    }

    return {
      success: false,
      error: err.response?.data?.message || err.message || 'Gagal terhubung ke server',
      status: err.response?.status,
    };
  }
}

export default api;
