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
  const [selectedCells, setSelectedCells] = useState<{ [key: string]: boolean } | null>(null); //Added for multi-cell selection
  const [highlightText, setHighlightText] = useState<string>("");
  const [isFormulaSelectionMode, setIsFormulaSelectionMode] = useState(false);
  const [pendingFormulaRange, setPendingFormulaRange] = useState<string | null>(null);
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
    if (!selectedCell && !selectedCells) return;

    const newData = { ...sheetData };
    const cellsToUpdate = selectedCells ? Object.keys(selectedCells).filter(key => selectedCells[key]) : [selectedCell!]; //Handle single and multi-select

    cellsToUpdate.forEach(cellId => {
      const cell = newData.cells[cellId] || { value: null, format: {} };
      cell.format = { ...cell.format, ...format };
      newData.cells[cellId] = cell;
    });

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

  const [sheetData, setSheetData] = useState<SheetData>(INITIAL_SHEET);

  const setCellValue = (cellId: string, newValue: string) => {
    const newData = { ...sheetData };
    newData.cells[cellId] = { value: newValue }; //Simplified cell update
    setSheetData(newData);
    updateSheet.mutate(newData);
  };

  const handleNewFile = () => {
    console.log("New file action - clearing sheet data");
    setSheetData({...INITIAL_SHEET, cells: {}}); //Added cells:{} to clear existing data
    toast({
      title: "New File",
      description: "Created a new empty spreadsheet"
    });
  };

  // Handle loading a file or directly loading parsed sheet data
  const handleLoadFile = (fileOrData: File | SheetData) => {
    // If we receive a SheetData object directly
    if (typeof fileOrData === 'object' && 'cells' in fileOrData) {
      console.log("Received parsed sheet data:", fileOrData);
      setSheetData(fileOrData);
      toast({
        title: "File Loaded",
        description: `Successfully imported data with ${Object.keys(fileOrData.cells).length} cells`
      });
      return;
    }

    // If we receive a File object
    const file = fileOrData as File;
    if (!file || !(file instanceof File)) {
      console.log("No valid file provided to handleLoadFile");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          const csvData = e.target.result as string;
          // Parse the CSV data
          const parsedData = parseCSV(csvData); 
          if(parsedData){
            console.log("Loaded CSV data:", parsedData);
            const newData = {...INITIAL_SHEET, cells: parsedData}
            setSheetData(newData);
            toast({
              title: "File Loaded",
              description: `Successfully imported data with ${Object.keys(parsedData).length} cells`
            });
          } else {
            console.error("Failed to parse CSV data");
            toast({
              title: "Import Failed",
              description: "Could not parse the CSV data",
              variant: "destructive"
            });
          }
        } else {
          console.error("Failed to read file data");
        }
      };

      reader.onerror = () => {
        console.error("Error reading file in handleLoadFile");
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error in handleLoadFile:", error);
    }
  };


  const parseCSV = (csvData: string): {[key: string]: CellData} | null => {
    try {
      const lines = csvData.split('\n').filter(line => line.trim());
      const cells: {[key: string]: CellData} = {};

      if (lines.length === 0) return null;

      lines.forEach((line, rowIndex) => {
        // Parse CSV properly handling quoted values
        const getCellValues = (line: string): string[] => {
          const values: string[] = [];
          let inQuotes = false;
          let currentValue = "";

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                // Handle escaped quotes
                currentValue += '"';
                i++;
              } else {
                // Toggle quote mode
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              // End of value
              values.push(currentValue);
              currentValue = "";
            } else {
              currentValue += char;
            }
          }

          // Add the last value
          values.push(currentValue);
          return values;
        };

        const rowValues = getCellValues(line);

        rowValues.forEach((value, colIndex) => {
          // Remove surrounding quotes if any
          value = value.replace(/^"(.*)"$/, '$1');

          if (value.trim()) {
            // Use correct cell reference format (A1 instead of A:1)
            const cellId = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
            cells[cellId] = { value };
          }
        });
      });

      console.log("Parsed CSV data:", cells);
      return cells;
    } catch (error) {
      console.error("Error parsing CSV:", error);
      return null;
    }
  };

  const handleSaveFile = () => {
    // Placeholder for saving to CSV. This requires converting the sheetData to CSV format
    const csvContent = "data:text/csv;charset=utf-8," +  // Placeholder CSV data - replace with actual CSV generation
      Object.entries(sheetData.cells).map(([key, val]) => `${key},${val.value}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "spreadsheet.csv");
    document.body.appendChild(link);
    link.click();
  };



  return (
    <DragProvider>
      <div className="h-screen flex flex-col">
        <Toolbar
          onFormatChange={handleFormatChange}
          onFindReplace={handleFindReplace}
          onFind={handleFind}
          sheetData={sheetData}
          onRemoveDuplicates={handleRemoveDuplicates}
          setIsFormulaSelectionMode={setIsFormulaSelectionMode}
          pendingFormulaRange={pendingFormulaRange}
          setPendingFormulaRange={setPendingFormulaRange}
          onCellChange={handleCellChange}
          onNewFile={handleNewFile}
          onSaveFile={handleSaveFile}
          onLoadFile={handleLoadFile}
        />
        <FormulaBar
          value={selectedCell ? (sheetData.cells[selectedCell]?.formula || sheetData.cells[selectedCell]?.value?.toString() || "") : ""}
          onChange={(value) => selectedCell && handleCellChange(selectedCell, value)}
          isFormulaSelectionMode={isFormulaSelectionMode}
          pendingFormulaRange={pendingFormulaRange}
          setPendingFormulaRange={setPendingFormulaRange}
        />
        <div className="flex-1 overflow-auto">
          <Grid
            data={sheetData}
            highlightText={highlightText}
            onCellSelect={setSelectedCell}
            onCellSelectMultiple={setSelectedCells} //Added prop for multi-select
            onCellChange={handleCellChange}
            onApplyFormula={handleApplyFormula}
            isFormulaSelectionMode={isFormulaSelectionMode}
            pendingFormulaRange={pendingFormulaRange}
            setPendingFormulaRange={setPendingFormulaRange}
          />
        </div>
      </div>
    </DragProvider>
  );
}