import type { WorkoutExercise } from "@/contexts/ProgramBuilderContext";
import type { ExerciseForDuration } from "./workoutDuration";

/**
 * Convert WorkoutExercise (UI state) to ExerciseForDuration (utility input)
 * Handles parsing string reps into numeric format for duration calculations
 * 
 * @param exercises - Array of workout exercises from UI state
 * @returns Array of exercises formatted for duration calculation
 */
export function mapWorkoutExercisesToDuration(exercises: WorkoutExercise[]): ExerciseForDuration[] {
  return exercises.map((exercise) => {
    const { sets, reps, restSeconds, tempo } = exercise;
    
    // Parse reps string to determine if it's a range or fixed value
    let repsMin: number | null = null;
    let repsMax: number | null = null;
    let fixedReps: number | null = null;
    
    if (reps && reps.trim() !== "") {
      // Check if it's a range (e.g., "8-12")
      if (reps.includes("-")) {
        const parts = reps.split("-").map(p => parseInt(p.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          repsMin = parts[0];
          repsMax = parts[1];
        } else {
          // Invalid range format, default to 10
          fixedReps = 10;
        }
      } else {
        // Fixed rep count (e.g., "10")
        const parsed = parseInt(reps.trim(), 10);
        if (!isNaN(parsed)) {
          fixedReps = parsed;
        } else {
          // Invalid number, default to 10
          fixedReps = 10;
        }
      }
    } else {
      // No reps specified, default to 10
      fixedReps = 10;
    }
    
    return {
      sets,
      repsMin,
      repsMax,
      reps: fixedReps,
      restSeconds,
      tempo,
      equipment: null, // Can be added if needed for equipment transitions
    };
  });
}
