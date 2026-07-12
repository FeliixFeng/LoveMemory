type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

function resolveToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('lm_token'); } catch { return null; }
}

export async function apiFetch<T = unknown>(url: string, opts: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = opts;
  const headers: Record<string, string> = {};
  const authToken = token ?? resolveToken();

  if (body) headers['Content-Type'] = 'application/json';
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: method === 'GET' ? 'no-store' : undefined
  });

  if (res.status === 401) {
    throw new ApiError('需要验证 PIN 码', 401);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || '请求失败', res.status);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }

  get isAuthError() {
    return this.status === 401;
  }
}
