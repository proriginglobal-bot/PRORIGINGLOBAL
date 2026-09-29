import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/routes';
import { initStorage } from './src/server/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize data storage directory and files
initStorage();

const app = express();
const PORT = 3000;

// Security Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CRITICAL SECURITY: Block all direct access to private backend data files, environmental secrets, and dotfiles
app.all(['/data', '/data/*', '/data/**'], (_req, res) => {
  res.status(403).json({
    success: false,
    error: 'Access Denied: Direct access to confidential storage files is strictly prohibited.',
    code: 'DATA_VAULT_RESTRICTED'
  });
});

app.all(['/.env', '/.env.*', '/.git', '/.git/*', '/package.json', '/tsconfig.json'], (_req, res) => {
  res.status(403).json({ success: false, error: 'Forbidden' });
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Register API Routes
app.use('/api', apiRouter);

// Serve static assets safely with dotfiles denied
const staticOptions = {
  dotfiles: 'deny' as const,
  index: false
};

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, staticOptions));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.use(express.static(__dirname, staticOptions));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[PR ORIGIN GLOBAL] Server is active and listening on http://0.0.0.0:${PORT}`);
  console.log(`[STORAGE] Form submission storage files initialized at ./data/`);
});
