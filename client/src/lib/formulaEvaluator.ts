import { CellValue, CellData } from "@shared/schema";

type CellMap = { [key: string]: CellData };

export class FormulaEvaluator {
  private cells: CellMap;

  constructor(cells: CellMap) {
    this.cells = cells;
  }

  evaluateFormula(formula: string, cellRefs: string[]): CellValue {
    if (!formula.startsWith("=")) return formula;

    const functionMatch = formula.match(/^=([A-Z_]+)\((.*)\)$/);
    if (!functionMatch) return "#ERROR!";

    const functionName = functionMatch[1];
    const args = functionMatch[2].split(",").map(arg => arg.trim());

    try {
      switch (functionName) {
        case "SUM":
          return this.sum(this.getCellValues(args));
        case "AVERAGE":
          return this.average(this.getCellValues(args));
        case "MAX":
          return this.max(this.getCellValues(args));
        case "MIN":
          return this.min(this.getCellValues(args));
        case "COUNT":
          return this.count(this.getCellValues(args));
        case "TRIM":
          return this.trim(this.getCellValue(args[0]));
        case "UPPER":
          return this.upper(this.getCellValue(args[0]));
        case "LOWER":
          return this.lower(this.getCellValue(args[0]));
        case "FIND_AND_REPLACE":
          if (args.length !== 3) return "#ERROR!";
          return this.findAndReplace(this.getCellValue(args[0]), args[1], args[2]);
        default:
          return "#ERROR!";
      }
    } catch (error) {
      return "#ERROR!";
    }
  }

  private getCellValue(ref: string): CellValue {
    return this.cells[ref]?.value ?? null;
  }

  private getCellValues(refs: string[]): CellValue[] {
    return refs.map(ref => this.getCellValue(ref));
  }

  private sum(values: CellValue[]): number {
    const nums = values.filter((v): v is number => typeof v === 'number');
    return nums.reduce((sum, val) => sum + val, 0);
  }

  private average(values: CellValue[]): number {
    const nums = values.filter((v): v is number => typeof v === 'number');
    return nums.length ? this.sum(nums) / nums.length : 0;
  }

  private max(values: CellValue[]): number {
    const nums = values.filter((v): v is number => typeof v === 'number');
    if (!nums.length) return 0;
    return Math.max(...nums);
  }

  private min(values: CellValue[]): number {
    const nums = values.filter((v): v is number => typeof v === 'number');
    if (!nums.length) return 0;
    return Math.min(...nums);
  }

  private count(values: CellValue[]): number {
    return values.filter(v => typeof v === 'number').length;
  }

  private trim(value: CellValue): string {
    return String(value ?? '').trim();
  }

  private upper(value: CellValue): string {
    return String(value ?? '').toUpperCase();
  }

  private lower(value: CellValue): string {
    return String(value ?? '').toLowerCase();
  }

  private findAndReplace(value: CellValue, find: string, replace: string): string {
    return String(value ?? '').replace(new RegExp(find, 'g'), replace);
  }
}