import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  const [isSelectingCells, setIsSelectingCells] = useState(false);
  const [tempFormula, setTempFormula] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset state when dialog opens/closes
    if (!isOpen) {
      setIsSelectingCells(false);
      setFormula("");
      setPreviewResult("");
    }
  }, [isOpen]);

  const handleApply = () => {
    if (formula && selectedCells.length > 0) {
      onApplyFormula(selectedCells, formula.startsWith("=") ? formula : `=${formula}`);
      onClose();
    }
  };

  const applyFormula = (formulaTemplate: string) => {
    setFormula(formulaTemplate);
    evaluatePreview(formulaTemplate);
  };

  const evaluatePreview = (formulaToEvaluate: string) => {
    // Preview the formula result on the first selected cell
    if (selectedCells.length > 0) {
      try {
        const evaluator = new FormulaEvaluator(sheetData.cells);
        const testResult = evaluator.evaluateFormula(formulaToEvaluate);
        setPreviewResult(testResult);
      } catch (error) {
        setPreviewResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  const startCellSelection = () => {
    // Store current formula and cursor position
    setTempFormula(formula);
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || formula.length);
    }
    setIsSelectingCells(true);
  };

  const insertCellReference = (cellRef: string) => {
    if (isSelectingCells) {
      // Insert the cell reference at cursor position
      const newFormula = 
        tempFormula.substring(0, cursorPosition) + 
        cellRef + 
        tempFormula.substring(cursorPosition);

      setFormula(newFormula);
      setIsSelectingCells(false);

      // Evaluate the new formula
      evaluatePreview(newFormula);

      // Focus back on the input and set cursor position after the inserted cell reference
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.selectionStart = cursorPosition + cellRef.length;
          inputRef.current.selectionEnd = cursorPosition + cellRef.length;
        }
      }, 0);
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

        <div className="space-y-4 mt-2">
          <Label>Formula:</Label>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={formula}
              onChange={(e) => {
                setFormula(e.target.value);
                evaluatePreview(e.target.value);
              }}
              placeholder="Enter a formula (e.g., =SUM(A1:A5))"
              className={isSelectingCells ? "border-blue-500 bg-blue-50" : ""}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={startCellSelection}
              title="Select a cell reference"
              className={isSelectingCells ? "bg-blue-100 border-blue-500" : ""}
            >
              +
            </Button>
          </div>

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