import { describe, it, expect, vi } from 'vitest';
import { ToolExecutor, type ToolCall } from '../src/agent/executor';

function makeExecutor(overrides: Partial<Record<string, any>> = {}) {
  const tools = {
    set_cell_text: vi.fn(),
    apply_formula: vi.fn(),
    go_to_cell: vi.fn(),
    sort_range: vi.fn(),
    format_range_currency: vi.fn(),
    format_range_bold: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    ...overrides,
  } as any;
  return { executor: new ToolExecutor(tools), tools };
}

describe('ToolExecutor retry/undo behavior', () => {
  it('retries once on timeout and succeeds without undo', async () => {
    const err = new Error('UNO command timeout');
    const { executor, tools } = makeExecutor({
      set_cell_text: vi
        .fn()
        .mockRejectedValueOnce(err)
        .mockResolvedValueOnce(undefined),
    });

    const onProgress = vi.fn();
    const calls: ToolCall[] = [{ name: 'set_cell_text', arguments: { address: 'A1', text: 'X' } }];

    await expect(executor.run(calls, onProgress)).resolves.toBeUndefined();

    expect(tools.set_cell_text).toHaveBeenCalledTimes(2);
    expect(tools.undo).not.toHaveBeenCalled();
    // Last progress event should be success
    const last = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];
    expect(last.success).toBe(true);
  });

  it('calls undo when a modifying operation fails after retry', async () => {
    const err = new Error('FORMULA_ERROR: bad formula');
    const { executor, tools } = makeExecutor({
      apply_formula: vi.fn().mockRejectedValue(err),
    });

    const onProgress = vi.fn();
    const calls: ToolCall[] = [{ name: 'apply_formula', arguments: { address: 'B2', formula: '=FOO()' } }];

    await expect(executor.run(calls, onProgress)).rejects.toBeTruthy();

    // Should have attempted twice (initial + one retry)
    expect(tools.apply_formula).toHaveBeenCalledTimes(2);
    // Undo should be attempted on failure
    expect(tools.undo).toHaveBeenCalledTimes(1);
    const last = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];
    expect(last.success).toBe(false);
    expect(String(last.error || '')).toContain('formula');
  });

  it('does not undo for non-modifying failures (go_to_cell)', async () => {
    const { executor, tools } = makeExecutor({
      go_to_cell: vi.fn().mockRejectedValue(new Error('TIMEOUT: transient')),
    });
    const onProgress = vi.fn();
    const calls: ToolCall[] = [{ name: 'go_to_cell', arguments: { address: 'C3' } }];
    await expect(executor.run(calls, onProgress)).rejects.toBeTruthy();
    expect(tools.undo).not.toHaveBeenCalled();
  });
});
