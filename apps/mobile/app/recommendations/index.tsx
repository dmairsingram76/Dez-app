import { View, Text, FlatList } from 'react-native';
import { useRecommendations } from '@/hooks/useRecommendations';

export default function Recommendations() {
  const { data, loading } = useRecommendations();

  if (loading) return <Text>Loading…</Text>;

  return (
    <View className="flex-1 px-6">
      <Text className="text-2xl font-semibold mb-4">
        Recommended for you
      </Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text className="mb-2">• {item.activity}</Text>
        )}
      />
    </View>
  );
}
