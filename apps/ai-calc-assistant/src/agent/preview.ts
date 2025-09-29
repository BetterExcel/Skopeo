import type { ToolCall } from './executor';

export type PreviewSummary = {
  totalCells: number;
  ranges: string[];
  requiresConfirmation: boolean;
  reason?: string;
};

export function estimateCells(range: string): number {
  const m = range.match(/^(\$?[A-Za-z]{1,3}\$?\d{1,7})(?::(\$?[A-Za-z]{1,3}\$?\d{1,7}))?$/);
  if (!m) return 1;
  const [start, end] = [m[1], m[2] || m[1]];
  const [c1, r1] = splitCell(start);
  const [c2, r2] = splitCell(end);
  const cols = Math.abs(colToNum(c2) - colToNum(c1)) + 1;
  const rows = Math.abs(r2 - r1) + 1;
  return cols * rows;
}

function splitCell(addr: string): [string, number] {
  const m = addr.match(/\$?([A-Za-z]{1,3})\$?(\d{1,7})/);
  if (!m) return ['A', 1];
  return [m[1], Number(m[2])];
}

function colToNum(col: string): number {
  let n = 0;
  const s = col.toUpperCase();
  for (let i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64);
  return n;
}

export function summarizePreview(calls: ToolCall[], cfg: { maxCellsWithoutConfirmation: number }): PreviewSummary {
  const ranges: string[] = [];
  let total = 0;
  for (const c of calls) {
    const a = c.arguments || {};
    if (c.name === 'set_cell_text' || c.name === 'apply_formula' || c.name === 'go_to_cell') {
      if (a.address) { ranges.push(String(a.address)); total += 1; }
    } else if (c.name === 'sort_range' || c.name === 'format_range_currency' || c.name === 'format_range_bold') {
      if (a.range) { ranges.push(String(a.range)); total += estimateCells(String(a.range)); }
    }
  }
  const requires = total > (cfg.maxCellsWithoutConfirmation || 1000);
  return { totalCells: total, ranges, requiresConfirmation: requires, reason: requires ? 'LARGE_OPERATION' : undefined };
}
