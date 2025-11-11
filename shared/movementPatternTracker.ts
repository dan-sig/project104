import { MOVEMENT_PATTERNS, type MovementPattern } from "./constants";

export interface WorkoutExerciseWithPattern {
  exerciseId: string | null;
  customExerciseId: string | null;
  sets: number;
  movementPattern?: string;
}

export interface PatternCoverage {
  pattern: MovementPattern;
  isCovered: boolean;
  exerciseCount: number;
}

export function computeWorkoutPatterns(
  exercises: WorkoutExerciseWithPattern[],
  allExercises: any[]
): Set<MovementPattern> {
  const patterns = new Set<MovementPattern>();
  
  for (const ex of exercises) {
    const exercise = allExercises.find(
      e => (ex.exerciseId && e.id === ex.exerciseId) || 
           (ex.customExerciseId && e.customExerciseId === ex.customExerciseId)
    );
    
    if (exercise?.movementPattern && MOVEMENT_PATTERNS.includes(exercise.movementPattern as MovementPattern)) {
      patterns.add(exercise.movementPattern as MovementPattern);
    }
  }
  
  return patterns;
}

export function computeWeekPatterns(
  workouts: Array<{ exercises: WorkoutExerciseWithPattern[] }>,
  allExercises: any[]
): Set<MovementPattern> {
  const weekPatterns = new Set<MovementPattern>();
  
  for (const workout of workouts) {
    const workoutPatterns = computeWorkoutPatterns(workout.exercises, allExercises);
    workoutPatterns.forEach(pattern => weekPatterns.add(pattern));
  }
  
  return weekPatterns;
}

export function computeProgramPatterns(
  workouts: Array<{ weekNumber: number; exercises: WorkoutExerciseWithPattern[] }>,
  allExercises: any[]
): PatternCoverage[] {
  const programPatterns = new Set<MovementPattern>();
  const patternExerciseCounts = new Map<MovementPattern, number>();
  
  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      const exercise = allExercises.find(
        e => (ex.exerciseId && e.id === ex.exerciseId) || 
             (ex.customExerciseId && e.customExerciseId === ex.customExerciseId)
      );
      
      if (exercise?.movementPattern && MOVEMENT_PATTERNS.includes(exercise.movementPattern as MovementPattern)) {
        const pattern = exercise.movementPattern as MovementPattern;
        programPatterns.add(pattern);
        patternExerciseCounts.set(pattern, (patternExerciseCounts.get(pattern) || 0) + ex.sets);
      }
    }
  }
  
  return MOVEMENT_PATTERNS
    .filter(p => p !== 'cardio')
    .map(pattern => ({
      pattern,
      isCovered: programPatterns.has(pattern),
      exerciseCount: patternExerciseCounts.get(pattern) || 0,
    }));
}

export function getPatternDisplayName(pattern: MovementPattern): string {
  const names: Record<MovementPattern, string> = {
    horizontal_push: "Horizontal Push",
    vertical_push: "Vertical Push",
    horizontal_pull: "Horizontal Pull",
    vertical_pull: "Vertical Pull",
    squat: "Squat",
    lunge: "Lunge",
    hinge: "Hinge",
    core: "Core",
    rotation: "Rotation",
    carry: "Carry",
    cardio: "Cardio",
  };
  
  return names[pattern] || pattern;
}

export function getPatternColor(pattern: MovementPattern): string {
  const colors: Record<MovementPattern, string> = {
    horizontal_push: "bg-blue-500",
    vertical_push: "bg-indigo-500",
    horizontal_pull: "bg-green-500",
    vertical_pull: "bg-emerald-500",
    squat: "bg-purple-500",
    lunge: "bg-pink-500",
    hinge: "bg-orange-500",
    core: "bg-yellow-500",
    rotation: "bg-red-500",
    carry: "bg-teal-500",
    cardio: "bg-gray-500",
  };
  
  return colors[pattern] || "bg-gray-400";
}
