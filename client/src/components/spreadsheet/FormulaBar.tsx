import { Input } from "@/components/ui/input";
import { FormulaHelp } from "./FormulaHelp";

interface FormulaBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function FormulaBar({ value, onChange }: FormulaBarProps) {
  return (
    <div className="border-b border-gray-300 p-2 flex items-center gap-2 bg-white">
      <div className="text-gray-500">fx</div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-grow"
        placeholder="Enter a value or start with = for formulas"
      />
      <FormulaHelp />
    </div>
  );
}