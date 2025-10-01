import { describe, it, expect } from 'vitest';
import { validateCellAddress, validateRange, validateFormula } from '../src/agent/validators';

describe('validators', () => {
  it('validates cell addresses', () => {
    expect(() => validateCellAddress('A1')).not.toThrow();
    expect(() => validateCellAddress('$B$2')).not.toThrow();
    expect(() => validateCellAddress('XFD1048576')).not.toThrow();
    expect(() => validateCellAddress('ZZZ1048577')).toThrow();
    expect(() => validateCellAddress('1A')).toThrow();
  });

  it('validates ranges', () => {
    expect(() => validateRange('A1:C10')).not.toThrow();
    expect(() => validateRange('B2:B2')).not.toThrow();
    expect(() => validateRange('C10:A1')).toThrow();
    expect(() => validateRange('A0:B2')).toThrow();
  });

  it('validates formulas', () => {
    expect(() => validateFormula('=SUM(A1:A10)')).not.toThrow();
    expect(() => validateFormula('SUM(A1:A10)')).toThrow();
    expect(() => validateFormula('=')).toThrow();
  });
});
