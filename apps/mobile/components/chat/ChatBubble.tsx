import { View, Text, TouchableOpacity } from 'react-native';
import { ChatMessage } from '@/types/ui';

export default function ChatBubble({
  message,
  onSelectOption,
}: {
  message: ChatMessage;
  onSelectOption?: (value: string) => void;
}) {
  const isDez = message.role === 'dez';

  return (
    <View
      className={`mb-4 max-w-[85%] ${
        isDez ? 'self-start' : 'self-end'
      }`}
      accessibilityRole="text"
    >
      <View
        className={`rounded-xl px-4 py-3 ${
          isDez ? 'bg-gray-100' : 'bg-blue-500'
        }`}
      >
        <Text className={isDez ? 'text-gray-800' : 'text-white'}>
          {message.text}
        </Text>
      </View>

      {message.options && (
        <View className="mt-2">
          {message.options.map((opt) => (
            <TouchableOpacity
              key={opt}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 mb-2"
              onPress={() => onSelectOption?.(opt)}
              accessibilityRole="button"
            >
              <Text>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
