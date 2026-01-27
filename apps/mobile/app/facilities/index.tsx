import { FlatList } from 'react-native';
import FacilityCard from '@/components/FacilityCard';
import { useFacilities } from '@/hooks/useFacilities';

export default function Facilities() {
  const { facilities } = useFacilities();

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
