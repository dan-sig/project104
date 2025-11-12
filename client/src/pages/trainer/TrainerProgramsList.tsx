import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import { TrainerProgramsGrid } from "@/components/trainer/TrainerProgramsGrid";

export default function TrainerProgramsList() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Programs</h1>
          <p className="text-muted-foreground mt-1">
            Manage your training programs and share them with clients
          </p>
        </div>
        <Button onClick={() => setLocation("/trainer/programs/new")} data-testid="button-create-program">
          <Plus className="h-4 w-4 mr-2" />
          Create Program
        </Button>
      </div>

      <TrainerProgramsGrid />
    </div>
  );
}
