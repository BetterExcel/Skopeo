export type ErrorCode =
  | 'TIMEOUT'
  | 'ORIGIN_MISMATCH'
  | 'COLLABORA_NOT_READY'
  | 'INVALID_RANGE'
  | 'INVALID_ADDRESS'
  | 'FORMULA_ERROR'
  | 'PROTECTED_SHEET'
  | 'UNKNOWN_TOOL'
  | 'TRANSIENT'
  | 'UNKNOWN';

export type ClassifiedError = {
  code: ErrorCode;
  technical: string;
  retryable: boolean;
};

export function classifyError(err: unknown): ClassifiedError {
  const tech = (err as any)?.message ? String((err as any).message) : String(err);
  const t = tech.toUpperCase();

  if (t.includes('TIMEOUT')) return { code: 'TIMEOUT', technical: tech, retryable: true };
  if (t.includes('ORIGIN') && t.includes('MISMATCH')) return { code: 'ORIGIN_MISMATCH', technical: tech, retryable: false };
  if (t.includes('CONTENTWINDOW') || t.includes('COLLABORA') && t.includes('READY') || t.includes('IFRAME')) return { code: 'COLLABORA_NOT_READY', technical: tech, retryable: true };
  if (t.includes('INVALID_RANGE')) return { code: 'INVALID_RANGE', technical: tech, retryable: false };
  if (t.includes('INVALID_ADDRESS') || t.includes('ADDRESS')) return { code: 'INVALID_ADDRESS', technical: tech, retryable: false };
  if (t.includes('FORMULA') && t.includes('ERROR') || t.includes('INVALID_FORMULA')) return { code: 'FORMULA_ERROR', technical: tech, retryable: false };
  if (t.includes('PROTECTED') && t.includes('SHEET')) return { code: 'PROTECTED_SHEET', technical: tech, retryable: false };
  if (t.includes('UNKNOWN_TOOL')) return { code: 'UNKNOWN_TOOL', technical: tech, retryable: false };

  // Generic transient buckets
  if (t.includes('NETWORK') || t.includes('TEMPORARY') || t.includes('BUSY')) return { code: 'TRANSIENT', technical: tech, retryable: true };

  return { code: 'UNKNOWN', technical: tech, retryable: false };
}

export function userMessage(code: ErrorCode): string {
  switch (code) {
    case 'TIMEOUT':
      return 'The editor didn’t respond in time. I’ll try again briefly.';
    case 'ORIGIN_MISMATCH':
      return 'Security origin mismatch. Check PostMessageOrigin in Richdocuments configuration.';
    case 'COLLABORA_NOT_READY':
      return 'The editor is still loading. Please wait a moment and try again.';
    case 'INVALID_RANGE':
      return 'That range looks invalid. Please check the start and end addresses (e.g., A1:C10).';
    case 'INVALID_ADDRESS':
      return 'That cell address looks invalid. Please use a format like A1 or $B$2.';
    case 'FORMULA_ERROR':
      return 'There’s a problem with the formula syntax. Please review the formula and try again.';
    case 'PROTECTED_SHEET':
      return 'This sheet seems protected. Please unprotect it before making changes.';
    case 'UNKNOWN_TOOL':
      return 'I don’t recognize that operation. Try rephrasing or use a supported command.';
    case 'TRANSIENT':
      return 'Temporary issue communicating with the editor. I’ll retry automatically.';
    default:
      return 'Unexpected error. Please try again.';
  }
}
