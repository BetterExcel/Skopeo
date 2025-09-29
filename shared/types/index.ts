// Shared TypeScript interfaces for AI Calc Assistant

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  description?: string;
}

export interface ToolResult {
  toolCallId: string;
  success: boolean;
  result?: any;
  error?: string;
  affectedCells?: string[];
}

export interface UNOArgument {
  name: string;
  value: any;
}

export interface UNOResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const UNO_COMMANDS = {
  GO_TO_CELL: '.uno:GoToCell',
  ENTER_STRING: '.uno:EnterString',
  DATA_SORT: '.uno:DataSort',
  INSERT_CHART: '.uno:InsertObjectChart',
  DATA_PILOT_INSERT: '.uno:DataPilotInsert',
  BOLD: '.uno:Bold',
  CURRENCY_FORMAT: '.uno:NumberFormatCurrency',
  UNDO: '.uno:Undo',
  REDO: '.uno:Redo',
} as const;

export interface AIConfig {
  openaiApiKey: string;
  orchestratorUrl: string;
  postMessageOrigin: string;
  maxCellsWithoutConfirmation: number;
  enableDryRun: boolean;
}

export interface SheetContext {
  currentSheet: string;
  selection?: {
    range: string;
    type: 'cell' | 'range' | 'column' | 'row';
  };
  namedRanges: string[];
  sheetNames: string[];
  documentType: 'calc' | 'writer' | 'impress';
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO string
  status?: 'pending' | 'success' | 'error';
}

export interface ExecutionPlan {
  id: string;
  description: string;
  toolCalls: ToolCall[];
  estimatedCells: number;
  requiresConfirmation: boolean;
}
