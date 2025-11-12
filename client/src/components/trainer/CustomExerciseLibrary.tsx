import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, ExternalLink, Dumbbell, Upload } from "lucide-react";
import { CustomExerciseDrawer } from "./CustomExerciseDrawer";
import type { TrainerCustomExercise, InsertTrainerCustomExercise } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CustomExerciseLibraryProps {
  trainerId: string;
}

export function CustomExerciseLibrary({ trainerId }: CustomExerciseLibraryProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<TrainerCustomExercise | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [requestingExercise, setRequestingExercise] = useState<TrainerCustomExercise | null>(null);
  const [justification, setJustification] = useState("");
  const { toast } = useToast();

  const { data: exercises = [], isLoading, isError } = useQuery<TrainerCustomExercise[]>({
    queryKey: ["/api/trainer/custom-exercises", trainerId],
    queryFn: async () => {
      const response = await fetch(`/api/trainer/custom-exercises/${trainerId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch custom exercises');
      }
      return response.json();
    },
    enabled: !!trainerId, // Only fetch when trainerId is available
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTrainerCustomExercise) => {
      return apiRequest("/api/trainer/custom-exercises", {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<TrainerCustomExercise>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/custom-exercises", trainerId] });
      toast({
        title: "Exercise created",
        description: "Your custom exercise has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create exercise. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTrainerCustomExercise> }) => {
      return apiRequest(`/api/trainer/custom-exercises/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }) as Promise<TrainerCustomExercise>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/custom-exercises", trainerId] });
      toast({
        title: "Exercise updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update exercise. Please try again.",
        variant: "destructive",
      });
    },
  });

  const requestMasterDbMutation = useMutation({
    mutationFn: async (data: { customExerciseId: string; exerciseName: string; justification: string }) => {
      return apiRequest("/api/trainer/exercise-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Request submitted",
        description: "Your exercise has been submitted for review. We'll notify you when it's reviewed.",
      });
      setRequestingExercise(null);
      setJustification("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = async (data: InsertTrainerCustomExercise) => {
    try {
      if (editingExercise) {
        await updateMutation.mutateAsync({ id: editingExercise.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setEditingExercise(null);
    } catch (error) {
      // Error toast already shown by mutation handlers
      throw error; // Re-throw to keep drawer open
    }
  };

  const handleEdit = (exercise: TrainerCustomExercise) => {
    setEditingExercise(exercise);
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setEditingExercise(null);
    setDrawerOpen(true);
  };

  const handleRequestMasterDb = (exercise: TrainerCustomExercise) => {
    setRequestingExercise(exercise);
    setJustification("");
  };

  const handleSubmitRequest = () => {
    if (!requestingExercise) return;
    
    requestMasterDbMutation.mutate({
      customExerciseId: requestingExercise.id,
      exerciseName: requestingExercise.name,
      justification,
    });
  };

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.movementPattern.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Exercise Library</CardTitle>
              <CardDescription>
                Create and manage your custom exercises for program building
              </CardDescription>
            </div>
            <Button onClick={handleCreate} data-testid="button-create-custom-exercise">
              <Plus className="h-4 w-4 mr-2" />
              Create Exercise
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises by name or movement pattern..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-exercises"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading exercises...
              </div>
            ) : isError ? (
              <div className="text-center py-12 border-2 border-destructive rounded-lg bg-destructive/10">
                <p className="text-destructive font-semibold mb-2">Error loading exercises</p>
                <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? "No exercises found" : "No custom exercises yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try a different search term"
                    : "Create your first custom exercise to build unique programs"}
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreate} data-testid="button-create-first-exercise">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Exercise
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="grid gap-4">
                  {filteredExercises.map((exercise) => (
                    <Card key={exercise.id} className="hover-elevate" data-testid={`card-exercise-${exercise.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base mb-1" data-testid={`text-exercise-name-${exercise.id}`}>
                              {exercise.name}
                            </CardTitle>
                            {exercise.description && (
                              <CardDescription className="line-clamp-2">
                                {exercise.description}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRequestMasterDb(exercise)}
                              data-testid={`button-request-master-${exercise.id}`}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(exercise)}
                              data-testid={`button-edit-exercise-${exercise.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {exercise.movementPattern.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {exercise.exerciseCategory.charAt(0).toUpperCase() + exercise.exerciseCategory.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {exercise.trackingType.charAt(0).toUpperCase() + exercise.trackingType.slice(1)}
                          </Badge>
                        </div>

                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground min-w-24">Primary:</span>
                            <div className="flex flex-wrap gap-1">
                              {exercise.primaryMuscles.map((muscle) => (
                                <Badge key={muscle} variant="secondary" className="text-xs">
                                  {muscle.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground min-w-24">Secondary:</span>
                              <div className="flex flex-wrap gap-1">
                                {exercise.secondaryMuscles.map((muscle) => (
                                  <Badge key={muscle} variant="outline" className="text-xs">
                                    {muscle.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Equipment:</span>
                          <div className="flex flex-wrap gap-1">
                            {exercise.equipment.map((equip) => (
                              <Badge key={equip} variant="outline" className="text-xs">
                                {equip.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {exercise.videoUrl && (
                          <div className="pt-2">
                            <a
                              href={exercise.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                              data-testid={`link-video-${exercise.id}`}
                            >
                              View Demo Video
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {exercise.formTips && exercise.formTips.length > 0 && (
                          <div className="pt-2 border-t space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">Form Tips:</p>
                            <ul className="text-xs space-y-1 pl-4">
                              {exercise.formTips.map((tip, idx) => (
                                <li key={idx} className="list-disc">{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!requestingExercise} onOpenChange={(open) => !open && setRequestingExercise(null)}>
        <AlertDialogContent data-testid="dialog-request-master">
          <AlertDialogHeader>
            <AlertDialogTitle>Request to Add Exercise to Master Database</AlertDialogTitle>
            <AlertDialogDescription>
              Submit a request to have this exercise reviewed and potentially added to Morphit's master exercise database. This allows all users to benefit from your exercise.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2">
            <label htmlFor="justification" className="text-sm font-medium">
              Justification
            </label>
            <Textarea
              id="justification"
              placeholder="Explain why this exercise should be added to the master database..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              data-testid="textarea-justification"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRequestingExercise(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitRequest}
              disabled={!justification.trim() || requestMasterDbMutation.isPending}
              data-testid="button-submit-request"
            >
              {requestMasterDbMutation.isPending ? "Submitting..." : "Submit Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CustomExerciseDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingExercise(null);
        }}
        onSave={handleSave}
        trainerId={trainerId}
        editingExercise={editingExercise}
      />
    </div>
  );
}
