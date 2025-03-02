
// Utility functions for working with cell ranges

/**
 * Parse a cell range string like "A1:B5" and return an array of individual cell IDs
 */
export function parseCellRange(range: string): string[] {
  if (range.includes(':')) {
    return expandCellRange(range);
  } else {
    return range.split(',').map(cell => cell.trim());
  }
}

/**
 * Expand a cell range like "A1:B5" to individual cell IDs
 */
export function expandCellRange(range: string): string[] {
  const [start, end] = range.split(':').map(cell => cell.trim());
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

/**
 * Get column index from cell ID (e.g., "A" from "A1" returns 1)
 */
export function getColumnIndex(cellId: string): number {
  const colLetters = cellId.match(/[A-Z]+/)?.[0] || '';
  let colIndex = 0;

  for (let i = 0; i < colLetters.length; i++) {
    colIndex = colIndex * 26 + (colLetters.charCodeAt(i) - 64);
  }

  return colIndex;
}

/**
 * Get row index from cell ID (e.g., "1" from "A1" returns 1)
 */
export function getRowIndex(cellId: string): number {
  return parseInt(cellId.match(/\d+/)?.[0] || '1', 10);
}

/**
 * Convert column index to letter (e.g., 1 -> "A", 27 -> "AA")
 */
export function columnIndexToLetter(index: number): string {
  let letters = '';

  while (index > 0) {
    const remainder = (index - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    index = Math.floor((index - 1) / 26);
  }

  return letters;
}

/**
 * Validate that all cells in a range contain numeric values
 */
export function validateCellsContainNumbers(cells: string[], sheetData: any): string[] {
  const invalidCells: string[] = [];
  
  for (const cellId of cells) {
    const cellData = sheetData.cells[cellId];
    
    if (!cellData || 
        (typeof cellData.value !== 'number' && 
         (typeof cellData.value !== 'string' || isNaN(Number(cellData.value))))) {
      invalidCells.push(cellId);
    }
  }
  
  return invalidCells;
}
