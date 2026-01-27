import { View, Text } from 'react-native';
import { router } from 'expo-router';
import PrimaryButton from '@/components/PrimaryButton';

export default function Welcome() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-3xl font-semibold mb-4">Welcome to Dez</Text>
      <Text className="text-center text-gray-600 mb-8">
        Let’s find fitness options that work for you — your body, your pace.
      </Text>

      <PrimaryButton
        label="Chat with Dez"
        onPress={() => router.push('/onboarding/chat')}
      />

      <PrimaryButton
        variant="secondary"
        label="Fill out a form instead"
        onPress={() => router.push('/onboarding/form')}
      />
    </View>
  );
}
