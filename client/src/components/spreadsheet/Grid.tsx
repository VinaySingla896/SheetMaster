import { useState } from "react";
import { Cell } from "./Cell";
import { FormulaEvaluator } from "@/lib/formulaEvaluator";
import { CellData, SheetData } from "@shared/schema";

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

  const cellStyle = "w-[150px] h-[25px] box-border";
  const headerStyle = "border border-gray-300 bg-gray-100 p-1 text-center " + cellStyle;

  return (
    <div className="overflow-auto">
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