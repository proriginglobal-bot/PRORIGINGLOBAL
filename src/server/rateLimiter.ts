import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const limitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically (unreferenced so it does not block process exit)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of limitStore.entries()) {
    if (now > record.resetAt) {
      limitStore.delete(key);
    }
  }
}, 60 * 1000);
if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Creates an in-memory rate limiting middleware
 */
export function createRateLimiter(options: { max: number; windowMs: number; message: string; keyPrefix: string }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getClientIp(req);
    const key = `${options.keyPrefix}:${ip}`;
    const now = Date.now();

    let record = limitStore.get(key);

    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + options.windowMs
      };
      limitStore.set(key, record);
      return next();
    }

    record.count++;

    if (record.count > options.max) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec.toString());
      res.status(429).json({
        success: false,
        error: options.message,
        retryAfter: retryAfterSec
      });
      return;
    }

    next();
  };
}

// 1. Rate limiter for public form submissions: max 15 submissions per 10 minutes per IP
export const formSubmissionLimiter = createRateLimiter({
  max: 15,
  windowMs: 10 * 60 * 1000,
  message: 'Too many submissions from this IP address. Please wait before submitting another inquiry.',
  keyPrefix: 'form_sub'
});

// 2. Strict rate limiter for Admin Login: max 5 attempts per 15 minutes per IP (Brute-force protection)
export const adminLoginLimiter = createRateLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many failed login attempts. Account temporarily locked for 15 minutes to prevent brute-force attacks.',
  keyPrefix: 'admin_login'
});
