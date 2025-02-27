import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bold, Italic, Type, Search, Calculator } from "lucide-react";
import { FindReplaceDialog } from "./FindReplaceDialog";
import { SheetData } from "@shared/schema";
import { FormulaTestDialog } from "./FormulaTestDialog";

interface ToolbarProps {
  onFormatChange: (format: {
    bold?: boolean;
    italic?: boolean;
    fontSize?: number;
    color?: string;
  }) => void;
  onFindReplace?: (find: string, replace: string) => void;
  onFind?: (text: string) => void;
  sheetData: SheetData;
}

export function Toolbar({ onFormatChange, onFindReplace, onFind, sheetData }: ToolbarProps) {
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [isFormulaTestOpen, setIsFormulaTestOpen] = useState(false);

  return (
    <>
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
        <div className="border-l mx-2 h-6" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowFindReplace(true)}
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFormulaTestOpen(true)}
        >
          <Calculator className="h-4 w-4" />
        </Button>
      </div>

      <FindReplaceDialog
        isOpen={showFindReplace}
        onClose={() => setShowFindReplace(false)}
        onApply={(find, replace) => onFindReplace?.(find, replace)}
        onFind={(text) => onFind?.(text)}
      />
      <FormulaTestDialog
        isOpen={isFormulaTestOpen}
        onClose={() => setIsFormulaTestOpen(false)}
        sheetData={sheetData}
      />
    </>
  );
}