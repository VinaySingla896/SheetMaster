
import { useState } from "react";
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
}

export function FormulaTestDialog({
  isOpen,
  onClose,
  sheetData,
}: FormulaTestDialogProps) {
  const [activeTab, setActiveTab] = useState("math");
  const [formula, setFormula] = useState("");
  const [result, setResult] = useState<string | number>("");
  const [cellRange, setCellRange] = useState("");
  const { toast } = useToast();

  const handleTest = () => {
    try {
      if (!cellRange) {
        toast({
          title: "Error",
          description: "Please enter a cell range",
          variant: "destructive",
        });
        return;
      }
      
      // Parse cell range
      const cells = parseCellRange(cellRange);
      
      // Check if all cells contain numbers
      const invalidCells = validateCellsContainNumbers(cells, sheetData);
      
      if (invalidCells.length > 0) {
        toast({
          title: "Invalid Cells",
          description: `Cells ${invalidCells.join(', ')} do not contain valid numbers. Formula can only be applied on numbers.`,
          variant: "destructive",
        });
        return;
      }
      
      // Create formula with the actual cell range
      const formulaWithRange = formula.replace(/\([^)]*\)/, `(${cellRange})`);
      
      const evaluator = new FormulaEvaluator(sheetData.cells);
      const testResult = evaluator.evaluateFormula(formulaWithRange);
      setResult(testResult);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const applyFormula = (formulaTemplate: string) => {
    setFormula(formulaTemplate);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Test Formula Functions</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <Label htmlFor="cell-range">Cell Range:</Label>
          <Input 
            id="cell-range"
            value={cellRange}
            onChange={(e) => setCellRange(e.target.value)}
            placeholder="e.g., A1:A5 or A1,B1,C1"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter a range (A1:A5) or individual cells (A1,B1,C1)
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
                onClick={() => applyFormula("=SUM()")}
              >
                SUM
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=AVERAGE()")}
              >
                AVERAGE
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=MAX()")}
              >
                MAX
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=MIN()")}
              >
                MIN
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=COUNT()")}
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
                onClick={() => applyFormula("=TRIM()")}
              >
                TRIM
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=CLEAN()")}
              >
                CLEAN
              </Button>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              <p>Data quality functions:</p>
              <ul className="list-disc list-inside">
                <li>TRIM - Removes extra spaces</li>
                <li>CLEAN - Removes non-printable characters</li>
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
          <Button onClick={handleTest}>Test Formula</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
