import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTrainerData } from "@/contexts/TrainerDataContext";
import { AlertTriangle, ThumbsDown, Weight, TrendingDown, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
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
      form_issue: 'Form Issue'
    };
    const variant: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      pain: 'destructive',
      dislike: 'secondary',
      too_heavy: 'secondary',
      too_light: 'default',
      form_issue: 'secondary'
    };
    return <Badge variant={variant[type] || 'default'}>{labels[type] || type}</Badge>;
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
          <Card key={item.id} className="border-warning">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getIcon(item.type)}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.exerciseName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reported {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {getTypeBadge(item.type)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm font-medium mb-1">Client Feedback:</p>
                <p className="text-sm text-muted-foreground">{item.message}</p>
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
