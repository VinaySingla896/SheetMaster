import { useState, useEffect } from "react";
import { Grid } from "@/components/spreadsheet/Grid";
import { Toolbar } from "@/components/spreadsheet/Toolbar";
import { FormulaBar } from "@/components/spreadsheet/FormulaBar";
import { FormulaEvaluator } from "@/lib/formulaEvaluator";
import { SheetData, CellData } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const INITIAL_SHEET: SheetData = {
  cells: {},
  rowCount: 100,
  colCount: 26
};

export default function Home() {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [sheetData, setSheetData] = useState<SheetData>(INITIAL_SHEET);

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
    if (!selectedCell) return;

    const newData = { ...sheetData };
    const cell = newData.cells[selectedCell];
    if (!cell) return;

    const formula = `=FIND_AND_REPLACE(${selectedCell},"${find}","${replace}")`;
    const evaluator = new FormulaEvaluator(newData.cells);
    const newValue = evaluator.evaluateFormula(formula, [selectedCell]);

    newData.cells[selectedCell] = {
      ...cell,
      value: newValue
    };

    setSheetData(newData);
    updateSheet.mutate(newData);
  };

  return (
    <div className="h-screen flex flex-col">
      <Toolbar 
        onFormatChange={handleFormatChange}
        onFindReplace={handleFindReplace}
      />
      <FormulaBar
        value={selectedCell ? (sheetData.cells[selectedCell]?.formula || sheetData.cells[selectedCell]?.value?.toString() || "") : ""}
        onChange={(value) => selectedCell && handleCellChange(selectedCell, value)}
      />
      <div className="flex-1 overflow-auto">
        <Grid
          data={sheetData}
          onCellSelect={setSelectedCell}
          onCellChange={handleCellChange}
        />
      </div>
    </div>
  );
}