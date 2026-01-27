export type ChatMessage = {
  id: string;
  role: 'dez' | 'user';
  text: string;
  options?: string[];
};

export type ChatStep = {
  key: string;
  question: string;
  options?: string[];
};
