import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertTriangle, ThumbsDown, Weight, Edit } from "lucide-react";
import type { MockWorkout } from "@/data/trainerMockData";
import { useState } from "react";

interface WorkoutDetailProps {
  workout: MockWorkout;
  clientId: string;
  onBack: () => void;
}

export function WorkoutDetail({ workout, clientId, onBack }: WorkoutDetailProps) {
  const [editingExercise, setEditingExercise] = useState<string | null>(null);

  const getFeedbackIcon = (type?: 'pain' | 'dislike' | 'too_heavy') => {
    switch (type) {
      case 'pain':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'dislike':
        return <ThumbsDown className="h-4 w-4 text-warning" />;
      case 'too_heavy':
        return <Weight className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          data-testid="button-back-to-program"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{workout.name}</h2>
          <p className="text-muted-foreground">
            {new Date(workout.scheduledDate).toLocaleDateString()} - {workout.completed ? 'Completed' : 'Scheduled'}
          </p>
        </div>
      </div>

      {workout.clientNotes && (
        <Card className="bg-muted/50 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm">
              <span className="font-medium">Client Notes:</span> {workout.clientNotes}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exercises</h3>
        {workout.exercises.map((exercise, index) => (
          <Card key={exercise.id} className={exercise.hasFeedback ? 'border-warning' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    <CardTitle className="text-lg">{exercise.name}</CardTitle>
                    {exercise.hasFeedback && (
                      <div className="flex items-center gap-1">
                        {getFeedbackIcon(exercise.feedbackType)}
                        <Badge variant="outline" className="border-warning text-warning">
                          Needs attention
                        </Badge>
                      </div>
                    )}
                  </div>
                  {exercise.notes && (
                    <p className="text-sm text-destructive mt-1">{exercise.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingExercise(editingExercise === exercise.id ? null : exercise.id)}
                  data-testid={`button-edit-exercise-${exercise.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingExercise === exercise.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Sets</label>
                      <Input type="number" defaultValue={exercise.sets} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Reps</label>
                      <Input defaultValue={exercise.reps} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Weight</label>
                      <Input defaultValue={exercise.weight} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Rest (sec)</label>
                      <Input type="number" defaultValue={exercise.restSeconds} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">Save Changes</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingExercise(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sets</p>
                    <p className="font-medium">{exercise.sets}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reps</p>
                    <p className="font-medium">{exercise.reps}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Weight</p>
                    <p className="font-medium">{exercise.weight}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rest</p>
                    <p className="font-medium">{exercise.restSeconds}s</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
