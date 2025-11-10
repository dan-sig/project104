import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTrainerData } from "@/contexts/TrainerDataContext";
import { Calendar, CheckCircle2, Circle, ChevronRight, ChevronDown, Edit2 } from "lucide-react";
import { ChangeProgramDialog } from "./ChangeProgramDialog";
import { ExerciseEditorDrawer } from "./ExerciseEditorDrawer";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { MockExercise } from "@/data/trainerMockData";

interface ClientProgramProps {
  clientId: string;
}

export function ClientProgram({ clientId }: ClientProgramProps) {
  const { getClientWorkouts, getClient, updateClientProgram, updateExerciseParams, swapExercise } = useTrainerData();
  const { toast } = useToast();
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [changeProgramOpen, setChangeProgramOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<{
    exercise: MockExercise;
    workoutId: string;
    workoutName: string;
  } | null>(null);
  
  const workouts = getClientWorkouts(clientId);
  const client = getClient(clientId);

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

  const handleProgramChange = (newProgram: string) => {
    updateClientProgram(clientId, newProgram);
    toast({
      title: "Program Updated",
      description: `${client?.name}'s program has been changed to ${newProgram}`,
    });
  };

  const handleExerciseSave = (updates: Partial<MockExercise>) => {
    if (!editingExercise) return;

    if (updates.name && updates.name !== editingExercise.exercise.name) {
      swapExercise(clientId, editingExercise.workoutId, editingExercise.exercise.id, updates.name);
    }

    const paramUpdates = { ...updates };
    delete paramUpdates.name;

    if (Object.keys(paramUpdates).length > 0) {
      updateExerciseParams(clientId, editingExercise.workoutId, editingExercise.exercise.id, paramUpdates);
    }

    toast({
      title: "Exercise Updated",
      description: "Exercise parameters have been saved successfully",
    });
  };

  const toggleWorkoutExpanded = (workoutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedWorkoutId(expandedWorkoutId === workoutId ? null : workoutId);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Training Program</h2>
            <p className="text-muted-foreground">Expand workouts to view and edit exercises</p>
          </div>
          <Button
            onClick={() => setChangeProgramOpen(true)}
            data-testid="button-change-program"
          >
            Change Program
          </Button>
        </div>

        <div className="grid gap-4">
          {workouts.map((workout) => {
            const isExpanded = expandedWorkoutId === workout.id;
            
            return (
              <Card
                key={workout.id}
                data-testid={`card-workout-${workout.id}`}
              >
                <CardHeader
                  className="cursor-pointer hover-elevate"
                  onClick={(e) => toggleWorkoutExpanded(workout.id, e)}
                >
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
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-2">
                    {workout.clientNotes && (
                      <div className="bg-muted/50 p-3 rounded-md mb-4">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Client notes:</span> {workout.clientNotes}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {workout.exercises.map((exercise, idx) => (
                        <div
                          key={exercise.id}
                          className="flex items-center justify-between p-3 rounded-md border hover-elevate cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingExercise({
                              exercise,
                              workoutId: workout.id,
                              workoutName: workout.name
                            });
                          }}
                          data-testid={`exercise-${exercise.id}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{exercise.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {exercise.sets} × {exercise.reps} @ {exercise.weight}
                                {exercise.tempo && ` • Tempo: ${exercise.tempo}`}
                                {exercise.rpe && ` • RPE: ${exercise.rpe}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {exercise.hasFeedback && (
                              <Badge variant="destructive" className="text-xs">
                                {exercise.feedbackType}
                              </Badge>
                            )}
                            <Button size="icon" variant="ghost">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {client && client.currentProgram && (
        <ChangeProgramDialog
          open={changeProgramOpen}
          onOpenChange={setChangeProgramOpen}
          clientName={client.name}
          currentProgram={client.currentProgram}
          onConfirm={handleProgramChange}
        />
      )}

      <ExerciseEditorDrawer
        open={!!editingExercise}
        onOpenChange={(open) => !open && setEditingExercise(null)}
        exercise={editingExercise?.exercise || null}
        workoutName={editingExercise?.workoutName || ''}
        onSave={handleExerciseSave}
      />
    </>
  );
}
