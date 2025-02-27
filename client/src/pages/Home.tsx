import { useState, useEffect } from "react";
import { Grid } from "@/components/spreadsheet/Grid";
import { Toolbar } from "@/components/spreadsheet/Toolbar";
import { FormulaBar } from "@/components/spreadsheet/FormulaBar";
import { FormulaEvaluator } from "@/lib/formulaEvaluator";
import { SheetData, CellData } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DragProvider } from "@/context/DragContext";
import { FormulaApplyDialog } from "@/components/spreadsheet/FormulaApplyDialog";
import "@/styles/cellResizer.css";

const INITIAL_SHEET: SheetData = {
  cells: {},
  rowCount: 100,
  colCount: 26
};

export default function Home() {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [sheetData, setSheetData] = useState<SheetData>(INITIAL_SHEET);
  const [highlightText, setHighlightText] = useState<string>("");
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [isFormulaDialogOpen, setIsFormulaDialogOpen] = useState(false);
  const [isFormulaSelectMode, setIsFormulaSelectMode] = useState(false);
  const { toast } = useToast();

  const { data: sheet } = useQuery({
    queryKey: ["/api/sheets/1"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/sheets/1");
        if (!res.ok) throw new Error("Failed to load sheet");
        return await res.json();
      } catch (error) {
        return null;
      }
    }
  });

  const updateSheet = useMutation({
    mutationFn: async (data: SheetData) => {
      await apiRequest("PUT", "/api/sheets/1", data);
    }
  });

  useEffect(() => {
    if (sheet?.data) {
      setSheetData(sheet.data);
    }
  }, [sheet]);

  const handleCellChange = (ref: string, value: string) => {
    const newData = { ...sheetData };
    const cell: CellData = { value: value };

    if (value.startsWith("=")) {
      cell.formula = value;
      const evaluator = new FormulaEvaluator(newData.cells);
      cell.value = evaluator.evaluateFormula(value, [ref]);
    }

    newData.cells[ref] = cell;
    setSheetData(newData);
    updateSheet.mutate(newData);
  };

  const handleCellSelectionForFormula = (cellRef: string) => {
    if (isFormulaSelectMode) {
      // End formula selection mode
      setIsFormulaSelectMode(false);
      // Send the selected cell reference back to the FormulaApplyDialog
      // This is handled via a ref/state in the dialog
    }
  };

  const handleApplyFormula = (cells: string[], formula: string) => {
    if (cells.length === 0 || !formula) return;

    const newData = { ...sheetData };
    const evaluator = new FormulaEvaluator(newData.cells);

    // Apply formula to each cell
    cells.forEach(cellRef => {
      const cell: CellData = { value: "", formula };
      try {
        cell.value = evaluator.evaluateFormula(formula, [cellRef]);
      } catch (error) {
        cell.value = `#ERROR: ${error instanceof Error ? error.message : String(error)}`;
      }
      newData.cells[cellRef] = cell;
    });

    setSheetData(newData);

    // Save to server
    updateSheet.mutate(newData);

    toast({
      title: "Formula Applied",
      description: `Applied "${formula}" to ${cells.length} cell${cells.length > 1 ? 's' : ''}`,
    });
  };

  // Function to handle removing duplicate rows
  const handleRemoveDuplicates = (range: string) => {
    try {
      const [start, end] = range.split(':');
      if (!start || !end) return;

      // Parse range coordinates
      const startCol = start.match(/^[A-Z]+/)?.[0] || '';
      const startRow = parseInt(start.match(/\d+/)?.[0] || '0');
      const endCol = end.match(/^[A-Z]+/)?.[0] || '';
      const endRow = parseInt(end.match(/\d+/)?.[0] || '0');

      if (!startCol || !endCol || !startRow || !endRow) return;

      // Extract column names in the range
      const colToNum = (col: string) => {
        let num = 0;
        for (let i = 0; i < col.length; i++) {
          num = num * 26 + (col.charCodeAt(i) - 64);
        }
        return num;
      };

      const numToCol = (num: number) => {
        let result = '';
        while (num > 0) {
          const remainder = (num - 1) % 26;
          result = String.fromCharCode(65 + remainder) + result;
          num = Math.floor((num - 1) / 26);
        }
        return result;
      };

      const startColNum = colToNum(startCol);
      const endColNum = colToNum(endCol);

      const newData = { ...sheetData };
      const rowsContent: Map<string, number> = new Map();
      const duplicateRows: number[] = [];

      // Identify duplicate rows
      for (let row = startRow; row <= endRow; row++) {
        let rowContent = '';

        for (let colNum = startColNum; colNum <= endColNum; colNum++) {
          const col = numToCol(colNum);
          const cellKey = `${col}${row}`;
          const cellValue = newData.cells[cellKey]?.value || '';
          rowContent += `|${cellValue}|`;
        }

        if (rowsContent.has(rowContent)) {
          duplicateRows.push(row);
        } else {
          rowsContent.set(rowContent, row);
        }
      }

      // Clear duplicate rows
      if (duplicateRows.length > 0) {
        for (const row of duplicateRows) {
          for (let colNum = startColNum; colNum <= endColNum; colNum++) {
            const col = numToCol(colNum);
            const cellKey = `${col}${row}`;
            if (newData.cells[cellKey]) {
              newData.cells[cellKey].value = '';
            }
          }
        }

        setSheetData(newData);

        toast({
          title: "Duplicates Removed",
          description: `Removed ${duplicateRows.length} duplicate rows`,
        });
      } else {
        toast({
          title: "No Duplicates Found",
          description: "No duplicate rows were found in the specified range",
        });
      }
    } catch (error) {
      console.error("Error removing duplicates:", error);
      toast({
        title: "Error",
        description: "Failed to remove duplicates",
        variant: "destructive"
      });
    }
  };

  const handleFormatChange = (format: Partial<CellData["format"]>) => {
    if (!selectedCell) return;

    const newData = { ...sheetData };
    const cell = newData.cells[selectedCell] || { value: null, format: {} };
    cell.format = { ...cell.format, ...format };
    newData.cells[selectedCell] = cell;

    setSheetData(newData);
    updateSheet.mutate(newData);
  };

  const handleFindReplace = (find: string, replace: string) => {
    if (!find.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter text to search for",
        variant: "destructive"
      });
      return;
    }

    const newData = { ...sheetData };
    let replacedCount = 0;

    // Replace across all cells
    Object.entries(newData.cells).forEach(([cellKey, cellData]) => {
      if (cellData?.value) {
        const currentValue = String(cellData.value);
        if (currentValue.match(new RegExp(find, 'gi'))) {
          const newValue = currentValue.replace(new RegExp(find, 'gi'), replace);
          newData.cells[cellKey] = {
            ...cellData,
            value: newValue
          };
          replacedCount++;
        }
      }
    });

    if (replacedCount === 0) {
      toast({
        title: "No matches found",
        description: `Could not find "${find}" in any cell`,
        variant: "destructive"
      });
      return;
    }

    setSheetData(newData);
    updateSheet.mutate(newData);
    setHighlightText(replace);

    toast({
      title: "Text replaced",
      description: `Replaced ${replacedCount} occurrence(s) of "${find}" with "${replace}"`,
    });

    // Clear highlight after a short delay
    setTimeout(() => setHighlightText(""), 2000);
  };

  const handleFind = (text: string) => {
    if (!text.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter text to search for",
        variant: "destructive"
      });
      return;
    }

    // Search across all cells
    let found = false;
    const cellEntries = Object.entries(sheetData.cells);

    for (const [cellKey, cellData] of cellEntries) {
      if (cellData?.value && String(cellData.value).match(new RegExp(text, 'gi'))) {
        found = true;
        // Select the first cell with matching content
        setSelectedCell(cellKey);
        break;
      }
    }

    if (!found) {
      toast({
        title: "No matches found",
        description: `Could not find "${text}" in any cell`,
        variant: "destructive"
      });
      return;
    }

    setHighlightText(text);
    toast({
      title: "Text found",
      description: `Found matches for "${text}"`,
    });

    // Clear highlight after 5 seconds
    setTimeout(() => setHighlightText(""), 5000);
  };

  return (
    <DragProvider>
      <div className="h-screen flex flex-col">
        <Toolbar 
          onFormatChange={handleFormatChange}
          onFindReplace={handleFindReplace}
          onFind={handleFind}
          sheetData={sheetData}
          selectedCells={selectedCells}
          onOpenFormulaDialog={() => setIsFormulaDialogOpen(true)}
        />
        <FormulaBar
          value={selectedCell ? (sheetData.cells[selectedCell]?.formula || sheetData.cells[selectedCell]?.value?.toString() || "") : ""}
          onChange={(value) => selectedCell && handleCellChange(selectedCell, value)}
        />
        <div className="flex-1 overflow-auto">
          <Grid
            data={sheetData}
            highlightText={highlightText}
            onCellSelect={setSelectedCell}
            onCellChange={handleCellChange}
            onApplyFormula={handleApplyFormula}
            isFormulaSelectMode={isFormulaSelectMode}
            onFormulaSelectCell={handleCellSelectionForFormula}
          />
        </div>
        
        <FormulaApplyDialog
          isOpen={isFormulaDialogOpen}
          onClose={() => setIsFormulaDialogOpen(false)}
          selectedCells={selectedCells.length > 0 ? selectedCells : selectedCell ? [selectedCell] : []}
          onApplyFormula={handleApplyFormula}
          sheetData={sheetData}
        />
      </div>
    </DragProvider>
  );
}