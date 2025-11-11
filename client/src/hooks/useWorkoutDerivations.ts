import { useMemo } from "react";
import type { Workout } from "@/contexts/ProgramBuilderContext";
import { computeWorkoutDuration } from "@shared/workoutDuration";
import { computeWorkoutPatterns } from "@shared/movementPatternTracker";
import { mapWorkoutExercisesToDuration } from "@shared/workoutAdapters";
import type { MovementPattern } from "@shared/constants";

export interface WorkoutMetadata {
  duration: number;
  patterns: Set<MovementPattern>;
}

/**
 * Creates a stable signature for a workout's exercises to detect actual changes
 * Only recalculates when exercises actually change, not on every render
 */
function serializeWorkoutExercises(workout: Workout): string {
  return JSON.stringify(
    workout.exercises.map((ex) => ({
      id: ex.exerciseId || ex.customExerciseId,
      sets: ex.sets,
      reps: ex.reps,
      restSeconds: ex.restSeconds,
      tempo: ex.tempo,
    }))
  );
}

/**
 * Custom hook to derive workout metadata (duration + patterns) efficiently
 * Uses Map-based memoization with structural hashing to avoid unnecessary recalculations
 * 
 * @param workouts - Array of workouts from program builder state
 * @param allExercises - Exercise database for pattern lookup
 * @returns Map from workout.id to {duration, patterns}
 */
export function useWorkoutDerivations(
  workouts: Workout[],
  allExercises: any[]
): Map<string, WorkoutMetadata> {
  // Create stable primitive key from workout exercise signatures
  // Only changes when actual exercise data changes, not on name/ordering edits
  const exerciseSignatureKey = useMemo(
    () => workouts.map((w) => `${w.id}:${serializeWorkoutExercises(w)}`).join('|'),
    [workouts]
  );
  
  // Separate key for allExercises to track exercise database changes
  // Include movementPattern to detect catalog attribute changes
  const exercisesKey = useMemo(
    () => allExercises.map(e => `${e.id}:${e.movementPattern || ''}`).join('|'),
    [allExercises]
  );

  // Build metadata map - only recomputes when primitive signature keys change
  // NOTE: workouts and allExercises are intentionally NOT in deps to avoid recompute on reference change
  const metadataMap = useMemo(() => {
    const map = new Map<string, WorkoutMetadata>();

    for (const workout of workouts) {
      const duration = computeWorkoutDuration(mapWorkoutExercisesToDuration(workout.exercises));
      const patterns = computeWorkoutPatterns(workout.exercises, allExercises);

      map.set(workout.id, { duration, patterns });
    }

    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseSignatureKey, exercisesKey]);

  return metadataMap;
}
