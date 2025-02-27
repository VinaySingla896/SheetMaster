import { CellValue, CellData } from "@shared/schema";

type CellMap = { [key: string]: CellData };

export class FormulaEvaluator {
  private cells: CellMap;

  constructor(cells: CellMap) {
    this.cells = cells;
  }

  evaluateFormula(formula: string, cellRefs: string[]): CellValue {
    if (!formula.startsWith("=")) return formula;

    const functionName = formula.substring(1).split("(")[0].toUpperCase();
    const range = this.extractRange(formula);
    const values = this.getCellValues(range);

    switch (functionName) {
      case "SUM":
        return this.sum(values);
      case "AVERAGE":
        return this.average(values);
      case "MAX":
        return this.max(values);
      case "MIN":
        return this.min(values);
      case "COUNT":
        return this.count(values);
      case "TRIM":
        return this.trim(values[0]);
      case "UPPER":
        return this.upper(values[0]);
      case "LOWER":
        return this.lower(values[0]);
      default:
        return "#ERROR!";
    }
  }

  private extractRange(formula: string): string[] {
    const match = formula.match(/\((.*?)\)/);
    if (!match) return [];
    return match[1].split(",").map(r => r.trim());
  }

  private getCellValues(refs: string[]): CellValue[] {
    return refs.map(ref => this.cells[ref]?.value ?? null);
  }

  private sum(values: CellValue[]): number {
    return values.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  }

  private average(values: CellValue[]): number {
    const nums = values.filter((v): v is number => typeof v === 'number');
    return nums.length ? this.sum(nums) / nums.length : 0;
  }

  private max(values: CellValue[]): number {
    const nums = values.filter((v): v is number => typeof v === 'number');
    return Math.max(...nums);
  }

  private min(values: CellValue[]): number {
    const nums = values.filter((v): v is number => typeof v === 'number');
    return Math.min(...nums);
  }

  private count(values: CellValue[]): number {
    return values.filter(v => typeof v === 'number').length;
  }

  private trim(value: CellValue): string {
    return String(value).trim();
  }

  private upper(value: CellValue): string {
    return String(value).toUpperCase();
  }

  private lower(value: CellValue): string {
    return String(value).toLowerCase();
  }
}
