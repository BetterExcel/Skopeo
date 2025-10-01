// Lightweight validators for spreadsheet operations

// Spreadsheet limits (approx for Calc/Excel)
const MAX_COLS = 16384; // XFD
const MAX_ROWS = 1048576; // 1,048,576

const CELL_ADDR_RE = /^\$?[A-Za-z]{1,3}\$?\d{1,7}$/; // e.g., A1, $B$2, AA10
const RANGE_RE = new RegExp(
  `^${CELL_ADDR_RE.source}(:${CELL_ADDR_RE.source})?$`,
);
const COLUMN_RE = /^[A-Za-z]{1,3}$/; // A, B, AA, XFD

export function validateCellAddress(address: string) {
  if (typeof address !== 'string' || !CELL_ADDR_RE.test(address.trim())) {
    throw new Error('INVALID_RANGE: Invalid cell address');
  }
  // Bounds check
  const { col, row } = parseAddress(address);
  if (col < 1 || col > MAX_COLS || row < 1 || row > MAX_ROWS) {
    throw new Error('INVALID_RANGE: Address out of bounds');
  }
}

export function validateFormula(formula: string) {
  if (typeof formula !== 'string' || !formula.startsWith('=')) {
    throw new Error('FORMULA_ERROR: Formula must start with =');
  }
  if (formula.length < 2) {
    throw new Error('FORMULA_ERROR: Formula is too short');
  }
}

export function validateRange(range: string) {
  if (typeof range !== 'string' || !RANGE_RE.test(range.trim())) {
    throw new Error('INVALID_RANGE: Invalid range');
  }
  const [start, end] = range.split(':');
  const a = parseAddress(start);
  const b = end ? parseAddress(end) : a;
  if (a.col > b.col || a.row > b.row) {
    throw new Error('INVALID_RANGE: Start must be top-left of range');
  }
  if (b.col > MAX_COLS || b.row > MAX_ROWS) {
    throw new Error('INVALID_RANGE: Range exceeds sheet bounds');
  }
}

export function validateColumnId(column: string) {
  if (typeof column !== 'string' || !COLUMN_RE.test(column.trim())) {
    throw new Error('INVALID_COLUMN: Invalid column identifier');
  }
}

// Basic malicious content detection for text/formulas (client-side)
export function validateSafeText(text: string) {
  if (typeof text !== 'string') return;
  // Prevent extremely long strings
  if (text.length > 100000) throw new Error('INVALID_TEXT: Text too long');
}

export function validateSafeFormula(formula: string) {
  validateFormula(formula);
  // Optionally block external links or volatile functions if policy requires
  // Here we only guard length to prevent abuse.
  if (formula.length > 50000) throw new Error('FORMULA_ERROR: Formula too long');
}

// Utilities
function parseAddress(addr: string): { col: number; row: number } {
  const m = addr.replace(/\$/g, '').match(/^([A-Za-z]{1,3})(\d{1,7})$/);
  if (!m) throw new Error('INVALID_RANGE: Invalid address');
  return { col: colLettersToNumber(m[1]), row: parseInt(m[2], 10) };
}

function colLettersToNumber(letters: string): number {
  const s = letters.toUpperCase();
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    n = n * 26 + (s.charCodeAt(i) - 64);
  }
  return n;
}

