// Thin fetch wrapper around the backend API.
// Base URL is configurable via VITE_API_URL; defaults to the local dev server.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// ── Auth token (JWT) ─────────────────────────────────────────────────────────
// Persisted so the session survives reloads; attached as a Bearer header on
// every request. AuthContext owns the lifecycle via the setters below.
const TOKEN_KEY = 'malir-token';

export function setAuthToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
}
export function clearAuthToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}
export function getAuthToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

/**
 * An error thrown for any non-2xx response. Carries the server's friendly
 * message plus the per-field validation map (when present) so forms can render
 * inline errors without redesign.
 */
export class ApiError extends Error {
  constructor(message, { status, fields, unverified } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields || null;
    // True when the server reports an existing-but-unverified account, so the
    // UI can route the user to the resend-verification flow.
    this.unverified = unverified || false;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = {};
  // FormData (multipart file uploads) must be sent as-is — the browser sets the
  // Content-Type with the multipart boundary. Only JSON bodies are stringified.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body != null && !isFormData) headers['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body != null ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal,
    });
  } catch {
    // Network/connection failure — surface a friendly message.
    throw new ApiError('Cannot reach the server. Please check your connection and try again.', {
      status: 0,
    });
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty / non-JSON body (e.g. 204) */
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status}).`;
    throw new ApiError(message, {
      status: res.status,
      fields: data?.fields,
      unverified: data?.unverified,
    });
  }

  return data;
}

export const apiClient = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

export default apiClient;
