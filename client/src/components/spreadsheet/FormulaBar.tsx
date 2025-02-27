import { Input } from "@/components/ui/input";

interface FormulaBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function FormulaBar({ value, onChange }: FormulaBarProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <span className="text-sm font-medium">fx</span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter formula"
        className="flex-1"
      />
    </div>
  );
}
