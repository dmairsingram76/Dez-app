import RNMapView, { Marker } from 'react-native-maps';
import { MapViewProps } from './types';

export default function MapView({ facilities, initialRegion }: MapViewProps) {
  return (
    <RNMapView style={{ flex: 1 }} initialRegion={initialRegion}>
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
    </RNMapView>
  );
}
