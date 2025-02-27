import { useState, useRef, useEffect } from "react";
import { Cell } from "./Cell";
import { SheetData, CellData } from "@shared/schema";
import { findCellsInRange } from "@/lib/cellUtils";
import "@/styles/cellSelection.css";

interface GridProps {
  data: SheetData;
  highlightText?: string;
  onCellSelect: (cellRef: string | null) => void;
  onCellChange: (cellRef: string, value: string) => void;
  onApplyFormula: (cellRefs: string[], formula: string) => void;
  isFormulaSelectMode?: boolean;
  onFormulaSelectCell?: (cellRef: string) => void;
}

export function Grid({ 
  data, 
  highlightText, 
  onCellSelect, 
  onCellChange, 
  onApplyFormula,
  isFormulaSelectMode = false,
  onFormulaSelectCell
}: GridProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null);
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleCellClick = (cellRef: string, e?: React.MouseEvent) => {
    // If in formula cell selection mode, handle differently
    if (isFormulaSelectMode && onFormulaSelectCell) {
      onFormulaSelectCell(cellRef);
      return;
    }

    if (e?.shiftKey && selectedCell) {
      // Handle range selection
      setSelectionEnd(cellRef);
      const cellsInRange = findCellsInRange(selectedCell, cellRef);
      setSelectedCells(cellsInRange);
    } else if (e?.ctrlKey || e?.metaKey) {
      // Handle multi-select
      setSelectedCell(cellRef);
      setSelectedCells(prev => {
        const newSelection = [...prev];
        const index = newSelection.indexOf(cellRef);
        if (index >= 0) {
          newSelection.splice(index, 1);
        } else {
          newSelection.push(cellRef);
        }
        return newSelection;
      });
    } else {
      // Single cell selection
      setSelectedCell(cellRef);
      setSelectionStart(cellRef);
      setSelectionEnd(null);
      setSelectedCells([cellRef]);
      onCellSelect(cellRef);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle key presses for cell selection (arrow keys)
  };

  const getCellRef = (row: number, col: number): string => {
    const colLetter = String.fromCharCode(65 + col);
    return `${colLetter}${row + 1}`;
  };

  const getEmptyCell = (): CellData => ({
    value: null,
    format: {}
  });

  const baseHeight = "h-[35px]";
  const cellStyle = `box-border ${baseHeight} flex items-center`;
  const headerStyle = `border border-gray-300 bg-gray-100 p-1 text-center box-border ${baseHeight} overflow-hidden`;

  // Track column widths
  const [columnWidths, setColumnWidths] = useState<number[]>(
    Array(data.colCount).fill(80) // Default width
  );

  const updateColumnWidth = (colIndex: number, width: number) => {
    setColumnWidths(prev => {
      const newWidths = [...prev];
      newWidths[colIndex] = Math.max(width, 60); // Minimum width of 60px
      return newWidths;
    });
  };

  return (
    <div 
      ref={gridRef} 
      className={`grid-container relative ${isFormulaSelectMode ? 'formula-selection-mode' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {isFormulaSelectMode && (
        <div className="fixed top-0 left-0 w-full bg-blue-500 text-white py-1 px-4 text-center z-50">
          Click on a cell to select it for your formula
        </div>
      )}
      <div className="spreadsheet-grid" style={{ gridTemplateColumns: `40px repeat(${data.colCount}, 120px)`, gridTemplateRows: `40px repeat(${data.rowCount}, 25px)` }}>
        <div className="corner-cell">/</div>
        {Array.from({ length: data.rowCount }).map((_, row) => (
          <div key={row} className="grid-row">
            <div className={`${headerStyle} row-header`} style={{ width: '40px', minWidth: '40px' }}>{row + 1}</div>
            {Array.from({ length: data.colCount }).map((_, col) => {
              const cellRef = getCellRef(row, col);
              const cellData = data.cells[cellRef] || getEmptyCell();
              const cellValue = cellData.value;
              const contentWidth = cellValue ? String(cellValue).length * 8 + 16 : 60;

              if (contentWidth > columnWidths[col]) {
                updateColumnWidth(col, contentWidth);
              }

              return (
                <div
                  key={cellRef}
                  className={`${cellStyle} cell border border-gray-200`}
                  style={{ width: `${columnWidths[col]}px`, minWidth: `${columnWidths[col]}px` }}
                  onClick={(e) => handleCellClick(cellRef, e)}
                >
                  <Cell
                    cellRef={cellRef}
                    data={cellData}
                    isSelected={selectedCell === cellRef || selectedCells.includes(cellRef)}
                    onSelect={(e) => handleCellClick(cellRef, e)}
                    onChange={(value) => onCellChange && onCellChange(cellRef, value)}
                    highlightText={highlightText}
                    format={cellData?.format}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}