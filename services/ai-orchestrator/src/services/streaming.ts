import type { Response } from 'express';
import { initSSE } from '../lib/sse.js';

export async function pipeResponseStreamToSSE(
  // Using any to remain compatible with OpenAI SDK stream implementation
  // which exposes an event-emitter-like interface at runtime
  stream: any,
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
