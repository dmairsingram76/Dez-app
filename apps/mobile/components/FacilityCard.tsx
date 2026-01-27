import { View, Text } from 'react-native';

export default function FacilityCard({ facility }: { facility: any }) {
  return (
    <View className="border rounded-xl p-4 mb-3 bg-white">
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
