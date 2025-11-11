import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ProgramBuilderProvider, useProgramBuilder } from "@/contexts/ProgramBuilderContext";
import ProgramBasicInfo from "@/components/trainer/ProgramBasicInfo";
import WorkoutBuilder from "@/components/trainer/WorkoutBuilder";
import ProgramPricing from "@/components/trainer/ProgramPricing";
import { computeWorkoutDuration } from "@shared/workoutDuration";
import { mapWorkoutExercisesToDuration } from "@shared/workoutAdapters";

interface ProgramBuilderProps {
  mode?: "template" | "scratch";
}

function ProgramBuilderContent({ mode }: { mode: "template" | "scratch" }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const { state, isLoadingExercises } = useProgramBuilder();

  // Create program mutation
  const createProgramMutation = useMutation({
    mutationFn: async () => {
      // Get user ID from session
      const userResponse = await fetch("/api/user");
      if (!userResponse.ok) {
        throw new Error("Please log in to create programs");
      }
      const user = await userResponse.json();

      // Prepare program data
      const programData = {
        trainerId: user.id,
        name: state.name,
        description: state.description,
        basedOnTemplate: state.basedOnTemplate,
        difficulty: state.difficulty,
        durationWeeks: state.durationWeeks,
        daysPerWeek: state.daysPerWeek,
        price: state.price,
        pricingType: state.pricingType,
        slug: state.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      };

      // Create the program first
      const program: any = await apiRequest("/api/trainer/programs", "POST", programData);
      
      // Then create workouts and exercises
      if (state.workouts.length > 0) {
        // Transform workouts to match API expectations (remove client-side IDs)
        // Compute actual duration for each workout based on exercises
        const workoutsPayload = state.workouts.map((w) => {
          const exerciseDuration = computeWorkoutDuration(mapWorkoutExercisesToDuration(w.exercises));
          
          return {
            weekNumber: w.weekNumber,
            dayNumber: w.dayNumber,
            workoutName: w.workoutName,
            description: w.description,
            movementFocus: w.movementFocus,
            estimatedDuration: exerciseDuration,
            orderIndex: w.orderIndex,
            exercises: w.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              customExerciseId: e.customExerciseId,
              exerciseName: e.exerciseName,
              sets: e.sets,
              reps: e.reps,
              weight: e.weight,
              tempo: e.tempo,
              restSeconds: e.restSeconds,
              targetRPE: e.targetRPE,
              targetRIR: e.targetRIR,
              notes: e.notes,
              orderIndex: e.orderIndex,
            })),
          };
        });

        await apiRequest(`/api/trainer/programs/${program.id}/workouts`, "POST", {
          workouts: workoutsPayload,
        });
      }
      
      return program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/programs"] });
      toast({
        title: "Program Created",
        description: "Your program has been saved successfully.",
      });
      setLocation("/trainer");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Program",
        description: error.message || "An error occurred while creating the program.",
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    // Validate
    if (!state.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a program name.",
        variant: "destructive",
      });
      return;
    }

    if (state.workouts.length === 0) {
      toast({
        title: "No Workouts",
        description: "Please add at least one workout to your program.",
        variant: "destructive",
      });
      return;
    }

    await createProgramMutation.mutateAsync();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ProgramBasicInfo onNext={() => setCurrentStep(2)} />;
      case 2:
        return <WorkoutBuilder onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />;
      case 3:
        return (
          <ProgramPricing
            onBack={() => setCurrentStep(2)}
            onSave={handleSave}
            isSaving={createProgramMutation.isPending}
          />
        );
      default:
        return null;
    }
  };

  if (isLoadingExercises) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading exercises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/trainer")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {mode === "template" ? "Build from Template" : "Build from Scratch"}
            </h1>
            <p className="text-muted-foreground">Step {currentStep} of 3</p>
          </div>
        </div>

        {renderStep()}
      </div>
    </div>
  );
}

export default function ProgramBuilder({ mode = "scratch" }: ProgramBuilderProps) {
  return (
    <ProgramBuilderProvider initialMode={mode}>
      <ProgramBuilderContent mode={mode} />
    </ProgramBuilderProvider>
  );
}
