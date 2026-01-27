import { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';

export function useFacilities({
  lat,
  lng,
  activities,
}: {
  lat: number;
  lng: number;
  activities?: string[];
}) {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      ...(activities && { activities: activities.join(',') }),
    });

    api(`/facilities-nearby?${params}`)
      .then(setFacilities)
      .finally(() => setLoading(false));
  }, [lat, lng, activities?.join(',')]);

  return { facilities, loading };
}
