import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  saveRfqInquiry,
  saveSampleRequest,
  getRfqInquiries,
  getSampleRequests,
  getStorageStats,
  getStorageFile,
  updateLeadStatus,
  initStorage
} from './storage';
import {
  authenticateAdminKey,
  revokeSessionToken,
  requireAdminAuth
} from './auth';
import {
  formSubmissionLimiter,
  adminLoginLimiter
} from './rateLimiter';

export const apiRouter = Router();

// Ensure data files are ready on server startup
initStorage();

// Helper to sanitize text input against script injection
function sanitizeText(val: any, maxLength = 1000): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[<>]/g, '') // strip HTML angle brackets
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================================================
// PUBLIC CUSTOMER-FACING ENDPOINTS (Rate-limited, sanitized, zero leakage)
// ============================================================================

/**
 * GET /api/health - Lightweight health probe
 */
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'pr-origin-global-api',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/inquiries - Submit an RFQ Inquiry
 * Protected by rate limiting. Never reveals other buyer leads or internal paths.
 */
apiRouter.post('/inquiries', formSubmissionLimiter, (req: Request, res: Response) => {
  try {
    const rawName = req.body.name;
    const rawEmail = req.body.email;
    const rawPhone = req.body.phone;
    const rawProduct = req.body.product;
    const rawMessage = req.body.message;
    const rawPort = req.body.destinationPort;

    const name = sanitizeText(rawName, 100);
    const email = sanitizeText(rawEmail, 150);
    const phone = sanitizeText(rawPhone, 50);
    const product = sanitizeText(rawProduct, 120) || '5kg Cocopeat Blocks';
    const message = sanitizeText(rawMessage, 2000);
    const destinationPort = sanitizeText(rawPort, 100);

    if (!name || !email || !message) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields (name, email, and message are required).'
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        error: 'Please provide a valid business email address.'
      });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    const savedRecord = saveRfqInquiry({
      name,
      email,
      phone,
      product,
      message,
      destinationPort,
      ip: clientIp,
      userAgent
    });

    console.log(`[STORAGE] Securely recorded new RFQ (${savedRecord.id}) to protected ledger.`);

    // Return ONLY a safe receipt to the public submitter
    res.status(201).json({
      success: true,
      message: 'Thank you. Your commercial RFQ inquiry has been received securely.',
      inquiryId: savedRecord.id
    });
  } catch (err: any) {
    console.error('[STORAGE ERROR] Failed saving RFQ inquiry:', err);
    res.status(500).json({
      success: false,
      error: 'Unable to process inquiry at this moment. Please reach out directly to sales@proriginglobal.com.'
    });
  }
});

/**
 * POST /api/samples - Submit a Sample Kit Dispatch Request
 * Protected by rate limiting. Never reveals other buyer leads.
 */
apiRouter.post('/samples', formSubmissionLimiter, (req: Request, res: Response) => {
  try {
    const rawName = req.body.name;
    const rawCompany = req.body.company;
    const rawEmail = req.body.email;
    const rawPhone = req.body.phone;
    const rawCountry = req.body.country;
    const rawAddress = req.body.address;
    const rawCropType = req.body.cropType;
    const rawEc = req.body.ecPreference;
    const rawSampleType = req.body.sampleType;
    const rawNotes = req.body.notes;

    const name = sanitizeText(rawName, 100);
    const company = sanitizeText(rawCompany, 120);
    const email = sanitizeText(rawEmail, 150);
    const phone = sanitizeText(rawPhone, 50);
    const country = sanitizeText(rawCountry, 80);
    const address = sanitizeText(rawAddress, 300);
    const cropType = sanitizeText(rawCropType, 80);
    const ecPreference = sanitizeText(rawEc, 80);
    const sampleType = sanitizeText(rawSampleType, 120);
    const notes = sanitizeText(rawNotes, 1000);

    if (!name || !email || !country || !address) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields (name, email, country, and address are required).'
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        error: 'Please provide a valid business email address.'
      });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    const savedRecord = saveSampleRequest({
      name,
      company,
      email,
      phone,
      country,
      address,
      cropType,
      ecPreference,
      sampleType,
      notes,
      ip: clientIp,
      userAgent
    });

    console.log(`[STORAGE] Securely recorded Sample Request (${savedRecord.trackingCode}) to protected ledger.`);

    // Return ONLY a safe receipt to the public submitter
    res.status(201).json({
      success: true,
      message: 'Sample kit request received. Dispatch tracking reference generated.',
      trackingCode: savedRecord.trackingCode
    });
  } catch (err: any) {
    console.error('[STORAGE ERROR] Failed saving Sample request:', err);
    res.status(500).json({
      success: false,
      error: 'Unable to register sample request. Please contact export dispatch at sales@proriginglobal.com.'
    });
  }
});

