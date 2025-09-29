// Lightweight validators for spreadsheet operations

const CELL_ADDR_RE = /^\$?[A-Za-z]{1,3}\$?\d{1,7}$/; // e.g., A1, $B$2, AA10
const RANGE_RE = new RegExp(
  `^${CELL_ADDR_RE.source}(:${CELL_ADDR_RE.source})?$`,
);
const COLUMN_RE = /^[A-Za-z]{1,3}$/; // A, B, AA, XFD

export function validateCellAddress(address: string) {
  if (typeof address !== 'string' || !CELL_ADDR_RE.test(address.trim())) {
    throw new Error('INVALID_RANGE: Invalid cell address');
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
}

export function validateColumnId(column: string) {
  if (typeof column !== 'string' || !COLUMN_RE.test(column.trim())) {
    throw new Error('INVALID_COLUMN: Invalid column identifier');
  }
}

