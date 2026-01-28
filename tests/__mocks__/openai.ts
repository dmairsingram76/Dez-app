export default class OpenAI {
  chat = {
    completions: {
      create: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                activities: ['Yoga'],
                reasoning: 'A gentle option that many people enjoy.',
              }),
            },
          },
        ],
      }),
    },
  };
}
