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
    // Create CSV content
    const { cells, rowCount, colCount } = sheetData;
    
    // Find the maximum row and column with data
    let maxRow = 0;
    let maxCol = 0;
    
    for (const cellId in cells) {
      const [col, row] = cellId.split(',').map(Number);
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
    }
    
    // Ensure we export at least 10 rows and columns
    maxRow = Math.max(maxRow, 10);
    maxCol = Math.max(maxCol, 10);
    
    // Generate CSV rows
    let csvContent = '';
    for (let row = 0; row <= maxRow; row++) {
      const csvRow = [];
      for (let col = 0; col <= maxCol; col++) {
        const cellId = `${col},${row}`;
        const cellValue = cells[cellId]?.value || '';
        csvRow.push(cellValue);
      }
      csvContent += csvRow.join(',') + '\n';
    }
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "spreadsheet.csv");
  };

  const handleNewFile = () => {
    if (onNewFile) {
      onNewFile();
    }
  };

  const handleLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvString = e.target?.result as string;
        const lines = csvString.split('\n').filter(line => line.trim());
        
        const newSheetData: SheetData = { 
          cells: {},
          rowCount: lines.length,
          colCount: 0
        };
        
        lines.forEach((line, rowIndex) => {
          const values = line.split(',');
          newSheetData.colCount = Math.max(newSheetData.colCount, values.length);
          
          values.forEach((value, colIndex) => {
            if (value.trim()) {
              const cellId = `${colIndex},${rowIndex}`;
              newSheetData.cells[cellId] = { value: value.trim(), format: {} };
            }
          });
        });
        
        if (onLoadFile) {
          onLoadFile(newSheetData);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleNewFile}>New File</Button>
      <Button onClick={handleSave}>Save File</Button>
      <input type="file" accept=".csv" onChange={handleLoad} style={{ display: 'none' }} id="fileInput" />
      <label htmlFor="fileInput">
        <Button as="span">Load File</Button>
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