import MapView, { Marker } from 'react-native-maps';
import { useFacilities } from '@/hooks/useFacilities';

export default function FacilityMap() {
  const { facilities } = useFacilities({
    lat: 51.5074,
    lng: -0.1278,
  });

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 51.5074,
        longitude: -0.1278,
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
