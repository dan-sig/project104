import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface ClientProgramProps {
  clientId: string;
}

export function ClientProgram({ clientId }: ClientProgramProps) {
  return (
    <Card data-testid="card-program-placeholder">
      <CardHeader>
        <CardTitle>Training Program Details</CardTitle>
      </CardHeader>
      <CardContent className="p-12 text-center">
        <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">Program Management Coming Soon</p>
        <p className="text-sm text-muted-foreground mt-2">
          Advanced program editing features will be available in a future update.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          For now, use the Workouts tab to view client sessions and add workout notes.
        </p>
      </CardContent>
    </Card>
  );
}
