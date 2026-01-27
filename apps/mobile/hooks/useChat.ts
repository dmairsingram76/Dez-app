import { useState, useEffect } from 'react';
import { CHAT_STEPS } from '@/lib/chatFlow';
import { ChatMessage } from '@/types/ui';
import { api } from '@/lib/apiClient';
import { router } from 'expo-router';

export function useChat() {
  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const step = CHAT_STEPS[0];
    setMessages([
      {
        id: 'welcome',
        role: 'dez',
        text: "Hi, I’m Dez 👋 I’ll help you find fitness options that feel right for you.",
      },
      {
        id: step.key,
        role: 'dez',
        text: step.question,
        options: step.options,
      },
    ]);
  }, []);

  function advance(value: string) {
    const current = CHAT_STEPS[stepIndex];

    setMessages((m) => [
      ...m,
      { id: Date.now().toString(), role: 'user', text: value },
    ]);

    api('/questionnaire-submit', {
      method: 'POST',
      body: JSON.stringify({ [current.key]: value }),
    });

    const nextIndex = stepIndex + 1;
    const next = CHAT_STEPS[nextIndex];

    if (next) {
      setMessages((m) => [
        ...m,
        {
          id: next.key,
          role: 'dez',
          text: next.question,
          options: next.options,
        },
      ]);
      setStepIndex(nextIndex);
    } else {
      router.replace('/recommendations');
    }
  }

  return {
    messages,
    sendText: advance,
    selectOption: advance,
    progress: stepIndex + 1,
    switchToForm: () => router.replace('/onboarding/form'),
  };
}
