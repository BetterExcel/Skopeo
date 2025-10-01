import { describe, it, expect, vi } from 'vitest';
import { BasicTools } from '../src/agent/tools';
import { UNO_COMMANDS } from '../src/agent/types';

function createMockBridge() {
  return {
    uno: vi.fn().mockResolvedValue({ success: true }),
    request: vi.fn().mockResolvedValue({ success: true, data: {} }),
  } as any;
}

describe('BasicTools', () => {
  it('set_cell_text issues GoToCell and EnterString', async () => {
    const bridge = createMockBridge();
    const tools = new BasicTools(bridge);
    await tools.set_cell_text('A1', 'Hello');
    expect(bridge.uno).toHaveBeenCalledWith(UNO_COMMANDS.GO_TO_CELL, [{ name: 'ToPoint', value: 'A1' }]);
    expect(bridge.uno).toHaveBeenCalledWith(UNO_COMMANDS.ENTER_STRING, [{ name: 'StringName', value: 'Hello' }]);
  });

  it('apply_formula validates and sends EnterString', async () => {
    const bridge = createMockBridge();
    const tools = new BasicTools(bridge);
    await tools.apply_formula('B2', '=SUM(A1:A10)');
    expect(bridge.uno).toHaveBeenCalledWith(UNO_COMMANDS.ENTER_STRING, [{ name: 'StringName', value: '=SUM(A1:A10)' }]);
  });

  it('sort_range validates and sends DataSort', async () => {
    const bridge = createMockBridge();
    const tools = new BasicTools(bridge);
    await tools.sort_range('A1:C10', 'B', true);
    expect(bridge.uno).toHaveBeenCalledWith(UNO_COMMANDS.DATA_SORT, [
      { name: 'SortKey1', value: 'B' },
      { name: 'SortAscending1', value: true },
    ]);
  });
});
