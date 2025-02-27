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
    if (!selectedCell) {
      toast({
        title: "No cell selected",
        description: "Please select a cell first",
        variant: "destructive"
      });
      return;
    }

    const newData = { ...sheetData };
    const cell = newData.cells[selectedCell];
    if (!cell?.value) {
      toast({
        title: "Empty cell",
        description: "Selected cell is empty",
        variant: "destructive"
      });
      return;
    }

    setHighlightText(find);

    const currentValue = String(cell.value);
    if (!currentValue.match(new RegExp(find, 'gi'))) {
      toast({
        title: "No matches found",
        description: `Could not find "${find}" in the selected cell`,
        variant: "destructive"
      });
      return;
    }

    const newValue = currentValue.replace(new RegExp(find, 'gi'), replace);
    newData.cells[selectedCell] = {
      ...cell,
      value: newValue
    };

    setSheetData(newData);
    updateSheet.mutate(newData);

    toast({
      title: "Text replaced",
      description: `Replaced "${find}" with "${replace}"`,
    });

    // Clear highlight after a short delay
    setTimeout(() => setHighlightText(""), 2000);
  };

  const handleFind = (text: string) => {
    if (!selectedCell) {
      toast({
        title: "No cell selected",
        description: "Please select a cell first",
        variant: "destructive"
      });
      return;
    }

    const cell = sheetData.cells[selectedCell];
    if (!cell?.value) {
      toast({
        title: "Empty cell",
        description: "Selected cell is empty",
        variant: "destructive"
      });
      return;
    }

    const currentValue = String(cell.value);
    if (!currentValue.match(new RegExp(text, 'gi'))) {
      toast({
        title: "No matches found",
        description: `Could not find "${text}" in the selected cell`,
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