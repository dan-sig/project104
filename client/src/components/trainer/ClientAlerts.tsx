import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Loader2, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

interface ClientAlertsProps {
  clientId: string;
  alertData?: {
    inactiveStatus: {
      isInactive: boolean;
      daysSinceWorkout: number;
      lastWorkoutDate: string | null;
    };
    missingPreNotes: Array<{
      workoutId: string;
      scheduledDate: string;
    }>;
    missingPostNotes: Array<{
      workoutId: string;
      scheduledDate: string;
    }>;
  };
  isLoading?: boolean;
}

export function ClientAlerts({ clientId, alertData, isLoading }: ClientAlertsProps) {
  if (isLoading) {
    return (
      <Card data-testid="card-alerts-loading">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-4">Loading alerts...</p>
        </CardContent>
      </Card>
    );
  }

  if (!alertData) {
    return (
      <Card data-testid="card-alerts-error">
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium">Unable to load alerts</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try refreshing the page
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasAlerts = 
    alertData.inactiveStatus.isInactive ||
    alertData.missingPreNotes.length > 0 ||
    alertData.missingPostNotes.length > 0;

  if (!hasAlerts) {
    return (
      <Card data-testid="card-alerts-empty">
        <CardHeader>
          <CardTitle>Client Alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <p className="text-lg font-medium">No active alerts</p>
          <p className="text-sm text-muted-foreground mt-2">
            All client alerts have been addressed
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Use the Workouts tab to add pre-session notes and post-session reviews for your client.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inactive Status Alert */}
      {alertData.inactiveStatus.isInactive && (
        <Card data-testid="card-alert-inactive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <CardTitle className="text-lg">Inactive Client</CardTitle>
              <Badge variant="secondary" className="ml-auto bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                Activity
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  No workout completed in {alertData.inactiveStatus.daysSinceWorkout} days
                </p>
                {alertData.inactiveStatus.lastWorkoutDate && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Last workout: {format(new Date(alertData.inactiveStatus.lastWorkoutDate), 'MMM d, yyyy')}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Consider reaching out to check in and provide motivation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Pre-Session Notes */}
      {alertData.missingPreNotes.length > 0 && (
        <Card data-testid="card-alert-missing-pre-notes">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <CardTitle className="text-lg">Missing Pre-Session Notes</CardTitle>
              <Badge variant="secondary" className="ml-auto bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                {alertData.missingPreNotes.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The following workouts need pre-session notes to guide your client:
              </p>
              <div className="space-y-2">
                {alertData.missingPreNotes.map((workout) => (
                  <div 
                    key={workout.workoutId} 
                    className="flex items-center gap-3 p-3 rounded-md border"
                    data-testid={`missing-pre-note-${workout.workoutId}`}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Workout on {format(new Date(workout.scheduledDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Post-Session Reviews */}
      {alertData.missingPostNotes.length > 0 && (
        <Card data-testid="card-alert-missing-post-notes">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <CardTitle className="text-lg">Missing Post-Session Reviews</CardTitle>
              <Badge variant="secondary" className="ml-auto bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                {alertData.missingPostNotes.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The following completed workouts need post-session reviews:
              </p>
              <div className="space-y-2">
                {alertData.missingPostNotes.map((workout) => (
                  <div 
                    key={workout.workoutId} 
                    className="flex items-center gap-3 p-3 rounded-md border"
                    data-testid={`missing-post-note-${workout.workoutId}`}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Workout on {format(new Date(workout.scheduledDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
