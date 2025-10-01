import request from 'supertest';
import { app } from '../src/app';
import { describe, it, expect } from 'vitest';

describe('health endpoint', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'ai-orchestrator' });
  });
});
