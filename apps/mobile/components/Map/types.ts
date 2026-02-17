import { Facility } from '@/types/ui';

export type MapViewProps = {
  facilities: Facility[];
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
};
