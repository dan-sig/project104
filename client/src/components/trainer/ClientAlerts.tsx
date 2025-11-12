import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface ClientAlertsProps {
  clientId: string;
}

export function ClientAlerts({ clientId }: ClientAlertsProps) {
  return (
    <Card data-testid="card-alerts-placeholder">
      <CardHeader>
        <CardTitle>Client Alerts & Feedback</CardTitle>
      </CardHeader>
      <CardContent className="p-12 text-center">
        <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
        <p className="text-lg font-medium">No active alerts</p>
        <p className="text-sm text-muted-foreground mt-2">
          All client feedback has been addressed
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Use the Workouts tab to add pre-session notes and post-session reviews for your client.
        </p>
      </CardContent>
    </Card>
  );
}
