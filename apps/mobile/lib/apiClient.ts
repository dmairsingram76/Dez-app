import { getSession } from './secureStore';
import { API_URL } from './config';

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getSession();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  if (!res.ok) throw new Error('API error');

  return res.json();
}
