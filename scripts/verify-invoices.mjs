import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Papa from 'papaparse';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_TERM_DAYS = 60;

function exitWith(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function parseEsDate(value) {
  if (!value) return NaN;
  const parts = String(value).trim().split('/');
  if (parts.length !== 3) return NaN;
  const [day, month, year] = parts.map(part => Number(part));
  if (!day || !month || !year) return NaN;
  return new Date(year, month - 1, day).getTime();
}

function parseInvoiceNumber(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  const withSeries = /^(?<series>[A-Za-z0-9]+)-(?<year>\d{4})-(?<sequence>\d{3,})$/;
  const withoutSeries = /^(?<year>\d{4})-(?<sequence>\d{3,})$/;
  const match = trimmed.match(withSeries) || trimmed.match(withoutSeries);
  if (!match?.groups) return null;
  return {
    series: match.groups.series || 'FS',
    fiscalYear: Number(match.groups.year),
    sequence: Number(match.groups.sequence),
  };
}

function formatIssue(index, message) {
  return `Row ${index + 2}: ${message}`;
}

const inputPath = process.argv[2];
if (!inputPath) {
  exitWith('Usage: node scripts/verify-invoices.mjs <path-to-csv>');
}

const resolvedPath = path.resolve(process.cwd(), inputPath);
if (!fs.existsSync(resolvedPath)) {
  exitWith(`CSV file not found: ${resolvedPath}`);
}

const raw = fs.readFileSync(resolvedPath, 'utf8').replace(/^\uFEFF/, '');
const parsed = Papa.parse(raw, { skipEmptyLines: true });

if (parsed.errors?.length) {
  console.error('CSV parse errors:');
  parsed.errors.forEach(err => console.error(`- ${err.message}`));
  process.exit(1);
}

const rows = parsed.data;
if (!rows || rows.length < 2) {
  exitWith('CSV does not contain invoice rows.');
}

const dataRows = rows.slice(1);
const errors = [];
const warnings = [];
const sequencesByKey = new Map();
const totalsIssues = [];

dataRows.forEach((row, index) => {
  const cols = Array.isArray(row) ? row : [];
  if (cols.length < 9) {
    errors.push(formatIssue(index, 'Missing columns (expected 9).'));
    return;
  }

  const invoiceNumber = cols[0];
  const issueDate = parseEsDate(cols[1]);
  const dueDate = parseEsDate(cols[2]);
  const status = String(cols[4] || '').trim();
  const baseTotal = Number(cols[5]);
  const vatAmount = Number(cols[6]);
  const irpfAmount = Number(cols[7]);
  const totalAmount = Number(cols[8]);

  const parsedNumber = parseInvoiceNumber(invoiceNumber);
  if (!parsedNumber) {
    errors.push(formatIssue(index, `Invalid invoice number: ${invoiceNumber}`));
  } else {
    const key = `${parsedNumber.series}-${parsedNumber.fiscalYear}`;
    const entry = sequencesByKey.get(key) || [];
    entry.push(parsedNumber.sequence);
    sequencesByKey.set(key, entry);
  }

  if (!Number.isFinite(issueDate) || !Number.isFinite(dueDate)) {
    errors.push(formatIssue(index, 'Invalid issue/due date format.'));
  } else {
    if (dueDate < issueDate) {
      errors.push(formatIssue(index, 'Due date is before issue date.'));
    }
    const termDays = Math.floor((dueDate - issueDate) / MS_PER_DAY);
    if (termDays > MAX_TERM_DAYS) {
      errors.push(
        formatIssue(index, `Payment term exceeds ${MAX_TERM_DAYS} days (${termDays}).`)
      );
    }
  }

  if (!status) {
    warnings.push(formatIssue(index, 'Missing status.'));
  }

  if (
    Number.isFinite(baseTotal) &&
    Number.isFinite(vatAmount) &&
    Number.isFinite(irpfAmount) &&
    Number.isFinite(totalAmount)
  ) {
    const computed = Number((baseTotal + vatAmount - irpfAmount).toFixed(2));
    const reported = Number(totalAmount.toFixed(2));
    if (computed !== reported) {
      totalsIssues.push(
        formatIssue(
          index,
          `Total mismatch: expected ${computed.toFixed(2)}, got ${reported.toFixed(2)}.`
        )
      );
    }
  }
});

for (const [key, sequences] of sequencesByKey.entries()) {
  const seen = new Set();
  const duplicates = [];
  sequences.forEach(seq => {
    if (seen.has(seq)) duplicates.push(seq);
    seen.add(seq);
  });
  if (duplicates.length) {
    errors.push(`Duplicate sequences for ${key}: ${duplicates.join(', ')}`);
  }

  const sorted = [...seen].sort((a, b) => a - b);
  const missing = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (next !== current + 1) {
      for (let value = current + 1; value < next; value += 1) {
        missing.push(value);
      }
    }
  }
  if (missing.length) {
    warnings.push(`Missing sequences for ${key}: ${missing.join(', ')}`);
  }
}

if (totalsIssues.length) {
  warnings.push(...totalsIssues);
}

if (errors.length) {
  console.error('Verification failed:');
  errors.forEach(err => console.error(`- ${err}`));
} else {
  console.log('Verification passed with no blocking errors.');
}

if (warnings.length) {
  console.warn('Warnings:');
  warnings.forEach(warn => console.warn(`- ${warn}`));
}

process.exit(errors.length ? 1 : 0);
