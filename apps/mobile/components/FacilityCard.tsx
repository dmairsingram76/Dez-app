import { View, Text } from 'react-native';
import { Facility } from '@/types/ui';

type Props = {
  facility: Facility;
};

export default function FacilityCard({ facility }: Props) {
  return (
    <View className="border rounded-xl p-4 mb-3 bg-white" accessibilityRole="button">
      <Text className="text-lg font-semibold">{facility.name}</Text>
      <Text className="text-gray-600 text-sm">
        {facility.distance_meters}m away
      </Text>
      <Text className="text-xs text-gray-500">
        {facility.activity_types.join(', ')}
      </Text>
    </View>
  );
}
