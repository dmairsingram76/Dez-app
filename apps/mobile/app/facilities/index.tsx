import { FlatList, Text } from 'react-native';
import FacilityCard from '@/components/FacilityCard';
import { useFacilities } from '@/hooks/useFacilities';

export default function Facilities() {
  const { facilities, loading } = useFacilities({
    lat: 51.5074,
    lng: -0.1278,
  });

  if (loading) return <Text>Loading facilities…</Text>;

  return (
    <FlatList
      data={facilities}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <FacilityCard facility={item} />
      )}
    />
  );
}
