const normalizeBaseUrl = (value) => value.replace(/\/$/, '');

const shouldUseDevProxy = (configuredBaseUrl) => {
  if (!import.meta.env.DEV) {
    return false;
  }

  if (!configuredBaseUrl) {
    return true;
  }

  try {
    const currentOrigin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:5173';
    const parsedUrl = new URL(configuredBaseUrl, currentOrigin);
    const isLocalBackend = ['localhost', '127.0.0.1'].includes(parsedUrl.hostname);

    return isLocalBackend && parsedUrl.origin !== currentOrigin;
  } catch {
    return false;
  }
};

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL = shouldUseDevProxy(configuredApiBaseUrl)
  ? '/api'
  : normalizeBaseUrl(
      configuredApiBaseUrl || (import.meta.env.DEV ? '/api' : 'http://localhost:8000')
    );

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const buildHeaders = (headers = {}, user) => {
  const requestHeaders = new Headers(headers);

  if (user?.id) {
    requestHeaders.set('X-User-ID', user.id);
  }

  return requestHeaders;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

const request = async (path, { method = 'GET', body, headers, user } = {}) => {
  const requestHeaders = buildHeaders(headers, user);
  const isFormData = body instanceof FormData;

  if (body && !isFormData && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body && !isFormData ? JSON.stringify(body) : body,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null
        ? payload.detail || 'Request failed.'
        : payload || 'Request failed.';

    throw new ApiError(message, response.status, payload);
  }

  return payload;
};

export const api = {
  getBaseUrl: () => API_BASE_URL,
  chat: (user, payload) =>
    request('/chat/', { method: 'POST', body: payload, user }),
  uploadDocument: (user, file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/upload/', {
      method: 'POST',
      body: formData,
      user,
    });
  },
  analyzeCase: (user, payload) =>
    request('/analyze/', { method: 'POST', body: payload, user }),
  listDocuments: (user) => request('/documents/', { user }),
  getDocumentPreviewUrl: (user, documentId) =>
    request(`/documents/${documentId}/preview`, { user }),
  getDocumentDownloadUrl: (user, documentId) =>
    request(`/documents/${documentId}/download`, { user }),
  deleteDocument: (user, documentId) =>
    request(`/documents/${documentId}`, { method: 'DELETE', user }),
  recommendLawyers: (user, payload) =>
    request('/lawyers/recommend', { method: 'POST', body: payload, user }),
};

export { ApiError };
