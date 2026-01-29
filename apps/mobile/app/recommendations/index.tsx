import { View, Text, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useRecommendations } from '@/hooks/useRecommendations';

export default function Recommendations() {
  const { data, loading, error } = useRecommendations();

  if (loading) return <Text>Loading…</Text>;
  if (error) return <Text>Something went wrong loading recommendations.</Text>;

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

      <View className="mt-6">
        <Text
          className="text-blue-600 font-semibold"
          onPress={() => router.push('/facilities')}
        >
          See nearby facilities
        </Text>
      </View>
    </View>
  );
}
