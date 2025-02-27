import { useState, useRef } from "react";
import { CellData } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useDrag } from "@/context/DragContext";

interface CellProps {
  data: CellData;
  isSelected: boolean;
  cellRef: string;
  highlightText?: string;
  onSelect: () => void;
  onChange: (value: string) => void;
}

export function Cell({ data, isSelected, cellRef, highlightText, onSelect, onChange }: CellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.formula || data.value?.toString() || "");
  const { dragState, startDrag, updateDrag, endDrag } = useDrag();
  const cellElement = useRef<HTMLDivElement>(null);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(data.formula || data.value?.toString() || "");
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      onChange(editValue);
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(data.formula || data.value?.toString() || "");
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) {
      onSelect();
      startDrag(cellRef, {
        value: data.value,
        formula: data.formula,
        format: data.format
      });

      // Prevent text selection during drag
      e.preventDefault();
    }
  };

  const handleMouseEnter = () => {
    if (dragState.isDragging) {
      updateDrag(cellRef);
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      endDrag();
    }
  };

  let displayValue = data.value?.toString() || "";

  // Highlight matching text if provided
  if (highlightText && displayValue.toLowerCase().includes(highlightText.toLowerCase())) {
    const regex = new RegExp(`(${highlightText})`, 'gi');
    const parts = displayValue.split(regex);
    displayValue = parts.map((part, i) => 
      part.toLowerCase() === highlightText.toLowerCase() 
        ? <mark key={i}>{part}</mark> 
        : part
    ).reduce((prev, curr) => [prev, curr]);
  }

  // Check if this cell is part of the current selection range
  const isInDragSelection = dragState.isDragging && cellRef && dragState.startCell && dragState.endCell
    ? isCellInRange(cellRef, dragState.startCell, dragState.endCell)
    : false;

  return (
    <div
      ref={cellElement}
      className={cn(
        "border border-gray-300 p-1 overflow-hidden select-none auto-resize-cell", // Added auto-resize-cell class
        isSelected && "bg-blue-100 outline outline-2 outline-blue-500 z-10",
        isInDragSelection && !isSelected && "bg-blue-50",
        data.format?.bold && "font-bold",
        data.format?.italic && "italic"
      )}
      style={{ 
        boxSizing: 'border-box', 
        width: '100%', 
        height: '25px',
        color: data.format?.color, 
        fontSize: data.format?.fontSize ? `${data.format.fontSize}px` : undefined,
        position: 'relative'
      }}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
    >
      {isEditing ? (
        <input
          autoFocus
          className="w-full h-full border-none outline-none p-0 bg-transparent"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <div className="w-full h-full truncate">{displayValue}</div>
      )}
      {isInDragSelection && dragState.startCell === cellRef && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white z-20" 
          style={{ cursor: 'crosshair' }}></div>
      )}
    </div>
  );
}

// Helper function to determine if a cell is in the selection range
function isCellInRange(cellRef: string, startCell: string, endCell: string): boolean {
  const startCol = startCell.charCodeAt(0);
  const startRow = parseInt(startCell.substring(1));
  const endCol = endCell.charCodeAt(0);
  const endRow = parseInt(endCell.substring(1));

  const cellCol = cellRef.charCodeAt(0);
  const cellRow = parseInt(cellRef.substring(1));

  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);

  return cellCol >= minCol && cellCol <= maxCol && cellRow >= minRow && cellRow <= maxRow;
}