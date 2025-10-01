import type { Request, Response, NextFunction } from 'express';

type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export function rateLimit(opts?: { windowMs?: number; max?: number }) {
  const windowMs = opts?.windowMs ?? Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
  const max = opts?.max ?? Number(process.env.RATE_LIMIT_MAX || 30);

  return function (req: Request, res: Response, next: NextFunction) {
    try {
      const now = Date.now();
      const key = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
      let e = buckets.get(key);
      if (!e || now > e.resetAt) {
        e = { count: 0, resetAt: now + windowMs };
        buckets.set(key, e);
      }
      if (e.count >= max) {
        const retryAfterSec = Math.max(1, Math.ceil((e.resetAt - now) / 1000));
        res.setHeader('Retry-After', String(retryAfterSec));
        return res.status(429).json({ error: 'rate_limited', message: 'Too many requests, please slow down.' });
      }
      e.count += 1;
      next();
    } catch (err) {
      next(err);
    }
  };
}
