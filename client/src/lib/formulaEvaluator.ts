
import { CellData } from "@shared/schema";

export class FormulaEvaluator {
  private cells: Record<string, CellData>;
  private processingCells: string[] = [];

  constructor(cells: Record<string, CellData>) {
    this.cells = cells;
  }

  evaluateFormula(formula: string, cellsToAvoidCycles: string[] = []): string | number {
    // Remove the leading equals sign
    const withoutEquals = formula.substring(1).trim();
    this.processingCells = [...cellsToAvoidCycles];

    // Check if it's a SUM formula
    if (withoutEquals.startsWith("SUM(") && withoutEquals.endsWith(")")) {
      const range = withoutEquals.substring(4, withoutEquals.length - 1);
      return this.sumRange(range);
    } 
    
    // Check if it's an AVERAGE formula
    else if (withoutEquals.startsWith("AVERAGE(") && withoutEquals.endsWith(")")) {
      const range = withoutEquals.substring(8, withoutEquals.length - 1);
      return this.averageRange(range);
    } 
    
    // Check if it's a MAX formula
    else if (withoutEquals.startsWith("MAX(") && withoutEquals.endsWith(")")) {
      const range = withoutEquals.substring(4, withoutEquals.length - 1);
      return this.maxRange(range);
    } 
    
    // Check if it's a MIN formula
    else if (withoutEquals.startsWith("MIN(") && withoutEquals.endsWith(")")) {
      const range = withoutEquals.substring(4, withoutEquals.length - 1);
      return this.minRange(range);
    } 
    
    // Check if it's a COUNT formula
    else if (withoutEquals.startsWith("COUNT(") && withoutEquals.endsWith(")")) {
      const range = withoutEquals.substring(6, withoutEquals.length - 1);
      return this.countRange(range);
    } 
    
    // Data Quality Functions
    // Check if it's a TRIM formula
    else if (withoutEquals.startsWith("TRIM(") && withoutEquals.endsWith(")")) {
      const cellRef = withoutEquals.substring(5, withoutEquals.length - 1);
      return this.trimCell(cellRef);
    } 
    
    // Check if it's an UPPER formula
    else if (withoutEquals.startsWith("UPPER(") && withoutEquals.endsWith(")")) {
      const cellRef = withoutEquals.substring(6, withoutEquals.length - 1);
      return this.upperCell(cellRef);
    } 
    
    // Check if it's a LOWER formula
    else if (withoutEquals.startsWith("LOWER(") && withoutEquals.endsWith(")")) {
      const cellRef = withoutEquals.substring(6, withoutEquals.length - 1);
      return this.lowerCell(cellRef);
    } 
    
    // Check if it's a FIND_AND_REPLACE formula
    else if (withoutEquals.startsWith("FIND_AND_REPLACE(") && withoutEquals.endsWith(")")) {
      const params = this.parseParams(withoutEquals.substring(16, withoutEquals.length - 1));
      if (params.length === 3) {
        return this.findAndReplace(params[0], params[1], params[2]);
      }
      return "Error: FIND_AND_REPLACE requires 3 parameters";
    }
    
    // Check if it's a REMOVE_DUPLICATES formula
    else if (withoutEquals.startsWith("REMOVE_DUPLICATES(") && withoutEquals.endsWith(")")) {
      const range = withoutEquals.substring(17, withoutEquals.length - 1);
      return this.removeDuplicates(range);
    }
    
    // If it's a cell reference, return the value of that cell
    else if (/^[A-Z]+\d+$/.test(withoutEquals)) {
      return this.getCellValue(withoutEquals);
    }
    
    // Otherwise, try to evaluate as a mathematical expression
    else {
      try {
        // Replace cell references with their values
        const withReplacedRefs = withoutEquals.replace(/[A-Z]+\d+/g, (match) => {
          const value = this.getCellValue(match);
          if (typeof value === 'number') {
            return value.toString();
          } else if (typeof value === 'string' && !isNaN(Number(value))) {
            return value;
          }
          return '0';
        });
        
        // Use Function constructor to safely evaluate the expression
        return new Function(`return ${withReplacedRefs}`)();
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  }

  private parseParams(paramsStr: string): string[] {
    const params: string[] = [];
    let currentParam = '';
    let insideQuotes = false;
    
    for (let i = 0; i < paramsStr.length; i++) {
      const char = paramsStr[i];
      
      if (char === '"' && (i === 0 || paramsStr[i-1] !== '\\')) {
        insideQuotes = !insideQuotes;
        currentParam += char;
      } else if (char === ',' && !insideQuotes) {
        params.push(currentParam.trim());
        currentParam = '';
      } else {
        currentParam += char;
      }
    }
    
    if (currentParam) {
      params.push(currentParam.trim());
    }
    
    return params.map(param => {
      // If param is a cell reference, get its value
      if (/^[A-Z]+\d+$/.test(param)) {
        const value = this.getCellValue(param);
        return value.toString();
      }
      // If param is in quotes, remove the quotes
      if (param.startsWith('"') && param.endsWith('"')) {
        return param.substring(1, param.length - 1);
      }
      return param;
    });
  }

  private getCellValue(cellRef: string): string | number {
    // Check for circular references
    if (this.processingCells.includes(cellRef)) {
      return "#CIRCULAR_REF!";
    }
    
    const cell = this.cells[cellRef];
    if (!cell) return "";
    
    if (cell.formula) {
      // Add this cell to the list of cells being processed
      this.processingCells.push(cellRef);
      const result = this.evaluateFormula(cell.formula, this.processingCells);
      // Remove this cell from the list when done
      this.processingCells.pop();
      return result;
    }
    
    if (cell.value === undefined || cell.value === null) return "";
    
    // If the value is a number string, convert it to a number
    if (typeof cell.value === 'string' && !isNaN(Number(cell.value))) {
      return Number(cell.value);
    }
    
    return cell.value.toString();
  }

  private parseRange(range: string): string[] {
    // If range is just a single cell, return it
    if (/^[A-Z]+\d+$/.test(range)) {
      return [range];
    }
    
    // If range is a comma-separated list of cells
    if (range.includes(',')) {
      return range.split(',').map(cell => cell.trim());
    }
    
    // Otherwise, assume it's a range like A1:C5
    const [start, end] = range.split(':').map(ref => ref.trim());
    if (!start || !end) return [];
    
    const startCol = this.getColumnIndex(start.match(/[A-Z]+/)![0]);
    const startRow = parseInt(start.match(/\d+/)![0], 10);
    const endCol = this.getColumnIndex(end.match(/[A-Z]+/)![0]);
    const endRow = parseInt(end.match(/\d+/)![0], 10);
    
    const cells: string[] = [];
    for (let col = startCol; col <= endCol; col++) {
      for (let row = startRow; row <= endRow; row++) {
        cells.push(`${this.getColumnLetter(col)}${row}`);
      }
    }
    
    return cells;
  }

  private getColumnIndex(col: string): number {
    return col.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0);
  }

  private getColumnLetter(index: number): string {
    let letter = '';
    while (index > 0) {
      const remainder = (index - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      index = Math.floor((index - 1) / 26);
    }
    return letter;
  }

  // Mathematical Functions
  private sumRange(range: string): number {
    const cells = this.parseRange(range);
    return cells.reduce((sum, cell) => {
      const value = this.getCellValue(cell);
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  private averageRange(range: string): number {
    const cells = this.parseRange(range);
    const sum = this.sumRange(range);
    const count = cells.filter(cell => {
      const value = this.getCellValue(cell);
      return typeof value === 'number';
    }).length;
    
    return count > 0 ? sum / count : 0;
  }

  private maxRange(range: string): number {
    const cells = this.parseRange(range);
    let max = Number.NEGATIVE_INFINITY;
    
    for (const cell of cells) {
      const value = this.getCellValue(cell);
      if (typeof value === 'number' && value > max) {
        max = value;
      }
    }
    
    return max === Number.NEGATIVE_INFINITY ? 0 : max;
  }

  private minRange(range: string): number {
    const cells = this.parseRange(range);
    let min = Number.POSITIVE_INFINITY;
    
    for (const cell of cells) {
      const value = this.getCellValue(cell);
      if (typeof value === 'number' && value < min) {
        min = value;
      }
    }
    
    return min === Number.POSITIVE_INFINITY ? 0 : min;
  }

  private countRange(range: string): number {
    const cells = this.parseRange(range);
    return cells.filter(cell => {
      const value = this.getCellValue(cell);
      return typeof value === 'number';
    }).length;
  }

  // Data Quality Functions
  private trimCell(cellRef: string): string {
    const value = this.getCellValue(cellRef);
    return typeof value === 'string' ? value.trim() : value.toString();
  }

  private upperCell(cellRef: string): string {
    const value = this.getCellValue(cellRef);
    return typeof value === 'string' ? value.toUpperCase() : value.toString().toUpperCase();
  }

  private lowerCell(cellRef: string): string {
    const value = this.getCellValue(cellRef);
    return typeof value === 'string' ? value.toLowerCase() : value.toString().toLowerCase();
  }

  private findAndReplace(cellRef: string, find: string, replace: string): string {
    const value = this.getCellValue(cellRef);
    if (typeof value !== 'string') return value.toString();
    
    return value.replace(new RegExp(find, 'g'), replace);
  }

  private removeDuplicates(range: string): string {
    // The actual removal will be handled in Home.tsx
    // Here we just identify if there are duplicates
    const cells = this.parseRange(range);
    
    // Get the unique rows in the range
    const rows = new Set<number>();
    cells.forEach(cell => {
      const row = parseInt(cell.match(/\d+/)![0], 10);
      rows.add(row);
    });
    
    return `${rows.size} rows analyzed for duplicates`;
  }
}
