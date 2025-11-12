import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Calendar, Dumbbell, CheckCircle, Loader2 } from "lucide-react";

interface ClientProgressProps {
  clientId: string;
}

interface WorkoutSession {
  id: string;
  status: string;
  scheduledDate: string;
  durationMinutes: number | null;
  caloriesBurned: number | null;
}

export function ClientProgress({ clientId }: ClientProgressProps) {
  const { data: sessions, isLoading } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/trainer/clients", clientId, "sessions"],
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const workouts = sessions || [];
  const completedWorkouts = workouts.filter(w => w.status === 'completed');
  const totalWorkouts = workouts.length;
  const completionRate = totalWorkouts > 0 
    ? Math.round((completedWorkouts.length / totalWorkouts) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Progress Overview</h2>
        <p className="text-muted-foreground">Track your client's training progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkouts}</div>
            <p className="text-xs text-muted-foreground">
              {completedWorkouts.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Of scheduled workouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedWorkouts.length > 0 ? 'Good' : 'Starting'}
            </div>
            <p className="text-xs text-muted-foreground">
              Training adherence
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {completedWorkouts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-workouts">No completed workouts yet</p>
          ) : (
            <div className="space-y-4">
              {completedWorkouts.slice(0, 5).map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-workout-${workout.id}`}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium">Workout Session</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(workout.scheduledDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {workout.durationMinutes && (
                      <p className="text-sm font-medium">{workout.durationMinutes} min</p>
                    )}
                    {workout.caloriesBurned && (
                      <p className="text-sm text-muted-foreground">{workout.caloriesBurned} cal</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
