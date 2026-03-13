const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function requestJson(path, { method = 'GET', body, token } = {}) {
  const headers = {};

  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`Cannot reach auth server at ${API_BASE}. Start backend or set VITE_API_BASE_URL.`);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return payload;
}

export function registerUser(email, password) {
  return requestJson('/api/auth/register', {
    method: 'POST',
    body: { email, password },
  });
}

export function loginUser(email, password) {
  return requestJson('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function fetchAuthenticatedUser(token) {
  return requestJson('/api/auth/me', {
    method: 'GET',
    token,
  });
}
