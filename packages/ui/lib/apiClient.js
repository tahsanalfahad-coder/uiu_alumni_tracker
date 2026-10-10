const getBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL || 'http://localhost:5000';
  const cleanEnv = envUrl.replace(/\/+$/, '');
  return cleanEnv.endsWith('/api') ? cleanEnv.slice(0, -4) : cleanEnv;
};

export const getAuthToken = () => {
  return sessionStorage.getItem('uiu_token');
};

export const getAuthUser = () => {
  const userStr = sessionStorage.getItem('uiu_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setAuthSession = (token, user) => {
  if (token) sessionStorage.setItem('uiu_token', token);
  if (user) sessionStorage.setItem('uiu_user', JSON.stringify(user));
};

export const clearAuthSession = () => {
  sessionStorage.removeItem('uiu_token');
  sessionStorage.removeItem('uiu_user');
};

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const path = cleanEndpoint.startsWith('/api/') || cleanEndpoint === '/api'
    ? cleanEndpoint
    : `/api${cleanEndpoint}`;

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMessage);
    err.status = response.status;
    err.code = data?.error?.code;
    throw err;
  }

  return data;
}

export const api = {
  get: (url, headers = {}) => apiFetch(url, { method: 'GET', headers }),
  post: (url, body, headers = {}) => apiFetch(url, { method: 'POST', body: JSON.stringify(body), headers }),
  patch: (url, body, headers = {}) => apiFetch(url, { method: 'PATCH', body: JSON.stringify(body), headers }),
  delete: (url, headers = {}) => apiFetch(url, { method: 'DELETE', headers })
};

export const apiClient = {
  getUser: getAuthUser,
  getToken: getAuthToken,
  setSession: setAuthSession,
  clearSession: clearAuthSession,
  get: (url, headers = {}) => apiFetch(url, { method: 'GET', headers }),
  post: (url, body, headers = {}) => apiFetch(url, { method: 'POST', body: JSON.stringify(body), headers }),
  patch: (url, body, headers = {}) => apiFetch(url, { method: 'PATCH', body: JSON.stringify(body), headers }),
  delete: (url, headers = {}) => apiFetch(url, { method: 'DELETE', headers })
};
