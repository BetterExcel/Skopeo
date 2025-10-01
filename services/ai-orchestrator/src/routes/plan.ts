import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import { planFromPrompt } from '../services/planningService.js';
import { pipeResponseStreamToSSE } from '../services/streaming.js';
import { rateLimit } from '../middleware/rateLimit.js';

// Validate plan requests
const PlanRequestSchema = z.object({
  userPrompt: z.string().min(1),
  sheetContext: z
    .object({
      currentSheet: z.string().optional(),
      selection: z
        .object({
          range: z.string(),
          type: z.enum(['cell', 'range', 'column', 'row']),
        })
        .optional(),
      namedRanges: z.array(z.string()).optional(),
      sheetNames: z.array(z.string()).optional(),
      documentType: z.enum(['calc', 'writer', 'impress']).optional(),
    })
    .optional(),
});

type PlanRecord = {
  id: string;
  prompt: string;
  createdAt: number;
  consumed: boolean;
};

class PlanStore {
  private plans = new Map<string, PlanRecord>();

  create(prompt: string): PlanRecord {
    const id = crypto.randomUUID();
    const rec: PlanRecord = { id, prompt, createdAt: Date.now(), consumed: false };
    this.plans.set(id, rec);
    return rec;
  }

  get(id: string) {
    return this.plans.get(id);
  }

  markConsumed(id: string) {
    const rec = this.plans.get(id);
    if (rec) {
      rec.consumed = true;
      // Cleanup to avoid leaks
      this.plans.delete(id);
    }
  }
}

const store = new PlanStore();

export function registerPlanRoutes(): Router {
  const router = Router();

  // POST /api/plan — validate and stage a plan; returns planId
  router.post('/api/plan', rateLimit(), (req: Request, res: Response) => {
    const parsed = PlanRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
    }
    const { userPrompt } = parsed.data;
    const plan = store.create(userPrompt);
    return res.status(202).json({ planId: plan.id });
  });

  // GET /api/stream/:planId — starts OpenAI response stream and pipes as SSE
  router.get('/api/stream/:planId', async (req: Request, res: Response) => {
    const { planId } = req.params;
    const rec = store.get(planId);
    if (!rec) {
      return res.status(404).json({ error: 'not_found', message: 'Unknown planId' });
    }
    if (rec.consumed) {
      return res.status(409).json({ error: 'already_consumed' });
    }
    try {
      const stream = await planFromPrompt(rec.prompt);
      await pipeResponseStreamToSSE(stream as any, res);
    } catch (err) {
      const message = (err as Error)?.message || 'stream_error';
      if (!res.headersSent) {
        return res.status(500).json({ error: 'stream_error', message });
      }
    } finally {
      store.markConsumed(planId);
    }
  });

  return router;
}
