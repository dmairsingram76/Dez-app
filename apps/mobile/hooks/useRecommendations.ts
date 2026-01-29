import { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';

type Recommendation = {
  id: string;
  activity: string;
  [key: string]: any;
};

export function useRecommendations() {
  const [data, setData] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  return { data, loading, error };
}

