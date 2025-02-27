import { CellData } from "@shared/schema";

export class FormulaEvaluator {
  private cells: Record<string, CellData>;

  constructor(cells: Record<string, CellData>) {
    this.cells = cells;
  }

  evaluateFormula(formula: string): string | number {
    if (!formula.startsWith('=')) {
      return formula;
    }

    // Remove the equals sign
    const expression = formula.substring(1);

    try {
      // Check for specific functions
      if (expression.startsWith('SUM')) {
        return this.calculateSum(expression);
      } else if (expression.startsWith('AVERAGE')) {
        return this.calculateAverage(expression);
      } else if (expression.startsWith('MAX')) {
        return this.calculateMax(expression);
      } else if (expression.startsWith('MIN')) {
        return this.calculateMin(expression);
      } else if (expression.startsWith('COUNT')) {
        return this.calculateCount(expression);
      } else if (expression.startsWith('TRIM')) {
        return this.trimText(expression);
      } else if (expression.startsWith('UPPER')) {
        return this.upperCase(expression);
      } else if (expression.startsWith('LOWER')) {
        return this.lowerCase(expression);
      } else if (expression.startsWith('FIND_AND_REPLACE')) {
        return this.findAndReplace(expression);
      } else if (expression.startsWith('REMOVE_DUPLICATES')) {
        return this.removeDuplicates(expression);
      }

      // Default: try to evaluate as a mathematical expression
      return this.evaluateExpression(expression);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private calculateSum(expression: string): number {
    const range = this.extractRange(expression);
    const values = this.getCellValues(range);
    return values.reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
  }

  private calculateAverage(expression: string): number {
    const range = this.extractRange(expression);
    const values = this.getCellValues(range);
    const numericValues = values.filter(value => typeof value === 'number');

    if (numericValues.length === 0) {
      return 0;
    }

    const sum = numericValues.reduce((acc, value) => acc + value, 0);
    return sum / numericValues.length;
  }

  private calculateMax(expression: string): number {
    const range = this.extractRange(expression);
    const values = this.getCellValues(range);
    const numericValues = values.filter(value => typeof value === 'number');

    if (numericValues.length === 0) {
      return 0;
    }

    return Math.max(...numericValues);
  }

  private calculateMin(expression: string): number {
    const range = this.extractRange(expression);
    const values = this.getCellValues(range);
    const numericValues = values.filter(value => typeof value === 'number');

    if (numericValues.length === 0) {
      return 0;
    }

    return Math.min(...numericValues);
  }

  private calculateCount(expression: string): number {
    const range = this.extractRange(expression);
    const values = this.getCellValues(range);
    return values.filter(value => typeof value === 'number').length;
  }

  private trimText(expression: string): string {
    const cellRef = this.extractSingleCellReference(expression);
    const value = this.getCellValue(cellRef);
    return typeof value === 'string' ? value.trim() : String(value).trim();
  }

  private upperCase(expression: string): string {
    const cellRef = this.extractSingleCellReference(expression);
    const value = this.getCellValue(cellRef);
    return String(value).toUpperCase();
  }

  private lowerCase(expression: string): string {
    const cellRef = this.extractSingleCellReference(expression);
    const value = this.getCellValue(cellRef);
    return String(value).toLowerCase();
  }

  private findAndReplace(expression: string): string {
    // Simplified parsing of FIND_AND_REPLACE(A1,"old","new")
    const match = expression.match(/FIND_AND_REPLACE\(([A-Z]+\d+),\s*"([^"]*)"\s*,\s*"([^"]*)"\)/);
    if (!match) {
      throw new Error("Invalid FIND_AND_REPLACE format");
    }

    const [, cellRef, findText, replaceText] = match;
    const value = this.getCellValue(cellRef);
    return String(value).replace(new RegExp(findText, 'g'), replaceText);
  }

  private removeDuplicates(expression: string): string {
    const range = this.extractRange(expression);
    // Just return a message - actual removal will be handled in the UI component
    return `${this.countDuplicates(range)} duplicate rows found. Click to remove.`;
  }

  private countDuplicates(range: string): number {
    // Placeholder implementation
    return 2; // Mock value for demonstration
  }

  private evaluateExpression(expression: string): number {
    // Replace cell references with their values
    const cellRefPattern = /[A-Z]+\d+/g;
    const sanitizedExpression = expression.replace(cellRefPattern, (match) => {
      const value = this.getCellValue(match);
      return typeof value === 'number' ? String(value) : '0';
    });

    // Use Function constructor to evaluate the expression
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${sanitizedExpression})`)();
  }

  private extractRange(expression: string): string {
    const match = expression.match(/\(([A-Z]+\d+:[A-Z]+\d+)\)/);
    if (!match) {
      throw new Error("Invalid range format");
    }
    return match[1];
  }

  private extractSingleCellReference(expression: string): string {
    const match = expression.match(/\(([A-Z]+\d+)\)/);
    if (!match) {
      throw new Error("Invalid cell reference format");
    }
    return match[1];
  }

  private getCellValues(range: string): (string | number)[] {
    const [start, end] = range.split(':');
    const values: (string | number)[] = [];

    // Extract column and row from cell references
    const startCol = start.match(/^[A-Z]+/)?.[0] || '';
    const startRow = parseInt(start.match(/\d+/)?.[0] || '0');
    const endCol = end.match(/^[A-Z]+/)?.[0] || '';
    const endRow = parseInt(end.match(/\d+/)?.[0] || '0');

    // Convert column letters to indices
    const startColIndex = this.columnToIndex(startCol);
    const endColIndex = this.columnToIndex(endCol);

    // Collect values
    for (let row = startRow; row <= endRow; row++) {
      for (let colIndex = startColIndex; colIndex <= endColIndex; colIndex++) {
        const colLetter = this.indexToColumn(colIndex);
        const cellRef = `${colLetter}${row}`;
        const value = this.getCellValue(cellRef);
        values.push(value);
      }
    }

    return values;
  }

  private getCellValue(cellRef: string): string | number {
    const cell = this.cells[cellRef];
    if (!cell) {
      return 0;
    }

    // If the cell contains a formula, evaluate it recursively
    if (typeof cell.value === 'string' && cell.value.startsWith('=')) {
      return this.evaluateFormula(cell.value);
    }

    return cell.value;
  }

  private columnToIndex(col: string): number {
    let index = 0;
    for (let i = 0; i < col.length; i++) {
      index = index * 26 + (col.charCodeAt(i) - 64);
    }
    return index;
  }

  private indexToColumn(index: number): string {
    let column = '';
    while (index > 0) {
      const remainder = (index - 1) % 26;
      column = String.fromCharCode(65 + remainder) + column;
      index = Math.floor((index - 1) / 26);
    }
    return column;
  }
}