import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTrainerData } from "@/contexts/TrainerDataContext";
import { Calendar, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { WorkoutDetail } from "./WorkoutDetail";
import { formatDistanceToNow } from "date-fns";

interface ClientProgramProps {
  clientId: string;
}

export function ClientProgram({ clientId }: ClientProgramProps) {
  const { getClientWorkouts } = useTrainerData();
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const workouts = getClientWorkouts(clientId);

  if (selectedWorkoutId) {
    const workout = workouts.find(w => w.id === selectedWorkoutId);
    if (workout) {
      return (
        <WorkoutDetail
          workout={workout}
          clientId={clientId}
          onBack={() => setSelectedWorkoutId(null)}
        />
      );
    }
  }

  if (workouts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No program assigned yet</p>
          <Button className="mt-4">Create Program</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Training Program</h2>
          <p className="text-muted-foreground">Click on any workout to view details and make adjustments</p>
        </div>
        <Button>Edit Program</Button>
      </div>

      <div className="grid gap-4">
        {workouts.map((workout) => (
          <Card
            key={workout.id}
            className="hover-elevate cursor-pointer"
            onClick={() => setSelectedWorkoutId(workout.id)}
            data-testid={`card-workout-${workout.id}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {workout.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle>{workout.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(workout.scheduledDate).toLocaleDateString()} - {
                          workout.completed 
                            ? `Completed ${formatDistanceToNow(new Date(workout.scheduledDate), { addSuffix: true })}`
                            : 'Scheduled'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant={workout.completed ? 'default' : 'outline'}>
                      {workout.exercises.length} exercises
                    </Badge>
                    {workout.duration && (
                      <p className="text-sm text-muted-foreground mt-1">{workout.duration} min</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            {workout.clientNotes && (
              <CardContent>
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Client notes:</span> {workout.clientNotes}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
