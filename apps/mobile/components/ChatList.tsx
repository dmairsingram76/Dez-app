import { FlatList, View } from 'react-native';
import ChatBubble from './ChatBubble';
import { ChatMessage } from '@/types/ui';

export default function ChatList({
  messages,
  onSelectOption,
}: {
  messages: ChatMessage[];
  onSelectOption: (value: string) => void;
}) {
  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <ChatBubble message={item} onSelectOption={onSelectOption} />
      )}
    />
  );
}
