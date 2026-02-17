import { View, Text, StyleSheet } from 'react-native';
import { MapViewProps } from './types';

export default function MapView({ facilities, initialRegion }: MapViewProps) {
  // Create OpenStreetMap embed URL
  const bbox = [
    initialRegion.longitude - initialRegion.longitudeDelta,
    initialRegion.latitude - initialRegion.latitudeDelta,
    initialRegion.longitude + initialRegion.longitudeDelta,
    initialRegion.latitude + initialRegion.latitudeDelta,
  ].join(',');
  
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${initialRegion.latitude},${initialRegion.longitude}`;

  return (
    <View style={styles.container}>
      <iframe
        src={mapUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="Facility Map"
      />
      
      {/* Facility list overlay for web */}
      {facilities.length > 0 && (
        <View style={styles.facilityList}>
          <Text style={styles.listTitle}>Nearby Facilities ({facilities.length})</Text>
          {facilities.slice(0, 5).map((f) => (
            <View key={f.id} style={styles.facilityItem}>
              <Text style={styles.facilityName}>{f.name}</Text>
              <Text style={styles.facilityDistance}>{f.distance_meters}m away</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  facilityList: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxWidth: 280,
  },
  listTitle: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  facilityItem: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  facilityName: {
    fontWeight: '500',
    fontSize: 13,
  },
  facilityDistance: {
    fontSize: 12,
    color: '#666',
  },
});
