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

function isHttpError(err: any): boolean {
  return err?.name === 'FunctionsHttpError' && err?.context instanceof Response;
}

async function extractError(err: any): Promise<{ status: number; body: string }> {
  if (isHttpError(err)) {
    const res = err.context as Response;
    const body = await res.text().catch(() => err.message);
    return { status: res.status, body };
  }
  return { status: 500, body: err?.message ?? 'Unknown error' };
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  await ensureSession();

  const name = functionName(path);
  const method = (options.method ?? 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  const body = options.body ? JSON.parse(options.body as string) : undefined;

  let result = await supabase.functions.invoke(name, { method, body });

  if (result.error && isHttpError(result.error) && result.error.context.status === 401) {
    await supabase.auth.signOut();
    await clearSession();
    const signIn = await supabase.auth.signInAnonymously();
    if (!signIn.error && signIn.data.session?.access_token) {
      await saveSession(signIn.data.session.access_token);
    }
    result = await supabase.functions.invoke(name, { method, body });
  }

  if (result.error) {
    const { status, body: errBody } = await extractError(result.error);
    throw new ApiError(`API error: ${errBody}`, status, errBody);
  }

  const data = result.data;
  if (data && typeof data === 'object' && 'data' in data && !('error' in data)) {
    return (data as any).data as T;
  }
  return data as T;
}
