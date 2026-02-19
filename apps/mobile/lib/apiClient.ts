import { API_URL, SUPABASE_ANON_KEY } from './config';
import { supabase } from '@/services/supabase';
import { saveSession, clearSession } from '@/lib/secureStore';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function freshSignIn(): Promise<string | null> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (!error && data.session?.access_token) {
    await saveSession(data.session.access_token);
    return data.session.access_token;
  }
  return null;
}

async function ensureAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return session.access_token;
  return freshSignIn();
}

async function makeRequest(
  path: string,
  token: string | null,
  options: RequestInit
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = await ensureAccessToken();
  let res = await makeRequest(path, token, options);

  if (res.status === 401) {
    // Cached session may be stale — sign out, get a fresh token, and retry once.
    await supabase.auth.signOut();
    await clearSession();
    token = await freshSignIn();
    res = await makeRequest(path, token, options);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const message = body ? `API error: ${body}` : `API error (${res.status})`;
    throw new ApiError(message, res.status, body);
  }

  // Handle empty responses
  const text = await res.text();
  if (!text) {
    return {} as T;
  }

  try {
    const json = JSON.parse(text);
    // Backend returns { data: T } for success; unwrap so callers get T directly
    if (json && typeof json === 'object' && 'data' in json && !('error' in json)) {
      return json.data as T;
    }
    return json as T;
  } catch {
    throw new ApiError('Invalid JSON response', res.status, text);
  }
}
