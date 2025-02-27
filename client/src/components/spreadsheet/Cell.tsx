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

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      onChange(inputRef.current?.value || "");
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
        "border border-gray-200 p-1 min-w-[100px] h-[25px] overflow-hidden",
        isSelected && "border-2 border-blue-500",
        data.format?.bold && "font-bold",
        data.format?.italic && "italic"
      )}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      style={{
        color: data.format?.color,
        fontSize: data.format?.fontSize ? `${data.format.fontSize}px` : undefined
      }}
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