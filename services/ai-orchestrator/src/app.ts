import express, { Request, Response } from 'express';
import { registerPlanRoutes } from './routes/plan.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'ai-orchestrator' });
  });

  // API routes
  app.use(registerPlanRoutes());

  return app;
}

export const app = createApp();
