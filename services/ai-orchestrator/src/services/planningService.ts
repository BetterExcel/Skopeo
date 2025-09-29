import { getOpenAI, createPlanningStream, withRetry } from '../lib/openai';
import { toOpenAITools } from '../lib/tools';

export async function planFromPrompt(prompt: string) {
  const client = getOpenAI();
  const stream = await withRetry(() =>
    createPlanningStream(client, {
      userPrompt: prompt,
      tools: toOpenAITools(),
    }),
  );
  return stream; // The caller will pipe SSE to client
}
