import { useState, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CellData } from "@shared/schema";

interface CellProps {
  data: CellData;
  isSelected: boolean;
  highlightText?: string;
  onSelect: () => void;
  onChange: (value: string) => void;
}

export function Cell({ data, isSelected, highlightText, onSelect, onChange }: CellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = () => {
    setIsEditing(true);
    inputRef.current?.focus();
  };

  const saveChanges = () => {
    setIsEditing(false);
    onChange(inputRef.current?.value || "");
  };

  const handleBlur = () => {
    saveChanges();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveChanges();
    }
  };

  const displayContent = useMemo(() => {
    if (!highlightText || !data.value) return <span>{data.value?.toString()}</span>;

    const text = data.value.toString();
    const parts = text.split(new RegExp(`(${highlightText})`, 'gi'));

    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlightText?.toLowerCase() ?
            <span key={i} className="bg-yellow-200">{part}</span> :
            part
        )}
      </span>
    );
  }, [data.value, highlightText]);

  return (
    <div
      className={cn(
        "border border-gray-200 p-1 w-[100px] h-[25px] box-border overflow-hidden",
        isSelected && "border-2 border-blue-500",
        data.format?.bold && "font-bold",
        data.format?.italic && "italic"
      )}
      style={{ 
        boxSizing: 'border-box', 
        width: '150px',
        height: '25px',
        color: data.format?.color, 
        fontSize: data.format?.fontSize ? `${data.format.fontSize}px` : undefined 
      }}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="w-full h-full outline-none"
          defaultValue={data.formula || data.value?.toString()}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      ) : (
        displayContent
      )}
    </div>
  );
}