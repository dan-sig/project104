import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface AssignProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function AssignProgramDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: AssignProgramDialogProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [note, setNote] = useState("");
  const { toast } = useToast();

  // Fetch trainer's programs
  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ["/api/trainer/programs"],
    enabled: open,
  });

  const assignProgramMutation = useMutation({
    mutationFn: async (data: { clientId: string; programId: string; note: string }) => {
      const response = await fetch("/api/trainer/assign-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/clients"] });
      toast({
        title: "Program assigned",
        description: `Successfully assigned program to ${clientName}`,
      });
      setSelectedProgramId("");
      setNote("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign program",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProgramId) {
      toast({
        title: "Program required",
        description: "Please select a program to assign",
        variant: "destructive",
      });
      return;
    }

    assignProgramMutation.mutate({
      clientId,
      programId: selectedProgramId,
      note,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-assign-program">
        <DialogHeader>
          <DialogTitle>Assign Program to {clientName}</DialogTitle>
          <DialogDescription>
            Select a program to assign to this client. They will receive access
            immediately at no cost.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="program-select">Program *</Label>
            {programsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <Select
                value={selectedProgramId}
                onValueChange={setSelectedProgramId}
              >
                <SelectTrigger id="program-select" data-testid="select-program">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs && Array.isArray(programs) && programs.length > 0 ? (
                    programs.map((program: any) => (
                      <SelectItem
                        key={program.id}
                        value={program.id}
                        data-testid={`option-program-${program.id}`}
                      >
                        {program.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-programs" disabled>
                      No programs available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignment-note">Note (Optional)</Label>
            <Textarea
              id="assignment-note"
              data-testid="textarea-assignment-note"
              placeholder="Add a note for this assignment..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-assign"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={assignProgramMutation.isPending || !selectedProgramId}
              data-testid="button-confirm-assign"
            >
              {assignProgramMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Program"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
