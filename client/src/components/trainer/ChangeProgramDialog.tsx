import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ChangeProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  currentProgram: string;
  onConfirm: (newProgram: string) => void;
}

const PROGRAM_TEMPLATES = [
  'Morphit Flow - Week 1',
  'Morphit Flow - Week 2',
  'Morphit Flow - Week 3',
  'Morphit Flow - Week 4',
  'Morphit Build - Week 1',
  'Morphit Build - Week 2',
  'Morphit Build - Week 3',
  'Morphit Build - Week 4',
  'Morphit Strong - Week 1',
  'Morphit Strong - Week 2',
  'Morphit Strong - Week 3',
  'Morphit Strong - Week 4',
  'Morphit Move - Week 1',
  'Morphit Move - Week 2',
  'Morphit Move - Week 3',
  'Morphit Move - Week 4',
];

export function ChangeProgramDialog({
  open,
  onOpenChange,
  clientName,
  currentProgram,
  onConfirm,
}: ChangeProgramDialogProps) {
  const [selectedProgram, setSelectedProgram] = useState<string>(currentProgram);

  useEffect(() => {
    if (open) {
      setSelectedProgram(currentProgram);
    }
  }, [open, currentProgram]);

  const handleConfirm = () => {
    if (selectedProgram && selectedProgram !== currentProgram) {
      onConfirm(selectedProgram);
      onOpenChange(false);
    }
  };

  const hasChanges = selectedProgram !== currentProgram;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-change-program">
        <DialogHeader>
          <DialogTitle>Change Training Program</DialogTitle>
          <DialogDescription>
            Select a new program template for {clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="current-program">Current Program</Label>
            <div className="p-3 rounded-md bg-muted text-sm" data-testid="text-current-program">
              {currentProgram}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-program">New Program</Label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger id="new-program" data-testid="select-new-program">
                <SelectValue placeholder="Select a program template" />
              </SelectTrigger>
              <SelectContent>
                {PROGRAM_TEMPLATES.map((template) => (
                  <SelectItem key={template} value={template}>
                    {template}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasChanges && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will replace the client's current program with new workouts and exercises.
                Previous workout history will be preserved.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-program-change"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasChanges}
            data-testid="button-confirm-program-change"
          >
            Change Program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
