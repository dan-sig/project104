import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  ArrowLeft,
  Search,
  Clock,
} from "lucide-react";
import { useProgramBuilder, type Workout, type WorkoutExercise } from "@/contexts/ProgramBuilderContext";
import { computeWorkoutDuration, formatWorkoutDuration } from "@shared/workoutDuration";

interface WorkoutBuilderProps {
  onNext: () => void;
  onBack: () => void;
}

export default function WorkoutBuilder({ onNext, onBack }: WorkoutBuilderProps) {
  const { state, dispatch, allExercises, isLoadingExercises } = useProgramBuilder();
  const [openWorkoutId, setOpenWorkoutId] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddWorkout = () => {
    const newWorkout: Workout = {
      id: `workout-${Date.now()}`,
      weekNumber: 1,
      dayNumber: state.workouts.length + 1,
      workoutName: `Workout ${state.workouts.length + 1}`,
      description: null,
      movementFocus: null,
      estimatedDuration: 60,
      orderIndex: state.workouts.length,
      exercises: [],
    };
    dispatch({ type: "ADD_WORKOUT", payload: newWorkout });
    setOpenWorkoutId(newWorkout.id);
  };

  const handleAddExercise = (workoutId: string, exercise: any) => {
    const workout = state.workouts.find(w => w.id === workoutId);
    if (!workout) return;

    const newExercise: WorkoutExercise = {
      id: `exercise-${Date.now()}-${Math.random()}`,
      exerciseId: exercise.customExerciseId ? null : exercise.id,
      customExerciseId: exercise.customExerciseId || null,
      exerciseName: exercise.name,
      sets: 3,
      reps: "10",
      weight: null,
      tempo: "2-0-2-0",
      restSeconds: 90,
      targetRPE: 7,
      targetRIR: 3,
      notes: null,
      orderIndex: workout.exercises.length,
    };

    dispatch({ type: "ADD_EXERCISE_TO_WORKOUT", payload: { workoutId, exercise: newExercise } });
  };

  const filteredExercises = allExercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.movementPattern && ex.movementPattern.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Build Your Workouts</CardTitle>
          <CardDescription>
            Add workouts and configure exercises for your program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleAddWorkout}
            variant="outline"
            className="w-full"
            data-testid="button-add-workout"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Workout
          </Button>

          {state.workouts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No workouts yet. Click "Add Workout" to get started.
            </div>
          )}

          <div className="space-y-4">
            {state.workouts.map((workout, index) => (
              <Collapsible
                key={workout.id}
                open={openWorkoutId === workout.id}
                onOpenChange={(open) => setOpenWorkoutId(open ? workout.id : null)}
              >
                <Card>
                  <CollapsibleTrigger className="w-full" data-testid={`button-workout-toggle-${index}`}>
                    <div className="flex items-center justify-between p-4 hover-elevate">
                      <div className="flex items-center gap-3">
                        <ChevronDown className="h-4 w-4" />
                        <div className="text-left">
                          <p className="font-semibold">{workout.workoutName}</p>
                          <p className="text-sm text-muted-foreground">
                            {workout.exercises.length} exercises • {workout.estimatedDuration} min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => dispatch({ type: "MOVE_WORKOUT_UP", payload: workout.id })}
                          disabled={index === 0}
                          data-testid={`button-move-up-${index}`}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => dispatch({ type: "MOVE_WORKOUT_DOWN", payload: workout.id })}
                          disabled={index === state.workouts.length - 1}
                          data-testid={`button-move-down-${index}`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => dispatch({ type: "DELETE_WORKOUT", payload: workout.id })}
                          data-testid={`button-delete-workout-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent data-testid={`workout-content-${index}`}>
                    <div className="p-4 pt-0 space-y-4 border-t">
                      {/* Workout Details */}
                      {editingWorkout === workout.id ? (
                        <div className="space-y-3">
                          <div>
                            <Label>Workout Name</Label>
                            <Input
                              value={workout.workoutName}
                              onChange={(e) =>
                                dispatch({
                                  type: "UPDATE_WORKOUT",
                                  payload: { id: workout.id, updates: { workoutName: e.target.value } },
                                })
                              }
                              data-testid="input-workout-name"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={workout.description || ""}
                              onChange={(e) =>
                                dispatch({
                                  type: "UPDATE_WORKOUT",
                                  payload: { id: workout.id, updates: { description: e.target.value || null } },
                                })
                              }
                              rows={2}
                              data-testid="input-workout-description"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Week #</Label>
                              <Input
                                type="number"
                                min="1"
                                value={workout.weekNumber}
                                onChange={(e) =>
                                  dispatch({
                                    type: "UPDATE_WORKOUT",
                                    payload: { id: workout.id, updates: { weekNumber: parseInt(e.target.value) } },
                                  })
                                }
                                data-testid="input-week-number"
                              />
                            </div>
                            <div>
                              <Label>Day #</Label>
                              <Input
                                type="number"
                                min="1"
                                value={workout.dayNumber}
                                onChange={(e) =>
                                  dispatch({
                                    type: "UPDATE_WORKOUT",
                                    payload: { id: workout.id, updates: { dayNumber: parseInt(e.target.value) } },
                                  })
                                }
                                data-testid="input-day-number"
                              />
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingWorkout(null)}
                            data-testid="button-done-editing"
                          >
                            Done
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingWorkout(workout.id)}
                          data-testid={`button-edit-workout-${index}`}
                        >
                          <Edit className="h-3 w-3 mr-2" />
                          Edit Workout Details
                        </Button>
                      )}

                      {/* Exercises List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Exercises</Label>
                          <Sheet>
                            <SheetTrigger asChild data-testid={`button-open-exercise-picker-${index}`}>
                              <Button size="sm" variant="outline" data-testid={`button-add-exercise-${index}`}>
                                <Plus className="h-3 w-3 mr-2" />
                                Add Exercise
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                              <SheetHeader>
                                <SheetTitle>Select Exercise</SheetTitle>
                                <SheetDescription>
                                  Choose from system exercises or your custom exercises
                                </SheetDescription>
                              </SheetHeader>
                              <div className="mt-4 space-y-4">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search exercises..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                    data-testid="input-search-exercises"
                                  />
                                </div>

                                {isLoadingExercises ? (
                                  <p className="text-center text-muted-foreground py-4">Loading exercises...</p>
                                ) : (
                                  <div className="space-y-2">
                                    {filteredExercises.map((exercise) => (
                                      <Button
                                        key={exercise.id}
                                        variant="outline"
                                        className="w-full justify-start h-auto py-3"
                                        onClick={() => {
                                          handleAddExercise(workout.id, exercise);
                                        }}
                                        data-testid={`button-select-exercise-${exercise.id}`}
                                      >
                                        <div className="text-left">
                                          <p className="font-medium">{exercise.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {exercise.movementPattern}
                                            {exercise.customExerciseId && " • Custom"}
                                          </p>
                                        </div>
                                      </Button>
                                    ))}
                                    {filteredExercises.length === 0 && (
                                      <p className="text-center text-muted-foreground py-4">No exercises found</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </SheetContent>
                          </Sheet>
                        </div>

                        {workout.exercises.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No exercises added yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {workout.exercises.map((exercise, exIndex) => (
                              <Card key={exercise.id} className="p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 space-y-2">
                                    <p className="font-medium text-sm">{exercise.exerciseName}</p>
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                          <Label className="text-xs">Sets</Label>
                                          <Input
                                            type="number"
                                            value={exercise.sets}
                                            onChange={(e) =>
                                              dispatch({
                                                type: "UPDATE_EXERCISE",
                                                payload: {
                                                  workoutId: workout.id,
                                                  exerciseId: exercise.id,
                                                  updates: { sets: parseInt(e.target.value) },
                                                },
                                              })
                                            }
                                            className="h-8"
                                            data-testid={`input-sets-${exIndex}`}
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Reps</Label>
                                          <Input
                                            value={exercise.reps}
                                            onChange={(e) =>
                                              dispatch({
                                                type: "UPDATE_EXERCISE",
                                                payload: {
                                                  workoutId: workout.id,
                                                  exerciseId: exercise.id,
                                                  updates: { reps: e.target.value },
                                                },
                                              })
                                            }
                                            className="h-8"
                                            data-testid={`input-reps-${exIndex}`}
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Rest (s)</Label>
                                          <Input
                                            type="number"
                                            value={exercise.restSeconds}
                                            onChange={(e) =>
                                              dispatch({
                                                type: "UPDATE_EXERCISE",
                                                payload: {
                                                  workoutId: workout.id,
                                                  exerciseId: exercise.id,
                                                  updates: { restSeconds: parseInt(e.target.value) },
                                                },
                                              })
                                            }
                                            className="h-8"
                                            data-testid={`input-rest-${exIndex}`}
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                          <Label className="text-xs">RPE (1-10)</Label>
                                          <Input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={exercise.targetRPE ?? ""}
                                            onChange={(e) =>
                                              dispatch({
                                                type: "UPDATE_EXERCISE",
                                                payload: {
                                                  workoutId: workout.id,
                                                  exerciseId: exercise.id,
                                                  updates: { targetRPE: e.target.value ? parseInt(e.target.value) : null },
                                                },
                                              })
                                            }
                                            className="h-8"
                                            placeholder="Optional"
                                            data-testid={`input-rpe-${exIndex}`}
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">RIR (0-5)</Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            max="5"
                                            value={exercise.targetRIR ?? ""}
                                            onChange={(e) =>
                                              dispatch({
                                                type: "UPDATE_EXERCISE",
                                                payload: {
                                                  workoutId: workout.id,
                                                  exerciseId: exercise.id,
                                                  updates: { targetRIR: e.target.value ? parseInt(e.target.value) : null },
                                                },
                                              })
                                            }
                                            className="h-8"
                                            placeholder="Optional"
                                            data-testid={`input-rir-${exIndex}`}
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Tempo</Label>
                                          <Input
                                            value={exercise.tempo ?? ""}
                                            onChange={(e) =>
                                              dispatch({
                                                type: "UPDATE_EXERCISE",
                                                payload: {
                                                  workoutId: workout.id,
                                                  exerciseId: exercise.id,
                                                  updates: { tempo: e.target.value || null },
                                                },
                                              })
                                            }
                                            className="h-8"
                                            placeholder="e.g. 3-1-2-0"
                                            data-testid={`input-tempo-${exIndex}`}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() =>
                                        dispatch({ type: "MOVE_EXERCISE_UP", payload: { workoutId: workout.id, exerciseId: exercise.id } })
                                      }
                                      disabled={exIndex === 0}
                                      className="h-7 w-7"
                                      data-testid={`button-exercise-up-${exIndex}`}
                                    >
                                      <ChevronUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() =>
                                        dispatch({ type: "MOVE_EXERCISE_DOWN", payload: { workoutId: workout.id, exerciseId: exercise.id } })
                                      }
                                      disabled={exIndex === workout.exercises.length - 1}
                                      className="h-7 w-7"
                                      data-testid={`button-exercise-down-${exIndex}`}
                                    >
                                      <ChevronDown className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() =>
                                        dispatch({ type: "DELETE_EXERCISE", payload: { workoutId: workout.id, exerciseId: exercise.id } })
                                      }
                                      className="h-7 w-7"
                                      data-testid={`button-delete-exercise-${exIndex}`}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={onBack} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={onNext} disabled={state.workouts.length === 0} data-testid="button-next">
              Next: Set Pricing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
