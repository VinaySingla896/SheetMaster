import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sheets = pgTable("sheets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  data: jsonb("data").notNull(),
});

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

export const insertSheetSchema = createInsertSchema(sheets);
export type InsertSheet = z.infer<typeof insertSheetSchema>;
export type Sheet = typeof sheets.$inferSelect;
