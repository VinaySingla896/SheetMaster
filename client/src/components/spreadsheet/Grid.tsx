import { useState } from "react";
import { Cell } from "./Cell";
import { FormulaEvaluator } from "@/lib/formulaEvaluator";
import { CellData, SheetData } from "@shared/schema";
import { useDrag } from "@/context/DragContext";

interface GridProps {
  data: SheetData;
  highlightText?: string;
  onCellSelect: (ref: string) => void;
  onCellChange: (ref: string, value: string) => void;
}

export function Grid({ data, highlightText, onCellSelect, onCellChange }: GridProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  const getCellRef = (row: number, col: number): string => {
    const colLetter = String.fromCharCode(65 + col);
    return `${colLetter}${row + 1}`;
  };

  const getEmptyCell = (): CellData => ({
    value: null,
    format: {}
  });

  const baseWidth = "w-[150px]";
  const baseHeight = "h-[25px]";
  const cellStyle = `${baseWidth} ${baseHeight} box-border`;
  const headerStyle = `border border-gray-300 bg-gray-100 p-1 text-center box-border ${baseWidth} ${baseHeight}`;

  const handleMouseUp = () => {
    if (dragState.isDragging && dragState.startCell && dragState.endCell) {
      processDragSelection(dragState.startCell, dragState.endCell, dragState.dragData);
      endDrag();
    }
  };

  const processDragSelection = (startCellRef: string, endCellRef: string, sourceData: any) => {
    // Get range of cells
    const startCol = startCellRef.charCodeAt(0) - 65;
    const startRow = parseInt(startCellRef.substring(1)) - 1;
    const endCol = endCellRef.charCodeAt(0) - 65;
    const endRow = parseInt(endCellRef.substring(1)) - 1;
    
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    
    // Detect if this is a fill operation or a copy operation
    const isFillOperation = startCellRef === dragState.startCell && 
      (maxCol - minCol > 0 || maxRow - minRow > 0);
    
    if (isFillOperation) {
      // Copy the source cell to all cells in the range
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const targetCellRef = getCellRef(row, col);
          if (targetCellRef !== startCellRef) {
            onCellChange(targetCellRef, sourceData.formula || sourceData.value?.toString() || "");
          }
        }
      }
    } else {
      // This is a move operation - we could implement this if needed
      console.log("Move operation detected");
    }
  };

  return (
    <div className="overflow-auto" onMouseUp={handleMouseUp}>
      <div className="flex">
        <div className={headerStyle} /> {/* Corner spacer */}
        {Array.from({ length: data.colCount }).map((_, col) => (
          <div key={col} className={headerStyle}>
            {String.fromCharCode(65 + col)}
          </div>
        ))}
      </div>
      {Array.from({ length: data.rowCount }).map((_, row) => (
        <div key={row} className="flex">
          <div className={headerStyle}>
            {row + 1}
          </div>
          {Array.from({ length: data.colCount }).map((_, col) => {
            const cellRef = getCellRef(row, col);
            return (
              <Cell
                key={cellRef}
                cellRef={cellRef}
                data={data.cells[cellRef] || getEmptyCell()}
                isSelected={selectedCell === cellRef}
                highlightText={highlightText}
                onSelect={() => {
                  setSelectedCell(cellRef);
                  onCellSelect(cellRef);
                }}
                onChange={(value) => onCellChange(cellRef, value)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}