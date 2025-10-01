import request from 'supertest';
import { app } from '../src/app';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/services/planningService', () => ({
  planFromPrompt: vi.fn(async () => {
    // Minimal stream-like object for our SSE piping
    const handlers: Record<string, Function[]> = {};
    const stream: any = {
      on: (evt: string, cb: Function) => {
        handlers[evt] = handlers[evt] || [];
        handlers[evt].push(cb);
        // For the test, emit a couple of events then end
        if (evt === 'event') {
          setTimeout(() => cb({ type: 'response.output_text.delta', delta: 'Hi' }), 5);
        }
        if (evt === 'end') {
          setTimeout(() => cb(), 10);
        }
      },
    };
    return stream;
  }),
}));

describe('plan routes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('stages a plan and streams SSE', async () => {
    const planRes = await request(app).post('/api/plan').send({ userPrompt: 'Hello' });
    expect(planRes.status).toBe(202);
    const planId = planRes.body.planId;
    expect(planId).toBeTruthy();

    const streamRes = await request(app).get(`/api/stream/${planId}`);
    expect(streamRes.status).toBe(200);
    expect(streamRes.headers['content-type']).toMatch(/text\/event-stream/);
  });

  it('rejects invalid plan requests', async () => {
    const res = await request(app).post('/api/plan').send({ userPrompt: '' });
    expect(res.status).toBe(400);
  });

  it('404 on unknown planId', async () => {
    const res = await request(app).get('/api/stream/does-not-exist');
    expect(res.status).toBe(404);
  });
});
