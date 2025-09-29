import type OpenAI from 'openai';
import type { Response } from 'express';
import { initSSE } from '../lib/sse';

export async function pipeResponseStreamToSSE(
  stream: OpenAI.Stream<OpenAI.Beta.Responses.Response>,
  res: Response,
) {
  const sse = initSSE(res);

  stream.on('event', (event: any) => {
    // Forward all events to the client; UI can filter by name
    if (event?.type) {
      sse.send(event.type, event);
    } else {
      sse.send('event', event);
    }
  });

  stream.on('end', () => {
    sse.close();
  });

  stream.on('error', (err: unknown) => {
    sse.send('error', { message: (err as Error)?.message || 'stream error' });
    sse.close();
  });
}
