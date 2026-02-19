import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/apiClient';
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

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api<Recommendation[]>('/recommendations');
      setData(result);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { data, loading, error, refetch: fetchRecommendations };
}

