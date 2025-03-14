import { SheetData, CellData } from "@shared/schema";

export class FormulaEvaluator {
  private sheetData: SheetData;

  constructor(sheetData: SheetData) {
    this.sheetData = sheetData;
  }

  evaluateFormula(formula: string): string | number {
    if (!formula.startsWith("=")) {
      return formula;
    }

    const formulaContent = formula.substring(1);

    // SUM function
    if (formulaContent.startsWith("SUM(") && formulaContent.endsWith(")")) {
      const range = formulaContent.substring(4, formulaContent.length - 1);
      return this.evaluateSum(range);
    }

    // AVERAGE function
    if (formulaContent.startsWith("AVERAGE(") && formulaContent.endsWith(")")) {
      const range = formulaContent.substring(8, formulaContent.length - 1);
      return this.evaluateAverage(range);
    }

    // MAX function
    if (formulaContent.startsWith("MAX(") && formulaContent.endsWith(")")) {
      const range = formulaContent.substring(4, formulaContent.length - 1);
      return this.evaluateMax(range);
    }

    // MIN function
    if (formulaContent.startsWith("MIN(") && formulaContent.endsWith(")")) {
      const range = formulaContent.substring(4, formulaContent.length - 1);
      return this.evaluateMin(range);
    }

    // COUNT function
    if (formulaContent.startsWith("COUNT(") && formulaContent.endsWith(")")) {
      const range = formulaContent.substring(6, formulaContent.length - 1);
      return this.evaluateCount(range);
    }

    // TRIM function
    if (formulaContent.startsWith("TRIM(") && formulaContent.endsWith(")")) {
      const range = formulaContent.substring(5, formulaContent.length - 1);
      return this.evaluateTrim(range);
    }

    // CLEAN function
    if (formulaContent.startsWith("CLEAN(") && formulaContent.endsWith(")")) {
      const range = formulaContent.substring(6, formulaContent.length - 1);
      return this.evaluateClean(range);
    }

    // UPPER function
    if (formulaContent.startsWith("UPPER(") && formulaContent.endsWith(")")) {
      const range = formulaContent.substring(6, formulaContent.length - 1);
      return this.evaluateUpper(range);
    }

    // LOWER function
    if (formulaContent.startsWith("LOWER(") && formulaContent.endsWith(")")) {
      const range = formulaContent.substring(6, formulaContent.length - 1);
      return this.evaluateLower(range);
    }

    // REMOVE_DUPLICATES function
    if (formulaContent.startsWith("REMOVE_DUPLICATES(") && formulaContent.endsWith(")")) {
      const range = formulaContent.substring(17, formulaContent.length - 1);
      return this.evaluateRemoveDuplicates(range);
    }

    return formula;
  }

  private evaluateSum(range: string): number {
    const cells = this.getCellsFromRange(range);
    let sum = 0;

    for (const cellId of cells) {
      const cellData = this.sheetData[cellId];
      if (cellData && typeof cellData.value === 'number') {
        sum += cellData.value;
      } else if (cellData && typeof cellData.value === 'string' && !isNaN(Number(cellData.value))) {
        sum += Number(cellData.value);
      }
    }

    return sum;
  }

  private evaluateAverage(range: string): number {
    const cells = this.getCellsFromRange(range);
    let sum = 0;
    let count = 0;

    for (const cellId of cells) {
      const cellData = this.sheetData[cellId];
      if (cellData && typeof cellData.value === 'number') {
        sum += cellData.value;
        count++;
      } else if (cellData && typeof cellData.value === 'string' && !isNaN(Number(cellData.value))) {
        sum += Number(cellData.value);
        count++;
      }
    }

    return count === 0 ? 0 : sum / count;
  }

  private evaluateMax(range: string): number {
    const cells = this.getCellsFromRange(range);
    let max = Number.NEGATIVE_INFINITY;
    let hasValue = false;

    for (const cellId of cells) {
      const cellData = this.sheetData[cellId];
      let value: number | undefined;

      if (cellData && typeof cellData.value === 'number') {
        value = cellData.value;
      } else if (cellData && typeof cellData.value === 'string' && !isNaN(Number(cellData.value))) {
        value = Number(cellData.value);
      }

      if (value !== undefined) {
        max = Math.max(max, value);
        hasValue = true;
      }
    }

    return hasValue ? max : 0;
  }

