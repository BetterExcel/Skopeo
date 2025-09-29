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
