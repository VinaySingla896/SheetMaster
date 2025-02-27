import { sheets, type Sheet, type InsertSheet, type SheetData } from "@shared/schema";

export interface IStorage {
  getSheet(id: number): Promise<Sheet | undefined>;
  createSheet(sheet: InsertSheet): Promise<Sheet>;
  updateSheet(id: number, data: SheetData): Promise<Sheet | undefined>;
}

export class MemStorage implements IStorage {
  private sheets: Map<number, Sheet>;
  currentId: number;

  constructor() {
    this.sheets = new Map();
    this.currentId = 1;
  }

  async getSheet(id: number): Promise<Sheet | undefined> {
    return this.sheets.get(id);
  }

  async createSheet(insertSheet: InsertSheet): Promise<Sheet> {
    const id = this.currentId++;
    const sheet: Sheet = { ...insertSheet, id };
    this.sheets.set(id, sheet);
    return sheet;
  }

  async updateSheet(id: number, data: SheetData): Promise<Sheet | undefined> {
    const sheet = this.sheets.get(id);
    if (!sheet) return undefined;
    
    const updated = { ...sheet, data };
    this.sheets.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
