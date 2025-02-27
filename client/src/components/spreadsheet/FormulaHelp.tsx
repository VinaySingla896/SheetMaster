
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export function FormulaHelp() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <HelpCircle className="h-4 w-4 text-gray-500" />
        </TooltipTrigger>
        <TooltipContent className="max-w-md">
          <div className="space-y-2">
            <h3 className="font-bold">Available Formulas</h3>
            <div className="text-sm">
              <h4 className="font-semibold">Mathematical Functions:</h4>
              <ul className="list-disc pl-4">
                <li><code>=SUM(A1:A5)</code> - Sum values in range</li>
                <li><code>=AVERAGE(A1:A5)</code> - Average of values</li>
                <li><code>=MAX(A1:A5)</code> - Maximum value</li>
                <li><code>=MIN(A1:A5)</code> - Minimum value</li>
                <li><code>=COUNT(A1:A5)</code> - Count numeric cells</li>
              </ul>
              <h4 className="font-semibold mt-2">Data Quality Functions:</h4>
              <ul className="list-disc pl-4">
                <li><code>=TRIM(A1)</code> - Remove whitespace</li>
                <li><code>=UPPER(A1)</code> - Convert to uppercase</li>
                <li><code>=LOWER(A1)</code> - Convert to lowercase</li>
                <li><code>=FIND_AND_REPLACE(A1,"old","new")</code> - Replace text</li>
                <li><code>=REMOVE_DUPLICATES(A1:C5)</code> - Remove duplicate rows</li>
              </ul>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
