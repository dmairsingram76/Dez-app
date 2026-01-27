import { View, Text, TouchableOpacity } from 'react-native';

export default function ChatProgress({
  progress,
  onSwitch,
}: {
  progress: number;
  onSwitch: () => void;
}) {
  return (
    <View className="flex-row justify-between items-center px-4 py-2 border-b">
      <Text className="text-sm text-gray-600">
        Step {progress} of 5
      </Text>
      <TouchableOpacity onPress={onSwitch}>
        <Text className="text-sm text-blue-600">Use form instead</Text>
      </TouchableOpacity>
    </View>
  );
}
