import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Master Admin Access Key configured via environment variable
const ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY || 'PR-ORIGIN-2026-SECURE-KEY';
const SESSION_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

interface AdminSession {
  token: string;
  ip: string;
  createdAt: number;
  expiresAt: number;
  role: 'admin';
}

// In-memory active session tokens store
const activeSessions = new Map<string, AdminSession>();

// Timing-safe string comparison to protect against side-channel timing attacks
function timingSafeEqualStr(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf-8');
    const bufB = Buffer.from(b, 'utf-8');
    if (bufA.length !== bufB.length) {
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Validates admin key and generates a cryptographically secure session token.
 */
export function authenticateAdminKey(providedKey: string, ip: string): { success: boolean; token?: string; error?: string } {
  if (!providedKey || typeof providedKey !== 'string') {
    return { success: false, error: 'Admin access key is required.' };
  }

  const isValid = timingSafeEqualStr(providedKey.trim(), ADMIN_ACCESS_KEY.trim());
  if (!isValid) {
    console.warn(`[SECURITY AUDIT] Failed admin authentication attempt from IP: ${ip} at ${new Date().toISOString()}`);
    return { success: false, error: 'Invalid admin credentials. Access denied.' };
  }

  // Generate 256-bit cryptographically secure token
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();

  activeSessions.set(token, {
    token,
    ip,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    role: 'admin'
  });

  console.log(`[SECURITY AUDIT] Admin successfully authenticated from IP: ${ip}. Session initiated.`);
  return { success: true, token };
}

/**
 * Validates active session token and slides session window
 */
export function validateSessionToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;

  const session = activeSessions.get(token);
  if (!session) return false;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return false;
  }

  // Refresh expiration
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return true;
}

/**
 * Revokes active session token (Logout)
 */
export function revokeSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  return activeSessions.delete(token);
}

/**
 * Express middleware to restrict sensitive routes strictly to authenticated admins
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  // 1. Check Bearer token in Authorization header
  const authHeader = req.headers['authorization'];
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // 2. Check x-admin-token or query param token for authenticated file download streams
  if (!token && req.headers['x-admin-token']) {
    token = String(req.headers['x-admin-token']).trim();
  }
  if (!token && req.query.token) {
    token = String(req.query.token).trim();
  }

  // 3. Alternatively check direct x-admin-key header
  const directKey = req.headers['x-admin-key'];
  if (directKey && typeof directKey === 'string') {
    if (timingSafeEqualStr(directKey.trim(), ADMIN_ACCESS_KEY.trim())) {
      return next();
    }
  }

  if (token && validateSessionToken(token)) {
    return next();
  }

  // Unauthorized access attempt
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  console.warn(`[SECURITY AUDIT] Blocked unauthorized access to ${req.method} ${req.originalUrl} from IP: ${clientIp}`);

  res.status(401).json({
    success: false,
    error: 'Unauthorized. This endpoint is strictly restricted to authenticated PR Origin administrators.',
    code: 'ADMIN_AUTH_REQUIRED'
  });
}
