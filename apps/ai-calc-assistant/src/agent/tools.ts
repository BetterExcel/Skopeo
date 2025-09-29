import { UNOBridge } from './bridge';
import {
  validateCellAddress,
  validateFormula,
  validateRange,
  validateColumnId,
} from './validators';
import { UNO_COMMANDS, type UNOArgument } from './types';

export class BasicTools {
  constructor(private bridge: UNOBridge) {}

  async go_to_cell(address: string) {
    validateCellAddress(address);
    const args: UNOArgument[] = [{ name: 'ToPoint', value: address }];
    await this.bridge.uno(UNO_COMMANDS.GO_TO_CELL, args);
  }

  async set_cell_text(address: string, text: string) {
    validateCellAddress(address);
    await this.go_to_cell(address);
    const args: UNOArgument[] = [{ name: 'StringName', value: String(text) }];
    await this.bridge.uno(UNO_COMMANDS.ENTER_STRING, args);
  }

  async apply_formula(address: string, formula: string) {
    validateCellAddress(address);
    validateFormula(formula);
    await this.go_to_cell(address);
    const args: UNOArgument[] = [{ name: 'StringName', value: formula }];
    await this.bridge.uno(UNO_COMMANDS.ENTER_STRING, args);
  }

  // Advanced features
  async undo() {
    await this.bridge.uno(UNO_COMMANDS.UNDO, []);
  }

  async redo() {
    await this.bridge.uno(UNO_COMMANDS.REDO, []);
  }

  async get_selection(): Promise<{ range?: string }> {
    // Collabora typically posts back selection details; here we assume a generic request handler
    const res = await this.bridge.request('get_selection', {});
    return (res.data as any) || {};
  }

  async create_pivot(range: string) {
    // Minimal validation; further config (rows/cols/values) can be added later
    validateRange(range);
    await this.go_to_cell(range.split(':')[0]);
    await this.bridge.uno(UNO_COMMANDS.DATA_PILOT_INSERT, []);
  }

  async create_chart(range: string, type: 'bar' | 'line' | 'pie' = 'bar') {
    validateRange(range);
    await this.go_to_cell(range.split(':')[0]);
    // Chart type mapping can be expanded; issuing insert chart command opens dialog in many cases
    await this.bridge.uno(UNO_COMMANDS.INSERT_CHART, [
      { name: 'Range', value: range },
      { name: 'ChartType', value: type },
    ]);
  }

  // Formatting helpers
  async format_range_bold(range: string, bold = true) {
    validateRange(range);
    await this.go_to_cell(range.split(':')[0]);
    await this.bridge.uno(UNO_COMMANDS.BOLD, [{ name: 'Bold', value: bold }]);
  }

  async format_range_currency(range: string) {
    validateRange(range);
    await this.go_to_cell(range.split(':')[0]);
    await this.bridge.uno(UNO_COMMANDS.CURRENCY_FORMAT, []);
  }

  // Sorting
  async sort_range(range: string, column: string, ascending: boolean) {
    validateRange(range);
    validateColumnId(column);
    // Go to first cell in range to ensure correct context
    await this.go_to_cell(range.split(':')[0]);
    const args: UNOArgument[] = [
      { name: 'SortKey1', value: column.toUpperCase() },
      { name: 'SortAscending1', value: !!ascending },
    ];
    await this.bridge.uno(UNO_COMMANDS.DATA_SORT, args);
  }

  // Filtering (basic toggle – details can be expanded later)
  async filter_range_autofilter(range: string) {
    validateRange(range);
    await this.go_to_cell(range.split(':')[0]);
    // Collabora uses different UNO commands for filters; placeholder for future expansion
    // For now, we can rely on DataFilter/StandardFilter in later tasks
  }

  // Named range creation (placeholder – actual dialog-driven command may be needed)
  async named_range_create(name: string, range: string) {
    validateRange(range);
    if (!name || /\s/.test(name)) throw new Error('INVALID_NAME: Name required without spaces');
    // Placeholder: The actual UNO command for DefineName can be integrated later in 3.3 or 3.4
    // await this.bridge.uno('.uno:DefineName', [ ... ]);
  }

  // Selection helper for preview/highlight
  async select_range(range: string) {
    validateRange(range);
    await this.bridge.uno(UNO_COMMANDS.GO_TO_CELL, [{ name: 'ToPoint', value: range }]);
  }
}
