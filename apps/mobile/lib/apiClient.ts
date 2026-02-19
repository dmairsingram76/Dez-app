import { supabase } from '@/services/supabase';
import { saveSession, clearSession } from '@/lib/secureStore';
import { FunctionsHttpError } from '@supabase/supabase-js';

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

async function ensureSession(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (!error && data.session?.access_token) {
    await saveSession(data.session.access_token);
  }
}

function functionName(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  await ensureSession();

  const name = functionName(path);
  const method = (options.method ?? 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  const body = options.body ? JSON.parse(options.body as string) : undefined;

  let { data, error } = await supabase.functions.invoke(name, { method, body });

  if (error instanceof FunctionsHttpError && error.context.status === 401) {
    await supabase.auth.signOut();
    await clearSession();
    const signIn = await supabase.auth.signInAnonymously();
    if (!signIn.error && signIn.data.session?.access_token) {
      await saveSession(signIn.data.session.access_token);
    }
    ({ data, error } = await supabase.functions.invoke(name, { method, body }));
  }

  if (error) {
    let status = 500;
    let responseBody = error.message;
    if (error instanceof FunctionsHttpError) {
      status = error.context.status;
      responseBody = await error.context.text().catch(() => error.message);
    }
    throw new ApiError(`API error: ${responseBody}`, status, responseBody);
  }

  if (data && typeof data === 'object' && 'data' in data && !('error' in data)) {
    return (data as any).data as T;
  }
  return data as T;
}
