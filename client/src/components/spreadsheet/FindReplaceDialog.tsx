import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FindReplaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (find: string, replace: string) => void;
  onFind: (text: string) => void;
}

export function FindReplaceDialog({ isOpen, onClose, onApply, onFind }: FindReplaceDialogProps) {
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  const handleFind = () => {
    onFind(findText);
  };

  const handleApply = () => {
    onApply(findText, replaceText);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Find and Replace</DialogTitle>
          <DialogDescription>
            Enter text to find. Optionally, provide replacement text to replace found matches.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Find</label>
            <Input
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Text to find"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Replace with (optional)</label>
            <Input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleFind} variant="secondary">
              Find
            </Button>
          </div>
          <Button onClick={handleApply} disabled={!replaceText}>
            Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}