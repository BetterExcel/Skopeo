import express, { Request, Response } from 'express';
import { config } from './lib/config';
import { registerPlanRoutes } from './routes/plan';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ai-orchestrator' });
});

// API routes
app.use(registerPlanRoutes());

const port = config.PORT;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[ai-orchestrator] listening on :${port}`);
});
