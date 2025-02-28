import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SheetData } from "@shared/schema";
import { FormulaEvaluator } from "@/lib/formulaEvaluator";

interface FormulaApplyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCells: string[];
  onApplyFormula: (cells: string[], formula: string) => void;
  sheetData: SheetData;
}

export function FormulaApplyDialog({
  isOpen,
  onClose,
  selectedCells,
  onApplyFormula,
  sheetData,
}: FormulaApplyDialogProps) {
  const [activeTab, setActiveTab] = useState("math");
  const [formula, setFormula] = useState("");
  const [previewResult, setPreviewResult] = useState<string | number>("");

  const handleApply = () => {
    if (formula && selectedCells.length > 0) {
      onApplyFormula(selectedCells, formula.startsWith("=") ? formula : `=${formula}`);
      onClose();
    }
  };

  const applyFormula = (formulaTemplate: string) => {
    setFormula(formulaTemplate);
    // Preview the formula result on the first selected cell
    if (selectedCells.length > 0) {
      try {
        const evaluator = new FormulaEvaluator(sheetData.cells);
        const testResult = evaluator.evaluateFormula(formulaTemplate);
        setPreviewResult(testResult);
      } catch (error) {
        setPreviewResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply Formula to Selected Cells</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <Label>Selected Cells:</Label>
          <div className="text-sm bg-gray-100 p-2 rounded mt-1">
            {selectedCells.length > 0 
              ? selectedCells.join(", ") 
              : "No cells selected"}
          </div>
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
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2 mt-4">
          <Label htmlFor="formula">Formula:</Label>
          <Input
            id="formula"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="Enter a formula (e.g., =SUM(A1:A5))"
          />

          {previewResult && (
            <div className="text-sm mt-1">
              <Label>Preview:</Label>
              <div className="bg-gray-100 p-2 rounded mt-1">
                {previewResult}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!formula || selectedCells.length === 0}>
            Apply Formula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}