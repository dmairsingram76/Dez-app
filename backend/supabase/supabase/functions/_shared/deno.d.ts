// Type declarations for Deno and URL/npm imports in Supabase Edge Functions.
// The runtime is Deno; this file only satisfies the TypeScript language service.

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
}

declare module "https://deno.land/std/http/server.ts" {
  export function serve(
    handler: (req: Request) => Promise<Response> | Response
  ): void;
}

declare module "npm:openai" {
  export default class OpenAI {
    constructor(options: { apiKey?: string });
    chat: {
      completions: {
        create(options: {
          model: string;
          temperature?: number;
          max_tokens?: number;
          messages: Array<{ role: string; content: string }>;
        }): Promise<{
          choices: Array<{ message?: { content?: string } }>;
        }>;
      };
    };
  }
}
