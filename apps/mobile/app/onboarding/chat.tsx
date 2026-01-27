import { View, FlatList } from 'react-native';
import ChatBubble from '@/components/ChatBubble';
import Input from '@/components/Input';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function ChatOnboarding() {
  const { messages, sendMessage } = useOnboarding();

  return (
    <View className="flex-1 px-4">
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble message={item} />
        )}
      />

      <Input
        placeholder="Tell me about your goals…"
        onSubmit={sendMessage}
      />
    </View>
  );
}
