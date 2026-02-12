import { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';
import { Facility } from '@/types/ui';

type UseFacilitiesParams = {
  lat: number;
  lng: number;
  activities?: string[];
};

type UseFacilitiesResult = {
  facilities: Facility[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useFacilities({ lat, lng, activities }: UseFacilitiesParams): UseFacilitiesResult {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFacilities = () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      ...(activities && { activities: activities.join(',') }),
    });

    api<Facility[]>(`/facilities-nearby?${params}`)
      .then(setFacilities)
      .catch((e) => setError(e as Error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFacilities();
  }, [lat, lng, activities?.join(',')]);

  return { facilities, loading, error, refetch: fetchFacilities };
}