/**
 * GET /api/catalog/download - Public download of official Product Catalog PDF
 */
apiRouter.get('/catalog/download', (_req: Request, res: Response) => {
  try {
    const candidates = [
      path.join(process.cwd(), 'public', 'PR_Origin_Global_Master_Catalog_2026.pdf'),
      path.join(process.cwd(), 'PR_Origin_Global_Master_Catalog_2026.pdf'),
      path.join(process.cwd(), 'dist', 'PR_Origin_Global_Master_Catalog_2026.pdf')
    ];
    const pdfPath = candidates.find(p => fs.existsSync(p));
    if (!pdfPath) {
      res.status(404).json({ success: false, error: 'Catalog PDF is being compiled or not found.' });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="PR_Origin_Global_Master_Catalog_2026.pdf"');
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ============================================================================
// ADMIN AUTHENTICATION & SESSION MANAGEMENT
// ============================================================================

/**
 * POST /api/admin/login - Authenticate staff/admin with secret key
 * Rate limited to 5 attempts per 15 minutes per IP to prevent brute-force attacks.
 */
apiRouter.post('/admin/login', adminLoginLimiter, (req: Request, res: Response) => {
  const { accessKey } = req.body;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  const authResult = authenticateAdminKey(accessKey, clientIp);

  if (!authResult.success) {
    res.status(401).json({
      success: false,
      error: authResult.error || 'Invalid credentials'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Staff authentication successful. Protected leads vault unlocked.',
    token: authResult.token,
    expiresIn: '3h'
  });
});

/**
 * POST /api/admin/logout - Invalidate active session token
 */
apiRouter.post('/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  let token = req.body.token;

  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (token) {
    revokeSessionToken(token);
  }

  res.json({
    success: true,
    message: 'Admin session terminated. Vault locked.'
  });
});

/**
 * GET /api/admin/verify - Check if current session token is valid
 */
apiRouter.get('/admin/verify', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({
    success: true,
    authenticated: true,
    message: 'Session is active and verified.'
  });
});

// ============================================================================
// PROTECTED ADMINISTRATIVE LEADS VAULT (Requires requireAdminAuth)
// Zero public access. Regular users cannot fetch or steal any buyer leads.
// ============================================================================

/**
 * GET /api/admin/submissions - Protected retrieval of stored RFQ & Sample leads
 */
apiRouter.get('/admin/submissions', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const rfqs = getRfqInquiries();
    const samples = getSampleRequests();
    const stats = getStorageStats();

    res.json({
      success: true,
      stats,
      inquiries: rfqs,
      samples: samples
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

/**
 * GET /api/admin/stats - Protected vault summary statistics
 */
apiRouter.get('/admin/stats', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const stats = getStorageStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

/**
 * GET /api/admin/export/:filename - Protected download of confidential CSV/JSON leads
 */
apiRouter.get('/admin/export/:filename', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const rawFilename = req.params.filename;
    const filename = Array.isArray(rawFilename) ? rawFilename[0] : rawFilename;
    if (!filename) {
      res.status(400).json({ success: false, error: 'Filename parameter is required.' });
      return;
    }

    const file = getStorageFile(filename);

    if (!file) {
      res.status(404).json({ success: false, error: 'Requested export file not found or unauthorized.' });
      return;
    }

    const content = fs.readFileSync(file.filePath, 'utf-8');
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);
    res.send(content);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

/**
 * PATCH /api/admin/status - Update status of an RFQ or Sample lead
 */
apiRouter.patch('/admin/status', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) {
      res.status(400).json({ success: false, error: 'Both id and status are required.' });
      return;
    }

    const allowedStatuses = ['new', 'reviewed', 'quoted', 'dispatched', 'in_transit', 'delivered', 'closed'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status value.' });
      return;
    }

    const updated = updateLeadStatus(id, status);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Lead with provided ID not found.' });
      return;
    }

    res.json({ success: true, message: `Lead ${id} updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ============================================================================
// HARDENED LEGACY ROUTES (Secured against unauthorized scraping)
// Any unauthorized access returns 401. Data theft is blocked.
// ============================================================================
apiRouter.get('/submissions', requireAdminAuth, (_req: Request, res: Response) => {
  const rfqs = getRfqInquiries();
  const samples = getSampleRequests();
  const stats = getStorageStats();
  res.json({ success: true, stats, inquiries: rfqs, samples });
});

apiRouter.get('/export/:filename', requireAdminAuth, (req: Request, res: Response) => {
  const rawFilename = req.params.filename;
  const filename = Array.isArray(rawFilename) ? rawFilename[0] : rawFilename;
  const file = getStorageFile(filename || '');
  if (!file) {
    res.status(404).json({ success: false, error: 'File not found.' });
    return;
  }
  const content = fs.readFileSync(file.filePath, 'utf-8');
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename || '')}"`);
  res.send(content);
});
