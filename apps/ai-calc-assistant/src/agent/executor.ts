import { BasicTools } from './tools';

export type ToolCall = {
  id?: string;
  name: string;
  arguments: Record<string, any>;
};

export type ExecResult = {
  toolCallId: string;
  success: boolean;
  error?: string;
};

export class ToolExecutor {
  constructor(private tools: BasicTools) {}

  async run(calls: ToolCall[], onProgress?: (update: ExecResult) => void) {
    for (const call of calls) {
      const id = call.id || Math.random().toString(36).slice(2);
      try {
        await this.dispatch(call);
        onProgress?.({ toolCallId: id, success: true });
      } catch (e: any) {
        const message = e?.message || String(e);
        // Attempt automatic undo for data modification operations
        try {
          if (['set_cell_text', 'apply_formula', 'sort_range'].includes(call.name)) {
            await this.tools.undo();
          }
        } catch {
          // ignore undo errors
        }
        onProgress?.({ toolCallId: id, success: false, error: message });
        // Stop on first failure
        throw new Error(message);
      }
    }
  }

  private async dispatch(call: ToolCall) {
    const a = call.arguments || {};
    switch (call.name) {
      case 'set_cell_text':
        return this.tools.set_cell_text(String(a.address), String(a.text));
      case 'apply_formula':
        return this.tools.apply_formula(String(a.address), String(a.formula));
      case 'go_to_cell':
        return this.tools.go_to_cell(String(a.address));
      case 'sort_range':
        return this.tools.sort_range(String(a.range), String(a.column), !!a.ascending);
      case 'format_range_currency':
        return this.tools.format_range_currency(String(a.range));
      case 'format_range_bold':
        return this.tools.format_range_bold(String(a.range), a.bold !== false);
      case 'undo':
        return this.tools.undo();
      case 'redo':
        return this.tools.redo();
      default:
        throw new Error(`UNKNOWN_TOOL: ${call.name}`);
    }
  }
}
