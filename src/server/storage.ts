import fs from 'fs';
import path from 'path';

// Storage directory path
const DATA_DIR = path.resolve(process.cwd(), 'data');
const RFQ_JSON_FILE = path.join(DATA_DIR, 'rfq_inquiries.json');
const RFQ_CSV_FILE = path.join(DATA_DIR, 'rfq_inquiries.csv');
const SAMPLES_JSON_FILE = path.join(DATA_DIR, 'sample_requests.json');
const SAMPLES_CSV_FILE = path.join(DATA_DIR, 'sample_requests.csv');
const LEDGER_JSON_FILE = path.join(DATA_DIR, 'all_submissions_ledger.json');

export interface RfqInquiry {
  id: string;
  type: 'rfq_inquiry';
  name: string;
  email: string;
  phone?: string;
  product: string;
  message: string;
  destinationPort?: string;
  createdAt: string;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  status: 'new' | 'reviewed' | 'quoted' | 'closed';
}

export interface SampleRequest {
  id: string;
  trackingCode: string;
  type: 'sample_kit_request';
  name: string;
  company?: string;
  email: string;
  phone?: string;
  country: string;
  address: string;
  cropType?: string;
  ecPreference?: string;
  sampleType?: string;
  notes?: string;
  createdAt: string;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  status: 'dispatched' | 'in_transit' | 'delivered';
}

