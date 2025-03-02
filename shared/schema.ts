import { z } from "zod";

export type CellValue = string | number | null;

export interface CellData {
  value: CellValue;
  formula?: string;
  format?: {
    bold?: boolean;
    italic?: boolean;
    fontSize?: number;
    color?: string;
  };
}

export interface SheetData {
  cells: { [key: string]: CellData };
  rowCount: number;
  colCount: number;
}

// Define schema manually without database
export interface Sheet {
  id: number;
  name: string;
  data: SheetData;
}

export const insertSheetSchema = z.object({
  name: z.string(),
  data: z.object({
    cells: z.record(z.string(), z.object({
      value: z.union([z.string(), z.number(), z.null()]),
      formula: z.string().optional(),
      format: z.object({
        bold: z.boolean().optional(),
        italic: z.boolean().optional(),
        fontSize: z.number().optional(),
        color: z.string().optional()
      }).optional()
    })),
    rowCount: z.number(),
    colCount: z.number()
  })
});

export type InsertSheet = z.infer<typeof insertSheetSchema>;
