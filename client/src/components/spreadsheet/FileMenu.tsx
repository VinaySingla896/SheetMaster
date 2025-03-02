import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FilePlus, Save, Upload } from "lucide-react";
import { SheetData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface FileMenuProps {
  onNewFile: () => void;
  onLoadFile: (data: SheetData) => void;
  sheetData: SheetData;
}

export function FileMenu({ onNewFile, onLoadFile, sheetData }: FileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleNewFile = () => {
    if (confirm("Are you sure you want to create a new file? All unsaved changes will be lost.")) {
      onNewFile();
      setIsOpen(false);
      toast({
        title: "New File Created",
        description: "Started with a blank spreadsheet",
      });
    }
  };

  const handleSaveFile = () => {
    // Convert sheet data to CSV format
    const cells = sheetData.cells;
    const rowCount = sheetData.rowCount;
    const colCount = sheetData.colCount;
    let csvContent = "";

    // Find the maximum row and column indexes that have data
    let maxRow = 0;
    let maxCol = 0;

    for (const cellId in cells) {
      // Fix cellId parsing for format like 'A1' (not 'A:1')
      const colMatch = cellId.match(/^[A-Z]+/);
      const rowMatch = cellId.match(/\d+$/);

      if (colMatch && rowMatch) {
        const col = colMatch[0].charCodeAt(0) - 65;
        const row = parseInt(rowMatch[0]) - 1;
        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, col);
      }
    }

    // Ensure we export at least 10 rows and 10 columns of data
    maxRow = Math.max(maxRow, 10);
    maxCol = Math.max(maxCol, 10);

    // Generate CSV content
    for (let row = 0; row <= maxRow; row++) {
      const csvRow: string[] = [];

      for (let col = 0; col <= maxCol; col++) {
        const colLetter = String.fromCharCode(65 + col);
        // Fix cell reference format to match grid component (A1 instead of A:1)
        const cellKey = `${colLetter}${row + 1}`;
        const cellValue = cells[cellKey]?.value || '';

        // Properly handle CSV escaping for values with commas or quotes
        if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
          csvRow.push(`"${cellValue.replace(/"/g, '""')}"`);
        } else {
          csvRow.push(cellValue);
        }
      }

      csvContent += csvRow.join(',') + '\n';
    }

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a download link and trigger download
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "spreadsheet.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsOpen(false);
    toast({
      title: "File Saved",
      description: "Your spreadsheet has been downloaded as CSV",
    });
  };

  const handleLoadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvString = e.target?.result as string;
          if (!csvString) {
            console.error("Failed to read file content");
            return;
          }

          const lines = csvString.split('\n').filter(line => line.trim());

          const newCells: Record<string, { value: string }> = {};

          lines.forEach((line, rowIndex) => {
            if (!line.trim()) return; // Skip empty lines

            // Parse CSV properly, handling quoted values
            const getCellValues = (line: string) => {
              const values = [];
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
                // Fix cell reference format (A1 instead of A:1)
                const cellId = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
                newCells[cellId] = { value };
              }
            });
          });

          // Create new sheet data with loaded cells
          const newSheetData: SheetData = {
            cells: newCells,
            rowCount: Math.max(100, Object.keys(newCells).length > 0 ? 
              Math.max(...Object.keys(newCells).map(key => {
                // Extract row number from cell ID (A1 format)
                const rowMatch = key.match(/[0-9]+/);
                return rowMatch ? parseInt(rowMatch[0]) : 0;
              })) : 0),
            colCount: Math.max(26, Object.keys(newCells).length > 0 ? 
              Math.max(...Object.keys(newCells).map(key => {
                // Extract column letter from cell ID (A1 format)
                const colMatch = key.match(/[A-Z]+/);
                return colMatch ? colMatch[0].charCodeAt(0) - 64 : 0;
              })) : 0)
          };

          onLoadFile(newSheetData);

          // Reset file input
          event.target.value = '';

          setIsOpen(false);
          toast({
            title: "File Loaded",
            description: "Successfully imported CSV data",
          });
        } catch (error) {
          console.error("Error processing CSV:", error);
          toast({
            title: "Error Loading File",
            description: "Failed to parse the CSV file",
            variant: "destructive"
          });
        }
      };

      reader.onerror = () => {
        console.error("Error reading file");
        toast({
          title: "Error Loading File",
          description: "An error occurred while reading the file.",
          variant: "destructive"
        });
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error handling file:", error);
      toast({
        title: "Error Loading File",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-8 gap-1">File</Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>File Operations</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button 
            variant="outline" 
            className="justify-start gap-2" 
            onClick={handleNewFile}
          >
            <FilePlus size={16} />
            New File
          </Button>
          <Button 
            variant="outline" 
            className="justify-start gap-2" 
            onClick={handleSaveFile}
          >
            <Save size={16} />
            Save as CSV
          </Button>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2" 
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <Upload size={16} />
              Load from CSV
            </Button>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleLoadFile}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}