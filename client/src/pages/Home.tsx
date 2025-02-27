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
      
      // For REMOVE_DUPLICATES, we need to clear duplicate rows
      if (value.startsWith("=REMOVE_DUPLICATES") && typeof cell.value === 'string' && cell.value.includes("duplicate rows found")) {
        // Extract range from formula
        const match = value.match(/=REMOVE_DUPLICATES\((.*)\)/);
        if (match && match[1]) {
          const range = match[1].trim();
          handleRemoveDuplicates(range);
        }
      }
    }

    newData.cells[ref] = cell;
    setSheetData(newData);
    updateSheet.mutate(newData);
  };
  
  // Function to handle removing duplicate rows
  const handleRemoveDuplicates = (range: string) => {
    // Parse the range (A1:C5 format)
    const rangeMatch = range.match(/^([A-Z])(\d+):([A-Z])(\d+)$/);
    if (!rangeMatch) return;
    
    const startCol = rangeMatch[1].charCodeAt(0);
    const startRow = parseInt(rangeMatch[2]);
    const endCol = rangeMatch[3].charCodeAt(0);
    const endRow = parseInt(rangeMatch[4]);
    
    // Group cells by row
    const rowMap = new Map<number, Map<string, CellData>>();
    
    // Get all cells in the range
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellRef = `${String.fromCharCode(col)}${row}`;
        const cell = sheetData.cells[cellRef];
        
        if (cell) {
          if (!rowMap.has(row)) {
            rowMap.set(row, new Map());
          }
          rowMap.get(row)?.set(cellRef, cell);
        }
      }
    }
    
    // Identify duplicate rows
    const rows: {row: number, values: string}[] = [];
    for (const [row, cells] of rowMap.entries()) {
      // Create a string representation of the row values
      const rowValues = Array.from(cells.values())
        .map(cell => String(cell.value ?? ''))
        .join('|');
      rows.push({row, values: rowValues});
    }
    
    // Find duplicates (keeping the first occurrence)
    const seen = new Set<string>();
    const duplicateRows = new Set<number>();
    
    for (const {row, values} of rows) {
      if (seen.has(values)) {
        duplicateRows.add(row);
      } else {
        seen.add(values);
      }
    }
    
    // Clear cells in duplicate rows
    if (duplicateRows.size > 0) {
      const newData = { ...sheetData };
      
      for (const row of duplicateRows) {
        for (let col = startCol; col <= endCol; col++) {
          const cellRef = `${String.fromCharCode(col)}${row}`;
          if (newData.cells[cellRef]) {
            delete newData.cells[cellRef];
          }
        }
      }
      
      setSheetData(newData);
      updateSheet.mutate(newData);
      
      toast({
        title: "Duplicates Removed",
        description: `Removed ${duplicateRows.size} duplicate rows`,
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
          />
        </div>
      </div>
    </DragProvider>
  );
}