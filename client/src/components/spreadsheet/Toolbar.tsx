import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bold, Italic, Type, Search, Calculator, FunctionSquare } from "lucide-react";
import { FindReplaceDialog } from "./FindReplaceDialog";
import { SheetData } from "@shared/schema";
import { FormulaTestDialog } from "./FormulaTestDialog";
import { saveAs } from 'file-saver';


interface ToolbarProps {
  onFind: (text: string) => void;
  onBoldClick?: () => void;
  onItalicClick?: () => void;
  onFormulaTest?: (formula: string, range: string) => void;
  onCellFormatChange?: (format: string) => void;
  sheetData: SheetData;
  parseCellRange?: (range: string) => string[];
  validateCellsContainNumbers?: (cells: string[], sheetData: SheetData) => string[];
  handleRemoveDuplicates?: (range: string) => void;
  onNewFile?: () => void;
  onLoadFile?: (data: SheetData) => void;
  onCellChange?: (cellId: string, newValue: string) => void;
}

function FileMenu({ onNewFile, onLoadFile, sheetData }: { onNewFile: () => void; onLoadFile: (data: SheetData) => void; sheetData: SheetData }) {
  const handleSave = () => {
    const csvData = Object.values(sheetData.cells).map(cell => cell.value).join(',');
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "spreadsheet.csv");
  };

  const handleLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvString = e.target?.result as string;
        const lines = csvString.split('\n');
        const newSheetData: SheetData = { cells: {} };
        lines.forEach((line, rowIndex) => {
          const values = line.split(',');
          values.forEach((value, colIndex) => {
            const cellId = `${rowIndex},${colIndex}`;
            newSheetData.cells[cellId] = { value, format: {} }; //Simple format
          })
        })
        onLoadFile(newSheetData);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={onNewFile}>New File</Button>
      <Button onClick={handleSave}>Save File</Button>
      <input type="file" accept=".csv" onChange={handleLoad} style={{ display: 'none' }} id="fileInput" />
      <label htmlFor="fileInput">
        <Button>Load File</Button>
      </label>
    </div>
  );
}


export function Toolbar({ 
  onFind, 
  onBoldClick, 
  onItalicClick, 
  onFormulaTest, 
  onCellFormatChange,
  sheetData,
  parseCellRange,
  validateCellsContainNumbers,
  handleRemoveDuplicates,
  onNewFile,
  onLoadFile,
  onCellChange
}: ToolbarProps) {
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [isFormulaTestOpen, setIsFormulaTestOpen] = useState(false);
  const [isFormulaApplyOpen, setIsFormulaApplyOpen] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [selectedFormulaRange, setSelectedFormulaRange] = useState("");

  useEffect(() => {
    const handleSelectionChange = (e: CustomEvent) => {
      setSelectedCells(e.detail.selectedCells || []);
    };

    const handleFormulaRangeSelected = (e: CustomEvent) => {
      setSelectedFormulaRange(e.detail.range);
      setIsFormulaTestOpen(true);
    };

    document.addEventListener('cell-selection-changed', handleSelectionChange as EventListener);
    document.addEventListener('formula-range-selected', handleFormulaRangeSelected as EventListener);

    return () => {
      document.removeEventListener('cell-selection-changed', handleSelectionChange as EventListener);
      document.removeEventListener('formula-range-selected', handleFormulaRangeSelected as EventListener);
    };
  }, []);

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
          defaultValue="#000000"
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

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsFormulaApplyOpen(true)}
          disabled={selectedCells.length === 0}
          title={selectedCells.length === 0 ? "Select cells first" : "Apply formula to selected cells"}
        >
          <FunctionSquare className="h-4 w-4" />
        </Button>
        {onNewFile && onLoadFile && (
          <FileMenu 
            onNewFile={onNewFile} 
            onLoadFile={onLoadFile} 
            sheetData={sheetData} 
          />
        )}
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
        initialCellRange={selectedFormulaRange}
        onCellChange={onCellChange}
      />
    </>
  );
}