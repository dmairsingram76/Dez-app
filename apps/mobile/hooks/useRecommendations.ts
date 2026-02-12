import { useEffect, useState } from 'react';
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

  const fetchRecommendations = () => {
    setLoading(true);
    setError(null);

    api<Recommendation[]>('/recommendations')
      .then(setData)
      .catch((e) => setError(e as Error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;

    api<Recommendation[]>('/recommendations')
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((e) => {
        if (mounted) setError(e as Error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error, refetch: fetchRecommendations };
}

