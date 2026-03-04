import { supabase } from '@/services/supabase';
import { saveSession, clearSession } from '@/lib/secureStore';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/config';

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

const TOKEN_EXPIRY_BUFFER_MS = 60_000; // treat as expired 1 min before actual expiry

function isSessionValid(session: { access_token?: string; expires_at?: number } | null): boolean {
  if (!session?.access_token) return false;
  const expiresAt = session.expires_at;
  if (expiresAt == null) return true; // no expiry info, assume valid
  return expiresAt * 1000 > Date.now() + TOKEN_EXPIRY_BUFFER_MS;
}

/** True if token is a real user session JWT; false for anon key (must not be sent as Bearer for Edge Functions). */
function isUserToken(token: string | null): boolean {
  if (!token) return false;
  return token !== SUPABASE_ANON_KEY;
}

/** Returns the access token to use for API calls. Caller must use this token; do not rely on getSession() again (storage may not be synced). */
async function ensureSession(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();

  if (isSessionValid(session) && isUserToken(session?.access_token ?? null)) {
    return session!.access_token!;
  }

  if (session?.refresh_token) {
    const { data: refreshData, error } = await supabase.auth.refreshSession();
    if (!error && isSessionValid(refreshData.session) && isUserToken(refreshData.session?.access_token ?? null)) {
      const token = refreshData.session!.access_token!;
      await saveSession(token);
      return token;
    }
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (!error && data.session?.access_token) {
    await saveSession(data.session.access_token);
    return data.session.access_token;
  }
  return null;
}

function functionName(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path;
}

/** Decode JWT payload without verifying (dev debugging only). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = (globalThis as unknown as { atob(s: string): string }).atob(base64);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Call Edge Function with fetch (avoids Supabase Functions client's setTimeout/AbortController path that can cause errors in some environments). */
async function invokeEdgeFunction<T>(
  name: string,
  accessToken: string,
  method: string,
  body: unknown
): Promise<{ data: T | null; status: number; body: string }> {
  const url = `${SUPABASE_URL}/functions/v1/${name}`;

  if (__DEV__) {
    const isAnonKey = accessToken === SUPABASE_ANON_KEY;
    const payload = decodeJwtPayload(accessToken);
    console.debug('[apiClient] Edge Function request auth:', {
      isAnonKey,
      tokenLength: accessToken?.length ?? 0,
      payload: payload
        ? {
            sub: payload.sub,
            iss: payload.iss,
            exp: payload.exp,
            expAt: payload.exp ? new Date((payload.exp as number) * 1000).toISOString() : undefined,
          }
        : null,
      url,
    });
  }

  const res = await fetch(url, {
    method: method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: T | null = null;
  try {
    data = text ? (JSON.parse(text) as T) : null;
  } catch {
    // leave data null, use text for error body
  }
  return { data, status: res.status, body: text };
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let accessToken = await ensureSession();
  if (!accessToken) {
    throw new ApiError(
      'No session. Enable Anonymous sign-in in Supabase Dashboard (Auth > Providers).',
      401
    );
  }

  const name = functionName(path);
  const method = (options.method ?? 'GET') as string;
  const body = options.body ? JSON.parse(options.body as string) : undefined;

  let result = await invokeEdgeFunction<unknown>(name, accessToken, method, body);
  const maxRetries = 2;
  let retries = 0;

  while (result.status === 401 && retries < maxRetries) {
    await supabase.auth.signOut();
    await clearSession();
    const signIn = await supabase.auth.signInAnonymously();
    if (signIn.error || !signIn.data.session?.access_token) break;
    const newToken = signIn.data.session.access_token;
    if (!isUserToken(newToken)) break;
    await saveSession(newToken);
    accessToken = newToken;
    result = await invokeEdgeFunction<unknown>(name, accessToken, method, body);
    retries += 1;
  }

  if (result.status < 200 || result.status >= 300) {
    throw new ApiError(`API error: ${result.body}`, result.status, result.body);
  }

  const data = result.data;
  if (data && typeof data === 'object' && 'data' in data && !('error' in data)) {
    return (data as { data: T }).data as T;
  }
  return data as T;
}
