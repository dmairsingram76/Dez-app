import { View, Text, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useRecommendations } from '@/hooks/useRecommendations';
import PrimaryButton from '@/components/PrimaryButton';
import { ApiError } from '@/lib/apiClient';

export default function Recommendations() {
  const { data, loading, error, refetch } = useRecommendations();

  if (loading) return <Text>Loading…</Text>;
  if (error) {
    const message =
      error instanceof ApiError && error.status === 401
        ? 'Please sign in again.'
        : 'Something went wrong loading recommendations.';
    return (
      <View className="flex-1 px-6 justify-center">
        <Text className="text-center text-gray-600 mb-4">{message}</Text>
        <PrimaryButton label="Try again" onPress={refetch} />
      </View>
    );
  }

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
