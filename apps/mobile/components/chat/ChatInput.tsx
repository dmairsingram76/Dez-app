import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useState } from 'react';

export default function ChatInput({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState('');

  function submit() {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  }

  return (
    <View className="flex-row items-center border-t border-gray-200 px-3 py-2">
      <TextInput
        className="flex-1 px-3 py-2"
        placeholder="Type your answer…"
        value={text}
        onChangeText={setText}
        accessibilityLabel="Chat input"
      />
      <TouchableOpacity onPress={submit}>
        <Text className="text-blue-600 font-semibold">Send</Text>
      </TouchableOpacity>
    </View>
  );
}