  private evaluateMin(range: string): number {
    const cells = this.getCellsFromRange(range);
    let min = Number.POSITIVE_INFINITY;
    let hasValue = false;

    for (const cellId of cells) {
      const cellData = this.sheetData[cellId];
      let value: number | undefined;

      if (cellData && typeof cellData.value === 'number') {
        value = cellData.value;
      } else if (cellData && typeof cellData.value === 'string' && !isNaN(Number(cellData.value))) {
        value = Number(cellData.value);
      }

      if (value !== undefined) {
        min = Math.min(min, value);
        hasValue = true;
      }
    }

    return hasValue ? min : 0;
  }

  private evaluateCount(range: string): number {
    const cells = this.getCellsFromRange(range);
    let count = 0;

    for (const cellId of cells) {
      const cellData = this.sheetData[cellId];
      if (cellData && cellData.value !== null && cellData.value !== "") {
        count++;
      }
    }

    return count;
  }

  private evaluateTrim(range: string): string {
    const cells = this.getCellsFromRange(range);
    // We'll take the first cell from the range for TRIM
    if (cells.length === 0) return "";

    const cellId = cells[0];
    const cellData = this.sheetData[cellId];

    if (!cellData || cellData.value === null || cellData.value === undefined) {
      return "";
    }

    const value = String(cellData.value);
    return value.trim(); // Remove extra spaces from start and end
  }

  private evaluateClean(range: string): string {
    const cells = this.getCellsFromRange(range);
    // We'll take the first cell from the range for CLEAN
    if (cells.length === 0) return "";

    // For CLEAN, we return an empty string as it's meant to clear the cell content
    return "";
  }

  private evaluateUpper(range: string): string {
    const cells = this.getCellsFromRange(range);
    // We'll take the first cell from the range for UPPER
    if (cells.length === 0) return "";

    const cellId = cells[0];
    const cellData = this.sheetData[cellId];

    if (!cellData || cellData.value === null || cellData.value === undefined) {
      return "";
    }

    const value = String(cellData.value);
    return value.toUpperCase(); // Convert to uppercase
  }

  private evaluateLower(range: string): string {
    const cells = this.getCellsFromRange(range);
    // We'll take the first cell from the range for LOWER
    if (cells.length === 0) return "";

    const cellId = cells[0];
    const cellData = this.sheetData[cellId];

    if (!cellData || cellData.value === null || cellData.value === undefined) {
      return "";
    }

    const value = String(cellData.value);
    return value.toLowerCase(); // Convert to lowercase
  }

  private evaluateRemoveDuplicates(range: string): string {
    // This function is different from others as it doesn't return a value to display
    // It will be handled in the FormulaTestDialog component to actually modify the cells
    // We'll return a message that describes what the function does
    return "Removes duplicate rows from the selected range";
  }

  private getCellsFromRange(range: string): string[] {
    if (range.includes(':')) {
      return this.expandCellRange(range);
    } else {
      return range.split(',').map(cell => cell.trim());
    }
  }

  private expandCellRange(range: string): string[] {
    const [start, end] = range.split(':').map(cell => cell.trim());
    const startCol = this.getColumnIndex(start);
    const startRow = this.getRowIndex(start);
    const endCol = this.getColumnIndex(end);
    const endRow = this.getRowIndex(end);

    const cells: string[] = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        cells.push(`${this.columnIndexToLetter(col)}${row}`);
      }
    }

    return cells;
  }

  private getColumnIndex(cellId: string): number {
    const colLetters = cellId.match(/[A-Z]+/)?.[0] || '';
    let colIndex = 0;

    for (let i = 0; i < colLetters.length; i++) {
      colIndex = colIndex * 26 + (colLetters.charCodeAt(i) - 64);
    }

    return colIndex;
  }

  private getRowIndex(cellId: string): number {
    return parseInt(cellId.match(/\d+/)?.[0] || '1', 10);
  }

  private columnIndexToLetter(index: number): string {
    let letters = '';

    while (index > 0) {
      const remainder = (index - 1) % 26;
      letters = String.fromCharCode(65 + remainder) + letters;
      index = Math.floor((index - 1) / 26);
    }

    return letters;
  }

  // Data quality functions
  evaluateDataQualityFunction(formula: string, args: string[]): string {
    if (formula.startsWith('TRIM')) {
      return args[0].trim();
    } else if (formula.startsWith('CLEAN')) {
      return ''; // Clean = make cell blank
    } else if (formula.startsWith('UPPER')) {
      return args[0].toUpperCase();
    } else if (formula.startsWith('LOWER')) {
      return args[0].toLowerCase();
    } else if (formula.startsWith('REMOVE_DUPLICATES')) {
      // This would typically need sheet-wide operations
      // For preview purposes just return a message
      return 'REMOVE_DUPLICATES applied';
    }
    return args[0];
  }
}