import { Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useFacilities } from '@/hooks/useFacilities';

// TODO: Replace with actual user location from device geolocation
const DEFAULT_LOCATION = {
  lat: 51.5074, // London
  lng: -0.1278,
};

export default function FacilityMap() {
  const { facilities, loading, error } = useFacilities(DEFAULT_LOCATION);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading map…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-600">Failed to load facilities</Text>
      </View>
    );
  }

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: DEFAULT_LOCATION.lat,
        longitude: DEFAULT_LOCATION.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {facilities.map((f) => (
        <Marker
          key={f.id}
          coordinate={{
            latitude: f.latitude,
            longitude: f.longitude,
          }}
          title={f.name}
        />
      ))}
    </MapView>
  );
}
