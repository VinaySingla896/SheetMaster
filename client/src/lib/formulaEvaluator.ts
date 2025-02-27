
import { CellData } from "@shared/schema";

type CellMap = Record<string, CellData>;

export class FormulaEvaluator {
  private cells: CellMap;
  private visitedCells: Set<string>;

  constructor(cells: CellMap) {
    this.cells = cells;
    this.visitedCells = new Set();
  }

  evaluateFormula(formula: string, dependentRefs: string[] = []): string | number {
    if (!formula.startsWith('=')) {
      return formula;
    }

    try {
      const funcMatch = formula.match(/^=([A-Z_]+)\((.*)\)$/);
      if (!funcMatch) {
        // Try to evaluate as a cell reference
        if (formula.match(/^=[A-Z]+[0-9]+$/)) {
          const ref = formula.substring(1);
          return this.getCellValue(ref, dependentRefs);
        }
        return "FORMULA ERROR";
      }

      const funcName = funcMatch[1];
      const args = this.parseArgs(funcMatch[2]);

      switch (funcName) {
        case 'SUM':
          return this.sum(args);
        case 'AVERAGE':
          return this.average(args);
        case 'MAX':
          return this.max(args);
        case 'MIN':
          return this.min(args);
        case 'COUNT':
          return this.count(args);
        case 'TRIM':
          return this.trim(args);
        case 'UPPER':
          return this.upper(args);
        case 'LOWER':
          return this.lower(args);
        case 'REMOVE_DUPLICATES':
          return this.removeDuplicates(args);
        case 'FIND_AND_REPLACE':
          return this.findAndReplace(args);
        default:
          return "UNKNOWN FUNCTION";
      }
    } catch (error) {
      console.error("Formula evaluation error:", error);
      return "ERROR";
    }
  }

  private parseArgs(argsStr: string): string[] {
    const args: string[] = [];
    let currentArg = '';
    let inQuotes = false;
    let depth = 0;

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];
      
      if (char === '"' && argsStr[i-1] !== '\\') {
        inQuotes = !inQuotes;
        currentArg += char;
      } else if (char === '(' && !inQuotes) {
        depth++;
        currentArg += char;
      } else if (char === ')' && !inQuotes) {
        depth--;
        currentArg += char;
      } else if (char === ',' && !inQuotes && depth === 0) {
        args.push(currentArg.trim());
        currentArg = '';
      } else {
        currentArg += char;
      }
    }
    
    if (currentArg.trim()) {
      args.push(currentArg.trim());
    }
    
    return args;
  }

  private getCellValue(ref: string, dependentRefs: string[] = []): string | number {
    if (dependentRefs.includes(ref)) {
      return "#CIRCULAR_REF";
    }

    const cell = this.cells[ref];
    if (!cell) return 0;

    if (cell.formula && cell.formula.startsWith('=')) {
      const newDependentRefs = [...dependentRefs, ref];
      return this.evaluateFormula(cell.formula, newDependentRefs);
    }

    return cell.value ?? "";
  }

  private expandRange(range: string): string[] {
    const rangeRegex = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/;
    const match = range.match(rangeRegex);
    
    if (!match) {
      return [range]; // Not a range, return as is
    }
    
    const startCol = match[1];
    const startRow = parseInt(match[2]);
    const endCol = match[3];
    const endRow = parseInt(match[4]);
    
    const startColNum = this.columnToNumber(startCol);
    const endColNum = this.columnToNumber(endCol);
    
    const cells: string[] = [];
    
    for (let col = startColNum; col <= endColNum; col++) {
      const colLetter = this.numberToColumn(col);
      for (let row = startRow; row <= endRow; row++) {
        cells.push(`${colLetter}${row}`);
      }
    }
    
    return cells;
  }

  private columnToNumber(column: string): number {
    let result = 0;
    for (let i = 0; i < column.length; i++) {
      result = result * 26 + (column.charCodeAt(i) - 64);
    }
    return result;
  }

  private numberToColumn(num: number): string {
    let result = '';
    while (num > 0) {
      const remainder = (num - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      num = Math.floor((num - 1) / 26);
    }
    return result;
  }

  private getCellsFromRange(arg: string): string[] {
    if (arg.includes(':')) {
      return this.expandRange(arg);
    }
    return [arg];
  }

  private getNumericValues(cells: string[]): number[] {
    return cells
      .map(cellRef => this.getCellValue(cellRef))
      .filter(value => !isNaN(Number(value)))
      .map(value => Number(value));
  }

  // Mathematical Functions
  private sum(args: string[]): number {
    if (args.length === 0) return 0;
    
    const allCells = args.flatMap(arg => this.getCellsFromRange(arg));
    const values = this.getNumericValues(allCells);
    
    return values.reduce((sum, value) => sum + value, 0);
  }

  private average(args: string[]): number | string {
    if (args.length === 0) return 0;
    
    const allCells = args.flatMap(arg => this.getCellsFromRange(arg));
    const values = this.getNumericValues(allCells);
    
    if (values.length === 0) return "#DIV/0!";
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private max(args: string[]): number | string {
    if (args.length === 0) return 0;
    
    const allCells = args.flatMap(arg => this.getCellsFromRange(arg));
    const values = this.getNumericValues(allCells);
    
    if (values.length === 0) return "N/A";
    return Math.max(...values);
  }

  private min(args: string[]): number | string {
    if (args.length === 0) return 0;
    
    const allCells = args.flatMap(arg => this.getCellsFromRange(arg));
    const values = this.getNumericValues(allCells);
    
    if (values.length === 0) return "N/A";
    return Math.min(...values);
  }

  private count(args: string[]): number {
    if (args.length === 0) return 0;
    
    const allCells = args.flatMap(arg => this.getCellsFromRange(arg));
    return this.getNumericValues(allCells).length;
  }

  // Data Quality Functions
  private trim(args: string[]): string {
    if (args.length === 0) return "";
    
    const cellRef = args[0];
    const value = String(this.getCellValue(cellRef));
    return value.trim();
  }

  private upper(args: string[]): string {
    if (args.length === 0) return "";
    
    const cellRef = args[0];
    const value = String(this.getCellValue(cellRef));
    return value.toUpperCase();
  }

  private lower(args: string[]): string {
    if (args.length === 0) return "";
    
    const cellRef = args[0];
    const value = String(this.getCellValue(cellRef));
    return value.toLowerCase();
  }

  private removeDuplicates(args: string[]): string {
    if (args.length === 0) return "No range specified";
    
    const range = args[0];
    if (!range.includes(':')) return "Invalid range";
    
    return `REMOVE_DUPLICATES function called on range ${range}. Please check for duplicate rows found.`;
  }

  private findAndReplace(args: string[]): string {
    if (args.length < 3) return "Not enough arguments";
    
    const cellRef = args[0];
    const searchText = this.extractStringArg(args[1]);
    const replaceText = this.extractStringArg(args[2]);
    
    const value = String(this.getCellValue(cellRef));
    return value.replace(new RegExp(searchText, 'g'), replaceText);
  }

  private extractStringArg(arg: string): string {
    // Handle quoted strings
    const match = arg.match(/^"(.*)"$/);
    return match ? match[1] : arg;
  }
}
