declare module 'xlsx' {
  export function read(data: string | ArrayBuffer | Uint8Array, options?: { type?: string }): Workbook;
  export const utils: {
    sheet_to_json(sheet: any, options?: { defval?: any }): any[];
  };
  export interface Workbook {
    SheetNames: string[];
    Sheets: Record<string, any>;
  }
}
