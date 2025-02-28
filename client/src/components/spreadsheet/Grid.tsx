import { useState, useEffect } from "react";
import { Cell } from "./Cell";
import { FormulaEvaluator } from "@/lib/formulaEvaluator";
import { CellData, SheetData } from "@shared/schema";
import { useDrag } from "@/context/DragContext";
import { useToast } from "@/context/ToastContext";

interface GridProps {
  data: SheetData;
  onCellSelect?: (cellId: string) => void;
  onCellChange?: (cellId: string, value: string) => void;
  onApplyFormula?: (cellIds: string[], formula: string) => void;
  isFormulaSelectionMode?: boolean;
  onFormulaRangeSelected?: (range: string) => void;
  highlightText?: string;
  onMultiSelect?: (cells: string[]) => void;
}

export function Grid({ 
  data, 
  onCellSelect, 
  onCellChange, 
  onApplyFormula, 
  isFormulaSelectionMode = false,
  onFormulaRangeSelected,
  highlightText,
  onMultiSelect
}: GridProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [formulaSelectionStart, setFormulaSelectionStart] = useState<string | null>(null);
  const { dragState, endDrag } = useDrag();
  const { toast } = useToast();

  // Notify parent component of selected cells
  useEffect(() => {
    if (onMultiSelect) {
      onMultiSelect(selectedCells);
    }
  }, [selectedCells, onMultiSelect]);

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

  const handleCellClick = (ref: string, event?: React.MouseEvent) => {
    // Handle formula selection
    if (isFormulaSelectionMode) {
      if (!formulaSelectionStart) {
        setFormulaSelectionStart(ref);
        toast({
          title: "Starting cell selected",
          description: "Now select an ending cell or click the same cell to select just one cell",
        });
      } else {
        // Create a range like A1:B2 or just A1 if same cell
        const range = formulaSelectionStart === ref ? ref : `${formulaSelectionStart}:${ref}`;
        onFormulaRangeSelected?.(range);
        setFormulaSelectionStart(null);
        toast({
          title: "Cell range selected",
          description: `Range ${range} has been selected`,
        });
      }
      return;
    }

    // Handle multi-selection with Ctrl key
    if (event && (event.ctrlKey || event.metaKey)) {
      setIsMultiSelecting(true);
      setSelectedCells(prev => {
        // Toggle cell selection
        if (prev.includes(ref)) {
          return prev.filter(cell => cell !== ref);
        } else {
          return [...prev, ref];
        }
      });
    } else if (event && event.shiftKey && selectedCell) {
      // Range selection with Shift key
      setIsMultiSelecting(true);
      const [selCol, selRow] = parseCellRef(selectedCell);
      const [targetCol, targetRow] = parseCellRef(ref);

      const startCol = Math.min(selCol, targetCol);
      const endCol = Math.max(selCol, targetCol);
      const startRow = Math.min(selRow, targetRow);
      const endRow = Math.max(selRow, targetRow);

      const rangeSelection: string[] = [];
      for (let col = startCol; col <= endCol; col++) {
        for (let row = startRow; row <= endRow; row++) {
          rangeSelection.push(getCellRefFromIndices(col, row));
        }
      }
      setSelectedCells(rangeSelection);
    } else {
      // Single cell selection
      setIsMultiSelecting(false);
      setSelectedCell(ref);
      setSelectedCells([ref]);
      if (onCellSelect) {
        onCellSelect(ref);
      }
    }
  };

  // Helper functions for cell references
  const parseCellRef = (ref: string): [number, number] => {
    const colStr = ref.match(/[A-Z]+/)?.[0] || "A";
    const rowStr = ref.match(/\d+/)?.[0] || "1";

    // Convert column letters to index (A=0, B=1, etc.)
    let colIndex = 0;
    for (let i = 0; i < colStr.length; i++) {
      colIndex = colIndex * 26 + colStr.charCodeAt(i) - 64;
    }

    return [colIndex, parseInt(rowStr)];
  };

  const getCellRefFromIndices = (colIndex: number, rowIndex: number): string => {
    let colStr = "";
    let tempCol = colIndex;

    while (tempCol > 0) {
      const remainder = (tempCol - 1) % 26;
      colStr = String.fromCharCode(65 + remainder) + colStr;
      tempCol = Math.floor((tempCol - 1) / 26);
    }

    if (colStr === "") colStr = "A";
    return `${colStr}${rowIndex}`;
  };

  const updateColumnWidth = (colIndex: number, width: number) => {
    setColumnWidths(prev => {
      const newWidths = [...prev];
      newWidths[colIndex] = Math.max(width, 60); // Minimum width of 60px
      return newWidths;
    });
  };

  return (
    <div className="overflow-auto" onMouseUp={handleMouseUp}>
      <div className="flex">
        <div className={headerStyle} style={{ width: '50px', minWidth: '50px' }} /> {/* Corner spacer */}
        {Array.from({ length: data.colCount }).map((_, col) => (
          <div 
            key={col} 
            className={headerStyle}
            style={{ width: `${columnWidths[col]}px`, minWidth: `${columnWidths[col]}px` }}
          >
            {String.fromCharCode(65 + col)}
          </div>
        ))}
      </div>
      {Array.from({ length: data.rowCount }).map((_, row) => (
        <div key={row} className="flex">
          <div className={headerStyle} style={{ width: '50px', minWidth: '50px' }}>
            {row + 1}
          </div>
          {Array.from({ length: data.colCount }).map((_, col) => {
            const cellRef = getCellRef(row, col);
            const cellData = data.cells[cellRef] || getEmptyCell();
            const cellValue = cellData.value;
            // Calculate content width but don't apply immediately - use column width
            const contentWidth = cellValue ? String(cellValue).length * 8 + 16 : 60;

            // Update column width if content is wider
            if (contentWidth > columnWidths[col]) {
              updateColumnWidth(col, contentWidth);
            }

            return (
              <div
                key={cellRef}
                className={`${cellStyle} border border-gray-200`}
                style={{
                  width: `${columnWidths[col]}px`, 
                  minWidth: `${columnWidths[col]}px`
                }}
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
  );
}