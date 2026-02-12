import { FlatList, Text, View } from 'react-native';
import FacilityCard from '@/components/FacilityCard';
import { useFacilities } from '@/hooks/useFacilities';
import PrimaryButton from '@/components/PrimaryButton';

// TODO: Replace with actual user location from device geolocation
const DEFAULT_LOCATION = {
  lat: 51.5074, // London
  lng: -0.1278,
};

export default function Facilities() {
  const { facilities, loading, error, refetch } = useFacilities(DEFAULT_LOCATION);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text accessibilityRole="text" accessibilityLabel="Loading facilities">
          Loading facilities…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-red-600 mb-4">Failed to load facilities</Text>
        <PrimaryButton label="Try Again" onPress={refetch} />
      </View>
    );
  }

  if (facilities.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-600">No facilities found nearby</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={facilities}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => <FacilityCard facility={item} />}
    />
  );
}
