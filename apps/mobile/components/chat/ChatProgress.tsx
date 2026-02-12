import { View, Text, TouchableOpacity } from 'react-native';

type Props = {
  progress: number;
  totalSteps: number;
  onSwitch: () => void;
};

export default function ChatProgress({ progress, totalSteps, onSwitch }: Props) {
  return (
    <View className="flex-row justify-between items-center px-4 py-2 border-b">
      <Text className="text-sm text-gray-600">
        Step {progress} of {totalSteps}
      </Text>
      <TouchableOpacity onPress={onSwitch} accessibilityRole="button">
        <Text className="text-sm text-blue-600">Use form instead</Text>
      </TouchableOpacity>
    </View>
  );
}
