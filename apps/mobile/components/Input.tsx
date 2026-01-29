import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';

type Props = {
  placeholder?: string;
  onSubmit: (value: string) => void;
};

export default function Input({ placeholder, onSubmit }: Props) {
  const [value, setValue] = useState('');

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  }

  return (
    <View className="flex-row items-center border-t border-gray-200 px-4 py-2 bg-white">
      <TextInput
        className="flex-1 mr-3 py-2"
        placeholder={placeholder}
        value={value}
        onChangeText={setValue}
        onSubmitEditing={handleSend}
        returnKeyType="send"
      />
      <TouchableOpacity onPress={handleSend}>
        <Text className="text-blue-600 font-semibold">Send</Text>
      </TouchableOpacity>
    </View>
  );
}

