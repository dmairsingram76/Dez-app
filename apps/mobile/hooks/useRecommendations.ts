import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/apiClient';
import { supabase } from '@/services/supabase';
import { saveSession } from '@/lib/secureStore';
import { Recommendation } from '@/types/ui';

type UseRecommendationsResult = {
  data: Recommendation[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useRecommendations(): UseRecommendationsResult {
  const [data, setData] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendations = useCallback(async (retryAfterAuth = false) => {
    setLoading(true);
    setError(null);

    try {
      if (retryAfterAuth) {
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
        if (!signInError && signInData.session?.access_token) {
          await saveSession(signInData.session.access_token);
        }
      }

      const result = await api<Recommendation[]>('/recommendations');
      setData(result);
    } catch (e) {
      const err = e as ApiError;
      if (err instanceof ApiError && err.status === 401 && !retryAfterAuth) {
        await fetchRecommendations(true);
        return;
      }
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        let result: Recommendation[];
        try {
          result = await api<Recommendation[]>('/recommendations');
        } catch (e) {
          if (mounted && e instanceof ApiError && e.status === 401) {
            const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
            if (!signInError && signInData.session?.access_token) {
              await saveSession(signInData.session.access_token);
              result = await api<Recommendation[]>('/recommendations');
            } else {
              throw e;
            }
          } else {
            throw e;
          }
        }
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setError(e as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error, refetch: () => fetchRecommendations(true) };
}

