import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bold, Italic, Type } from "lucide-react";

interface ToolbarProps {
  onFormatChange: (format: {
    bold?: boolean;
    italic?: boolean;
    fontSize?: number;
    color?: string;
  }) => void;
}

export function Toolbar({ onFormatChange }: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onFormatChange({ bold: true })}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onFormatChange({ italic: true })}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4" />
        <Input
          type="number"
          className="w-16"
          defaultValue="11"
          onChange={(e) => onFormatChange({ fontSize: parseInt(e.target.value) })}
        />
      </div>
      <Input
        type="color"
        className="w-8 h-8 p-0"
        onChange={(e) => onFormatChange({ color: e.target.value })}
      />
    </div>
  );
}
