import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTrainerData } from "@/contexts/TrainerDataContext";
import { AlertTriangle, ThumbsDown, Weight, TrendingDown, TrendingUp, AlertCircle, CheckCircle, ArrowDown, ArrowUp, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ClientAlertsProps {
  clientId: string;
}

export function ClientAlerts({ clientId }: ClientAlertsProps) {
  const { getClientFeedback, resolveFeedback } = useTrainerData();
  const feedback = getClientFeedback(clientId);

  const getIcon = (type: string) => {
    switch (type) {
      case 'pain':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'dislike':
        return <ThumbsDown className="h-5 w-5 text-warning" />;
      case 'too_heavy':
        return <TrendingUp className="h-5 w-5 text-warning" />;
      case 'too_light':
        return <TrendingDown className="h-5 w-5 text-primary" />;
      case 'form_issue':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'underperformed_weight':
        return <ArrowDown className="h-5 w-5 text-destructive" />;
      case 'underperformed_reps':
        return <ArrowDown className="h-5 w-5 text-destructive" />;
      case 'incomplete_set':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'overperformed_weight':
        return <ArrowUp className="h-5 w-5 text-green-600" />;
      case 'overperformed_reps':
        return <ArrowUp className="h-5 w-5 text-green-600" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      pain: 'Pain Reported',
      dislike: 'Dislikes Exercise',
      too_heavy: 'Weight Too Heavy',
      too_light: 'Weight Too Light',
      form_issue: 'Form Issue',
      underperformed_weight: 'Underperformed Weight',
      underperformed_reps: 'Underperformed Reps',
      incomplete_set: 'Incomplete Set',
      overperformed_weight: 'Overperformed Weight',
      overperformed_reps: 'Overperformed Reps'
    };
    const variant: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      pain: 'destructive',
      dislike: 'secondary',
      too_heavy: 'secondary',
      too_light: 'default',
      form_issue: 'secondary',
      underperformed_weight: 'destructive',
      underperformed_reps: 'destructive',
      incomplete_set: 'destructive',
      overperformed_weight: 'default',
      overperformed_reps: 'default'
    };
    return <Badge variant={variant[type] || 'default'}>{labels[type] || type}</Badge>;
  };

  const isPositiveAlert = (type: string) => {
    return type === 'overperformed_weight' || type === 'overperformed_reps' || type === 'too_light';
  };

  if (feedback.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <p className="text-lg font-medium">No active alerts</p>
          <p className="text-sm text-muted-foreground mt-2">
            All client feedback has been addressed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Client Alerts & Feedback</h2>
        <p className="text-muted-foreground">
          {feedback.length} {feedback.length === 1 ? 'alert' : 'alerts'} requiring your attention
        </p>
      </div>

      <div className="space-y-4">
        {feedback.map((item) => (
          <Card 
            key={item.id} 
            className={isPositiveAlert(item.type) ? "border-green-600" : "border-warning"}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getIcon(item.type)}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.exerciseName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                      {item.setNumber && ` • Set ${item.setNumber}`}
                    </p>
                  </div>
                </div>
                {getTypeBadge(item.type)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-md ${isPositiveAlert(item.type) ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/50'}`}>
                <p className="text-sm font-medium mb-1">
                  {isPositiveAlert(item.type) ? 'Performance Achievement:' : 'Alert Details:'}
                </p>
                <p className="text-sm">{item.message}</p>
                {item.prescribedValue && item.actualValue && (
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Prescribed:</span>
                      <p className="font-medium">{item.prescribedValue}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Actual:</span>
                      <p className={`font-medium ${isPositiveAlert(item.type) ? 'text-green-600' : 'text-destructive'}`}>
                        {item.actualValue}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // In real implementation, this would navigate to the workout
                    console.log('View workout:', item.workoutId);
                  }}
                >
                  View Workout
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // In real implementation, this would open the program editor
                    console.log('Adjust exercise:', item.exerciseId);
                  }}
                >
                  Adjust Exercise
                </Button>
                <Button
                  size="sm"
                  onClick={() => resolveFeedback(item.id)}
                  data-testid={`button-resolve-${item.id}`}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Resolved
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
