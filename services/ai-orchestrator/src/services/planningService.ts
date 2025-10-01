import { getOpenAI, createPlanningStream, withRetry } from '../lib/openai.js';
import { toOpenAITools } from '../lib/tools.js';

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
