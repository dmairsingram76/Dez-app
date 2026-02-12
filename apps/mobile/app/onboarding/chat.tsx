import { View } from 'react-native';
import ChatList from '@/components/ChatList';
import ChatInput from '@/components/chat/ChatInput';
import ChatProgress from '@/components/chat/ChatProgress';
import { useChat } from '@/hooks/useChat';

export default function ChatOnboarding() {
  const {
    messages,
    sendText,
    selectOption,
    progress,
    totalSteps,
    switchToForm,
  } = useChat();

  return (
    <View className="flex-1 bg-white">
      <ChatProgress progress={progress} totalSteps={totalSteps} onSwitch={switchToForm} />
      <ChatList messages={messages} onSelectOption={selectOption} />
      <ChatInput onSend={sendText} />
    </View>
  );
}

