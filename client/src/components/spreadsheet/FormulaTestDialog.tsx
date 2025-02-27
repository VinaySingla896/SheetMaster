
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SheetData } from "@shared/schema";
import { FormulaEvaluator } from "@/lib/formulaEvaluator";

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

  const handleTest = () => {
    try {
      const evaluator = new FormulaEvaluator(sheetData.cells);
      const testResult = evaluator.evaluateFormula(formula);
      setResult(testResult);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const applyFormula = (formulaTemplate: string) => {
    setFormula(formulaTemplate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Test Formula Functions</DialogTitle>
        </DialogHeader>

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
                onClick={() => applyFormula("=SUM(A1:A5)")}
              >
                SUM
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=AVERAGE(A1:A5)")}
              >
                AVERAGE
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=MAX(A1:A5)")}
              >
                MAX
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=MIN(A1:A5)")}
              >
                MIN
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=COUNT(A1:A5)")}
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
                onClick={() => applyFormula("=TRIM(A1)")}
              >
                TRIM
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=UPPER(A1)")}
              >
                UPPER
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=LOWER(A1)")}
              >
                LOWER
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=FIND_AND_REPLACE(A1,\"old\",\"new\")")}
              >
                FIND_AND_REPLACE
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyFormula("=REMOVE_DUPLICATES(A1:C5)")}
              >
                REMOVE_DUPLICATES
              </Button>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              <p>Data quality functions:</p>
              <ul className="list-disc list-inside">
                <li>TRIM - Removes whitespace</li>
                <li>UPPER - Converts to uppercase</li>
                <li>LOWER - Converts to lowercase</li>
                <li>FIND_AND_REPLACE - Replaces text</li>
                <li>REMOVE_DUPLICATES - Removes duplicate rows</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="formula">Formula</Label>
            <Input
              id="formula"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Enter formula (e.g., =SUM(A1:A5))"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="result">Result</Label>
            <div 
              id="result" 
              className="p-2 border rounded-md bg-gray-50 min-h-[40px]"
            >
              {result !== "" ? result : "Result will appear here"}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleTest}>
            Test Formula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
