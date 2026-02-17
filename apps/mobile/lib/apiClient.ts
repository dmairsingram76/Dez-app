import { API_URL } from './config';
import { supabase } from '@/services/supabase';

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

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

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
