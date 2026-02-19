import { useState, useEffect, useRef } from 'react';
import { CHAT_STEPS } from '@/lib/chatFlow';
import { ChatMessage } from '@/types/ui';
import { api } from '@/lib/apiClient';
import { router } from 'expo-router';
import { trackEvent } from '@/lib/trackEvents';

const QUESTIONNAIRE_VERSION = 1;

type QuestionnaireResponses = Record<string, string>;

export function useChat() {
  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const responsesRef = useRef<QuestionnaireResponses>({});

  useEffect(() => {
    const step = CHAT_STEPS[0];
    setMessages([
      {
        id: 'welcome',
        role: 'dez',
        text: "Hi, I'm Dez 👋 I'll help you find fitness options that feel right for you.",
      },
      {
        id: step.key,
        role: 'dez',
        text: step.question,
        options: step.options,
      },
    ]);
    trackEvent({ event_name: 'questionnaire_started', screen: 'chat' });
  }, []);

  async function submitQuestionnaire() {
    setSubmitting(true);
    try {
      await api('/questionnaire-submit', {
        method: 'POST',
        body: JSON.stringify({
          version: QUESTIONNAIRE_VERSION,
          responses: responsesRef.current,
        }),
      });
      trackEvent({ event_name: 'questionnaire_completed', screen: 'chat' });
    } catch (error) {
      console.error('Failed to submit questionnaire:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function advance(value: string) {
    const current = CHAT_STEPS[stepIndex];

    // Store the response
    responsesRef.current[current.key] = value;

    // Add user message to chat
    setMessages((m) => [
      ...m,
      { id: Date.now().toString(), role: 'user', text: value },
    ]);

    const nextIndex = stepIndex + 1;
    const next = CHAT_STEPS[nextIndex];

    if (next) {
      // Show next question
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
      // All steps completed - submit and navigate
      await submitQuestionnaire();
      router.replace('/recommendations');
    }
  }

  return {
    messages,
    sendText: advance,
    selectOption: advance,
    progress: stepIndex + 1,
    totalSteps: CHAT_STEPS.length,
    submitting,
    switchToForm: () => router.replace('/onboarding/form'),
  };
}
