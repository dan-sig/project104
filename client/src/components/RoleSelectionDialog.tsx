import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, User } from "lucide-react";
import { useLocation } from "wouter";

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleSelectionDialog({ open, onOpenChange }: RoleSelectionDialogProps) {
  const [, setLocation] = useLocation();

  const handleTrainerLogin = () => {
    // Store role in session storage for prototype
    sessionStorage.setItem('userRole', 'trainer');
    setLocation('/trainer');
    onOpenChange(false);
  };

  const handleClientLogin = () => {
    // Store role in session storage for prototype
    sessionStorage.setItem('userRole', 'client');
    // In production, this would go through actual auth
    window.location.href = "/api/login";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Your Role</DialogTitle>
          <DialogDescription>
            Are you logging in as a trainer or a client?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Button
            size="lg"
            className="h-24 flex-col gap-2"
            onClick={handleTrainerLogin}
            data-testid="button-login-trainer"
          >
            <Users className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold text-lg">Login as Trainer</div>
              <div className="text-xs opacity-90">Manage clients and programs</div>
            </div>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={handleClientLogin}
            data-testid="button-login-client"
          >
            <User className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold text-lg">Login as Client</div>
              <div className="text-xs opacity-90">Access your training program</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
