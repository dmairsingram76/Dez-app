import { View, Text } from 'react-native';
import PrimaryButton from '@/components/PrimaryButton';

export default function ManualOnboarding() {
  return (
    <View className="flex-1 px-6">
      <Text className="text-xl font-semibold mb-4">
        Tell us about yourself
      </Text>

      {/* Inputs intentionally simple for MVP */}

      <PrimaryButton label="Continue" />
    </View>
  );
}
