import { SheetData } from "@shared/schema";

export function parseCellRange(range: string): string[] {
  if (range.includes(':')) {
    const [start, end] = range.split(':').map(cell => cell.trim());
    return expandCellRange(start, end);
  } else {
    return range.split(',').map(cell => cell.trim());
  }
}

function expandCellRange(start: string, end: string): string[] {
  const startCol = getColumnIndex(start);
  const startRow = getRowIndex(start);
  const endCol = getColumnIndex(end);
  const endRow = getRowIndex(end);

  const cells: string[] = [];

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      cells.push(`${columnIndexToLetter(col)}${row}`);
    }
  }

  return cells;
}

function getColumnIndex(cellId: string): number {
  const colLetters = cellId.match(/[A-Z]+/)?.[0] || '';
  let colIndex = 0;

  for (let i = 0; i < colLetters.length; i++) {
    colIndex = colIndex * 26 + (colLetters.charCodeAt(i) - 64);
  }

  return colIndex;
}

function getRowIndex(cellId: string): number {
  return parseInt(cellId.match(/\d+/)?.[0] || '1', 10);
}

function columnIndexToLetter(index: number): string {
  let letters = '';

  while (index > 0) {
    const remainder = (index - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    index = Math.floor((index - 1) / 26);
  }

  return letters;
}

export function getCellValues(cells: string[], sheetData: SheetData): (number | null)[] {
  return cells.map(cellId => {
    const cellData = sheetData.cells[cellId];
    if (!cellData || cellData.value === undefined || cellData.value === null || cellData.value === '') {
      return null;
    }

    if (typeof cellData.value === 'number') {
      return cellData.value;
    }

    if (typeof cellData.value === 'string' && !isNaN(Number(cellData.value))) {
      return Number(cellData.value);
    }

    return null;
  });
}

export function validateCellsContainNumbers(cells: string[], sheetData: SheetData): string[] {
  const invalidCells: string[] = [];

  for (const cellId of cells) {
    const cellData = sheetData.cells[cellId];

    // Cell doesn't exist or has no value
    if (!cellData || cellData.value === undefined || cellData.value === null || cellData.value === '') {
      invalidCells.push(cellId);
      continue;
    }

    // Cell value is not a number
    if (
      (typeof cellData.value !== 'number') && 
      (typeof cellData.value !== 'string' || isNaN(Number(cellData.value)))
    ) {
      invalidCells.push(cellId);
    }
  }

  return invalidCells;
}