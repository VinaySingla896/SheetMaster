import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SheetData } from "@shared/schema";
import { FormulaEvaluator } from "@/lib/formulaEvaluator";
import { useToast } from "@/components/ui/use-toast";

interface FormulaTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sheetData: SheetData;
  onCellChange: (cellId: string, newValue: string) => void; // Added onCellChange prop
  initialCellRange?: string;
}

export function FormulaTestDialog({
  isOpen,
  onClose,
  sheetData,
  onCellChange, // Using onCellChange prop
  initialCellRange = "",
}: FormulaTestDialogProps) {
  const [activeTab, setActiveTab] = useState("math");
  const [formula, setFormula] = useState("");
  const [result, setResult] = useState<string | number>("");
  const [cellRange, setCellRange] = useState(initialCellRange);
  const { toast } = useToast();

  // Reset formula and result when dialog opens, and set initialCellRange if provided
  useEffect(() => {
    if (isOpen) {
      setFormula("");
      setResult("");
      if (initialCellRange) {
        setCellRange(initialCellRange);
      }
    }
  }, [isOpen, initialCellRange]);

  const handleTest = () => {
    try {
      if (!cellRange) {
        toast({
          title: "No cell range specified",
          description: "Please enter a valid cell range (e.g., A1:A5 or A1,B1,C1)",
          variant: "destructive",
        });
        return;
      }

      // For mathematical functions, validate that cells contain numbers
      if (formula.match(/^\s*=\s*(SUM|AVERAGE|MAX|MIN|COUNT)/i)) {
        const cells = parseCellRange(cellRange);
        const invalidCells = validateCellsContainNumbers(cells, sheetData);

        if (invalidCells.length > 0) {
          toast({
            title: "Invalid Cells",
            description: `Cells ${invalidCells.join(', ')} do not contain valid numbers. Formula can only be applied on numbers.`,
            variant: "destructive",
          });
          return;
        }
      }

      // Create formula with the actual cell range
      let formulaWithRange = formula;
      if (formula.includes("()")) {
        formulaWithRange = formula.replace(/\(\)/, `(${cellRange})`);
      } else if (!formula.includes("(")) {
        formulaWithRange = `=${formula}(${cellRange})`;
      } else if (!formula.match(/\([^)]+\)/)) {
        formulaWithRange = formula.replace(/\(/, `(${cellRange}`);
      }

      const evaluator = new FormulaEvaluator(sheetData.cells);
      const testResult = evaluator.evaluateFormula(formulaWithRange);
      setResult(testResult);

      // For data quality functions (TRIM and CLEAN), update the cell values directly
      if (formula.match(/^\s*=\s*(TRIM|CLEAN)/i)) {
        const cells = parseCellRange(cellRange);

        // Apply the transformation to each cell
        cells.forEach((cellId) => {
          const cellData = sheetData.cells[cellId];
          if (cellData && cellData.value !== undefined && cellData.value !== null) {
            let newValue = String(cellData.value);

            if (formula.match(/^\s*=\s*TRIM/i)) {
              newValue = newValue.trim();
            } else if (formula.match(/^\s*=\s*CLEAN/i)) {
              newValue = ""; // Clear the cell content
            }

            // Update the cell with the cleaned/trimmed value
            onCellChange(cellId, newValue);
          }
        });

        // Determine which function was applied
        let functionName = "UNKNOWN";
        if (formula.match(/TRIM/i)) functionName = "TRIM";
        else if (formula.match(/CLEAN/i)) functionName = "CLEAN";
        else if (formula.match(/UPPER/i)) functionName = "UPPER";
        else if (formula.match(/LOWER/i)) functionName = "LOWER";

        toast({
          title: "Success",
          description: `Applied ${functionName} function to ${cells.length} cell(s)`,
        });
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleRemoveDuplicates = (range: string) => {
    try {
      // Parse the range
      const [start, end] = range.split(':').map(cell => cell.trim());
      if (!start || !end) {
        toast({
          title: "Invalid Range",
          description: "Please specify a valid cell range (e.g., A1:C5)",
          variant: "destructive",
        });
        return;
      }

      // Extract column and row information
      const startCol = start.match(/[A-Z]+/)?.[0] || '';
      const startRow = parseInt(start.match(/\d+/)?.[0] || '0', 10);
      const endCol = end.match(/[A-Z]+/)?.[0] || '';
      const endRow = parseInt(end.match(/\d+/)?.[0] || '0', 10);

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
              onCellChange(cellKey, "");
            }
          }
        }

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

  const applyFormula = (formulaPrefix: string) => {
    setFormula(formulaPrefix + "()");

    // If we have a cell range, let's evaluate this formula right away
    if (cellRange) {
      try {
        // Only validate numbers for mathematical functions, not data quality functions
        const isMathFunction = formulaPrefix.match(/^\s*=\s*(SUM|AVERAGE|MAX|MIN|COUNT)/i);
        const isDataQualityFunction = formulaPrefix.match(/^\s*=\s*(TRIM|CLEAN|UPPER|LOWER)/i);
        const isRemoveDuplicatesFunction = formulaPrefix.match(/^\s*=\s*REMOVE_DUPLICATES/i);

        if (isRemoveDuplicatesFunction) {
          // Handle REMOVE_DUPLICATES function
          const cells = parseCellRange(cellRange);
          if (cells.length === 0) {
            toast({
              title: "Invalid Range",
              description: "Please specify a valid cell range",
              variant: "destructive",
            });
            return;
          }

          // Process the range to find duplicates
          handleRemoveDuplicates(cellRange);
          return;

        } else if (isMathFunction) {
          const cells = parseCellRange(cellRange);
          const invalidCells = validateCellsContainNumbers(cells, sheetData);

          if (invalidCells.length > 0) {
            toast({
              title: "Invalid Cells",
              description: `Cells ${invalidCells.join(', ')} do not contain valid numbers. Formula can only be applied on numbers.`,
              variant: "destructive",
            });
            return;
          }
          const formulaWithRange = formulaPrefix + `(${cellRange})`;
          const evaluator = new FormulaEvaluator(sheetData.cells);
          const testResult = evaluator.evaluateFormula(formulaWithRange);
          setResult(testResult);
        } else if (isDataQualityFunction) {
          // For TRIM and CLEAN, we apply the function to all cells in the range
          const cells = parseCellRange(cellRange);
          if (cells.length > 0) {
            cells.forEach(cellId => {
              const cellData = sheetData.cells[cellId];
              if (cellData && cellData.value !== undefined) {
                let newValue = cellData.value.toString();

                // Apply the data quality function
                if (formula.match(/^\s*=\s*TRIM/i)) {
                  newValue = newValue.trim();
                } else if (formula.match(/^\s*=\s*CLEAN/i)) {
                  newValue = ""; // Clear the cell content
                } else if (formula.match(/^\s*=\s*UPPER/i)) {
                  newValue = newValue.toUpperCase(); // Convert to uppercase
                } else if (formula.match(/^\s*=\s*LOWER/i)) {
                  newValue = newValue.toLowerCase(); // Convert to lowercase
                }

                // Update the cell with the cleaned/trimmed value
                onCellChange(cellId, newValue);
              }
            });

            // Show the result from the first cell for display purposes
            const firstCellId = cells[0];
            const firstCellData = sheetData.cells[firstCellId];
            let resultValue = firstCellData?.value?.toString() || "";
            if (formula.match(/^\s*=\s*TRIM/i)) {
              resultValue = resultValue.trim();
            } else if (formula.match(/^\s*=\s*CLEAN/i)) {
              resultValue = ""; // Clear the cell content for display
            }
            setResult(resultValue);
          }
        }
      } catch (error) {
        setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  // Parse cell range like "A1:A5" or "A1,B1,C1"
  const parseCellRange = (range: string): string[] => {
    if (range.includes(':')) {
      // Handle range like A1:A5
      const [start, end] = range.split(':');
      const startCol = start.match(/[A-Z]+/)?.[0] || 'A';
      const startRow = parseInt(start.match(/\d+/)?.[0] || '1');
      const endCol = end.match(/[A-Z]+/)?.[0] || startCol;
      const endRow = parseInt(end.match(/\d+/)?.[0] || startRow.toString());

      const cells: string[] = [];

      // Handle single column range (e.g., A1:A5)
      if (startCol === endCol) {
        for (let row = startRow; row <= endRow; row++) {
          cells.push(`${startCol}${row}`);
        }
      } 
      // Handle single row range (e.g., A1:C1)
      else if (startRow === endRow) {
        for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
          cells.push(`${String.fromCharCode(col)}${startRow}`);
        }
      }

      return cells;
    } else {
      // Handle comma-separated cells like A1,B1,C1
      return range.split(',').map(cell => cell.trim());
    }
  };

  // Validate that all cells contain numeric values
  const validateCellsContainNumbers = (cells: string[], sheetData: SheetData): string[] => {
    return cells.filter(cell => {
      const cellData = sheetData.cells[cell];
      if (!cellData) return true; // Empty cell is invalid

      const value = cellData.value;
      if (value === undefined || value === null) return true;

      // Check if value is a number or can be converted to a number
      return isNaN(Number(value));
    });
  };

  const testFormula = () => {
    if (!formula || !cellRange) return;

    // Check if this is a data quality function
    const isDataQualityFunction = formula.match(/^\s*=\s*(TRIM|CLEAN|UPPER|LOWER|REMOVE_DUPLICATES)/i);

    try {
      if (!cellRange) {
        toast({
          title: "No cell range specified",
          description: "Please enter a valid cell range (e.g., A1:A5 or A1,B1,C1)",
          variant: "destructive",
        });
        return;
      }

      // For mathematical functions, validate that cells contain numbers
      if (formula.match(/^\s*=\s*(SUM|AVERAGE|MAX|MIN|COUNT)/i)) {
        const cells = parseCellRange(cellRange);
        const invalidCells = validateCellsContainNumbers(cells, sheetData);

        if (invalidCells.length > 0) {
          toast({
            title: "Invalid Cells",
            description: `Cells ${invalidCells.join(', ')} do not contain valid numbers. Formula can only be applied on numbers.`,
            variant: "destructive",
          });
          return;
        }
      }

      // Create formula with the actual cell range
      let formulaWithRange = formula;
      if (formula.includes("()")) {
        formulaWithRange = formula.replace(/\(\)/, `(${cellRange})`);
      } else if (!formula.includes("(")) {
        formulaWithRange = `=${formula}(${cellRange})`;
      } else if (!formula.match(/\([^)]+\)/)) {
        formulaWithRange = formula.replace(/\(/, `(${cellRange}`);
      }

      const evaluator = new FormulaEvaluator(sheetData.cells);
      const testResult = evaluator.evaluateFormula(formulaWithRange);
      setResult(testResult);

      // For data quality functions (TRIM and CLEAN), update the cell values directly
      if (formula.match(/^\s*=\s*(TRIM|CLEAN|UPPER|LOWER)/i)) {
        const cells = parseCellRange(cellRange);

        // Apply the transformation to each cell
        cells.forEach((cellId) => {
          const cellData = sheetData.cells[cellId];
          if (cellData && cellData.value !== undefined && cellData.value !== null) {
            let newValue = String(cellData.value);

            if (formula.match(/^\s*=\s*TRIM/i)) {
              newValue = newValue.trim();
            } else if (formula.match(/^\s*=\s*CLEAN/i)) {
              newValue = ""; // Clear the cell content
            } else if (formula.match(/^\s*=\s*UPPER/i)) {
              newValue = newValue.toUpperCase();
            } else if (formula.match(/^\s*=\s*LOWER/i)) {
              newValue = newValue.toLowerCase();
            }

            // Update the cell with the cleaned/trimmed value
            onCellChange(cellId, newValue);
          }
        });

        // Determine which function was applied
        let functionName = "UNKNOWN";
        if (formula.match(/TRIM/i)) functionName = "TRIM";
        else if (formula.match(/CLEAN/i)) functionName = "CLEAN";
        else if (formula.match(/UPPER/i)) functionName = "UPPER";
        else if (formula.match(/LOWER/i)) functionName = "LOWER";

        toast({
          title: "Success",
          description: `Applied ${functionName} function to ${cells.length} cell(s)`,
        });
      } else if (formula.match(/^\s*=\s*REMOVE_DUPLICATES/i)) {
        handleRemoveDuplicates(cellRange);
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Formula Functions</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <Label htmlFor="cell-range">Cell Range:</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="cell-range"
              value={cellRange}
              onChange={(e) => setCellRange(e.target.value)}
              placeholder="e.g., A1:A5 or A1,B1,C1"
              className="mt-1"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter a range (e.g., A1:A5 or A1,B1,C1)
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="math">Mathematical</TabsTrigger>
            <TabsTrigger value="data">Data Quality</TabsTrigger>
          </TabsList>

          <TabsContent value="math" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=SUM")}
              >
                SUM
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=AVERAGE")}
              >
                AVERAGE
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=MAX")}
              >
                MAX
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=MIN")}
              >
                MIN
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=COUNT")}
              >
                COUNT
              </Button>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              <p>Mathematical functions work on ranges of cells:</p>
              <ul className="list-disc list-inside">
                <li>SUM - Adds all values in a range</li>
                <li>AVERAGE - Calculates the average of values</li>
                <li>MAX - Finds the maximum value</li>
                <li>MIN - Finds the minimum value</li>
                <li>COUNT - Counts numeric cells</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=TRIM")}
              >
                TRIM
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=CLEAN")}
              >
                CLEAN
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=UPPER")}
              >
                UPPER
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=LOWER")}
              >
                LOWER
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=REMOVE_DUPLICATES")}
              >
                REMOVE_DUPLICATES
              </Button>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              <p>Data quality functions:</p>
              <ul className="list-disc list-inside">
                <li>TRIM - Removes extra spaces</li>
                <li>CLEAN - Clears cell content (makes the cell blank)</li>
                <li>UPPER - Converts text to uppercase</li>
                <li>LOWER - Converts text to lowercase</li>
                <li>REMOVE_DUPLICATES - Removes duplicate rows from a range</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4">
          <Label htmlFor="formula">Formula:</Label>
          <Input 
            id="formula"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="result">Result:</Label>
          <Input 
            id="result"
            value={result.toString()}
            readOnly
            className="mt-1 bg-gray-50"
          />
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={testFormula} disabled={!cellRange || !formula}>
            {formula.match(/^\s*=\s*(TRIM|CLEAN|UPPER|LOWER|REMOVE_DUPLICATES)/i) ? "Apply Formula" : "Test Formula"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}