// Utility to escape CSV fields
function escapeCsv(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Ensure the data directory and initial files exist
export function initStorage(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(RFQ_JSON_FILE)) {
      fs.writeFileSync(RFQ_JSON_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    if (!fs.existsSync(RFQ_CSV_FILE)) {
      const headers = ['Inquiry_ID', 'Date_UTC', 'Full_Name', 'Email', 'Phone', 'Product_Interest', 'Message_Details', 'Status'].join(',');
      fs.writeFileSync(RFQ_CSV_FILE, headers + '\n', 'utf-8');
    }

    if (!fs.existsSync(SAMPLES_JSON_FILE)) {
      fs.writeFileSync(SAMPLES_JSON_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    if (!fs.existsSync(SAMPLES_CSV_FILE)) {
      const headers = ['Tracking_Code', 'Date_UTC', 'Full_Name', 'Company', 'Email', 'Phone', 'Country', 'Shipping_Address', 'Crop_Type', 'EC_Preference', 'Sample_Type', 'Status'].join(',');
      fs.writeFileSync(SAMPLES_CSV_FILE, headers + '\n', 'utf-8');
    }

    if (!fs.existsSync(LEDGER_JSON_FILE)) {
      fs.writeFileSync(LEDGER_JSON_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to initialize storage directory/files:', err);
  }
}

// Read RFQ inquiries
export function getRfqInquiries(): RfqInquiry[] {
  try {
    initStorage();
    if (fs.existsSync(RFQ_JSON_FILE)) {
      const raw = fs.readFileSync(RFQ_JSON_FILE, 'utf-8');
      return JSON.parse(raw) as RfqInquiry[];
    }
  } catch (err) {
    console.error('Error reading RFQ inquiries JSON:', err);
  }
  return [];
}

// Save RFQ inquiry to files (JSON, CSV, Master Ledger)
export function saveRfqInquiry(data: Partial<RfqInquiry> & { name: string; email: string; message: string; product: string }): RfqInquiry {
  initStorage();

  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const id = `PRO-RFQ-${new Date().getFullYear()}-${randomSuffix}`;

  const newRecord: RfqInquiry = {
    id,
    type: 'rfq_inquiry',
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim() || 'Not Provided',
    product: data.product.trim(),
    message: data.message.trim(),
    destinationPort: data.destinationPort?.trim() || '',
    createdAt: dateStr,
    timestamp,
    ip: data.ip || '',
    userAgent: data.userAgent || '',
    status: 'new'
  };

  // 1. Update RFQ JSON
  const existingRfqs = getRfqInquiries();
  existingRfqs.unshift(newRecord);
  fs.writeFileSync(RFQ_JSON_FILE, JSON.stringify(existingRfqs, null, 2), 'utf-8');

  // 2. Append to RFQ CSV
  const csvRow = [
    escapeCsv(newRecord.id),
    escapeCsv(newRecord.createdAt),
    escapeCsv(newRecord.name),
    escapeCsv(newRecord.email),
    escapeCsv(newRecord.phone),
    escapeCsv(newRecord.product),
    escapeCsv(newRecord.message),
    escapeCsv(newRecord.status)
  ].join(',') + '\n';
  fs.appendFileSync(RFQ_CSV_FILE, csvRow, 'utf-8');

  // 3. Update Master Ledger JSON
  updateMasterLedger(newRecord);

  return newRecord;
}

// Read Sample Kit requests
export function getSampleRequests(): SampleRequest[] {
  try {
    initStorage();
    if (fs.existsSync(SAMPLES_JSON_FILE)) {
      const raw = fs.readFileSync(SAMPLES_JSON_FILE, 'utf-8');
      return JSON.parse(raw) as SampleRequest[];
    }
  } catch (err) {
    console.error('Error reading Sample requests JSON:', err);
  }
  return [];
}

// Save Sample Kit request to files (JSON, CSV, Master Ledger)
export function saveSampleRequest(data: Partial<SampleRequest> & { name: string; email: string; country: string; address: string }): SampleRequest {
  initStorage();

  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const trackingCode = `PRO-EXP-${randomSuffix}-DHL`;
  const id = `SMP-${new Date().getFullYear()}-${randomSuffix}`;

  const newRecord: SampleRequest = {
    id,
    trackingCode,
    type: 'sample_kit_request',
    name: data.name.trim(),
    company: data.company?.trim() || 'Direct Buyer / Horticulturalist',
    email: data.email.trim(),
    phone: data.phone?.trim() || 'Not Provided',
    country: data.country.trim(),
    address: data.address.trim(),
    cropType: data.cropType?.trim() || 'General Substrate Trials',
    ecPreference: data.ecPreference?.trim() || 'Low EC (< 0.5 mS/cm)',
    sampleType: data.sampleType?.trim() || 'Standard Commercial Kit (5kg + Briquette)',
    notes: data.notes?.trim() || '',
    createdAt: dateStr,
    timestamp,
    ip: data.ip || '',
    userAgent: data.userAgent || '',
    status: 'dispatched'
  };

  // 1. Update Samples JSON
  const existingSamples = getSampleRequests();
  existingSamples.unshift(newRecord);
  fs.writeFileSync(SAMPLES_JSON_FILE, JSON.stringify(existingSamples, null, 2), 'utf-8');

  // 2. Append to Samples CSV
  const csvRow = [
    escapeCsv(newRecord.trackingCode),
    escapeCsv(newRecord.createdAt),
    escapeCsv(newRecord.name),
    escapeCsv(newRecord.company),
    escapeCsv(newRecord.email),
    escapeCsv(newRecord.phone),
    escapeCsv(newRecord.country),
    escapeCsv(newRecord.address),
    escapeCsv(newRecord.cropType),
    escapeCsv(newRecord.ecPreference),
    escapeCsv(newRecord.sampleType),
    escapeCsv(newRecord.status)
  ].join(',') + '\n';
  fs.appendFileSync(SAMPLES_CSV_FILE, csvRow, 'utf-8');

  // 3. Update Master Ledger JSON
  updateMasterLedger(newRecord);

  return newRecord;
}

// Master Ledger updater
function updateMasterLedger(entry: RfqInquiry | SampleRequest): void {
  try {
    let ledger: Array<RfqInquiry | SampleRequest> = [];
    if (fs.existsSync(LEDGER_JSON_FILE)) {
      const raw = fs.readFileSync(LEDGER_JSON_FILE, 'utf-8');
      ledger = JSON.parse(raw);
    }
    ledger.unshift(entry);
    fs.writeFileSync(LEDGER_JSON_FILE, JSON.stringify(ledger, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error updating master ledger JSON:', err);
  }
}

// Summary Statistics
export function getStorageStats() {
  initStorage();
  const rfqs = getRfqInquiries();
  const samples = getSampleRequests();

  return {
    totalInquiries: rfqs.length,
    totalSamples: samples.length,
    totalSubmissions: rfqs.length + samples.length,
    lastSubmissionTime: rfqs[0]?.createdAt || samples[0]?.createdAt || null,
    files: {
      rfqJson: { path: 'data/rfq_inquiries.json', exists: fs.existsSync(RFQ_JSON_FILE), count: rfqs.length },
      rfqCsv: { path: 'data/rfq_inquiries.csv', exists: fs.existsSync(RFQ_CSV_FILE) },
      samplesJson: { path: 'data/sample_requests.json', exists: fs.existsSync(SAMPLES_JSON_FILE), count: samples.length },
      samplesCsv: { path: 'data/sample_requests.csv', exists: fs.existsSync(SAMPLES_CSV_FILE) },
      ledgerJson: { path: 'data/all_submissions_ledger.json', exists: fs.existsSync(LEDGER_JSON_FILE), count: rfqs.length + samples.length }
    }
  };
}

// Get file buffer or path for direct download with strict whitelist and traversal protection
export function getStorageFile(filename: string): { filePath: string; mimeType: string } | null {
  initStorage();
  // Strictly sanitize filename to prevent path traversal
  const safeFilename = path.basename(filename);

  const validFiles: Record<string, { path: string; mimeType: string }> = {
    'rfq_inquiries.json': { path: RFQ_JSON_FILE, mimeType: 'application/json' },
    'rfq_inquiries.csv': { path: RFQ_CSV_FILE, mimeType: 'text/csv' },
    'sample_requests.json': { path: SAMPLES_JSON_FILE, mimeType: 'application/json' },
    'sample_requests.csv': { path: SAMPLES_CSV_FILE, mimeType: 'text/csv' },
    'all_submissions_ledger.json': { path: LEDGER_JSON_FILE, mimeType: 'application/json' }
  };

  const fileInfo = validFiles[safeFilename];
  if (fileInfo && fs.existsSync(fileInfo.path)) {
    return { filePath: fileInfo.path, mimeType: fileInfo.mimeType };
  }
  return null;
}

// Update lead status in JSON files
export function updateLeadStatus(id: string, newStatus: string): boolean {
  initStorage();
  let updated = false;

  // Try RFQ inquiries
  if (fs.existsSync(RFQ_JSON_FILE)) {
    const rfqs = getRfqInquiries();
    const rfq = rfqs.find(r => r.id === id);
    if (rfq) {
      rfq.status = newStatus as any;
      fs.writeFileSync(RFQ_JSON_FILE, JSON.stringify(rfqs, null, 2), 'utf-8');
      updated = true;
    }
  }

  // Try Sample requests
  if (!updated && fs.existsSync(SAMPLES_JSON_FILE)) {
    const samples = getSampleRequests();
    const sample = samples.find(s => s.id === id || s.trackingCode === id);
    if (sample) {
      sample.status = newStatus as any;
      fs.writeFileSync(SAMPLES_JSON_FILE, JSON.stringify(samples, null, 2), 'utf-8');
      updated = true;
    }
  }

  return updated;
}
