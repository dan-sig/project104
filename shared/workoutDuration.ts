// ==========================================
// WORKOUT DURATION CALCULATOR
// ==========================================
// Calculates total workout duration based on exercises, sets, reps, rest, and tempo
// Used by both server (persistence) and client (live updates)
// ==========================================

// Default equipment transition time in seconds
export const DEFAULT_EQUIPMENT_TRANSITION_TIME = 45;

/**
 * Parse tempo string to total seconds per rep
 * Tempo format: "eccentric-pause-concentric-pause" (e.g., "3-1-2-0")
 * 
 * @param tempo - Tempo string (e.g., "3-1-2-0")
 * @returns Total seconds per rep
 */
export function parseTempoToSeconds(tempo: string | null | undefined): number {
  if (!tempo || tempo.trim() === "") {
    // Default tempo: 3-0-1-0 (3 sec eccentric, 1 sec concentric) = 4 seconds
    return 4;
  }

  const parts = tempo.split("-").map(p => parseInt(p.trim(), 10));
  
  if (parts.length !== 4 || parts.some(isNaN)) {
    // Invalid format, return default
    return 4;
  }

  // Sum all phases
  return parts.reduce((sum, val) => sum + val, 0);
}

/**
 * Exercise data structure for duration calculation
 */
export interface ExerciseForDuration {
  sets: number;
  reps: number;
  restTime: number; // in seconds
  tempo: string | null | undefined;
  equipmentType?: string | null;
}

/**
 * Calculate total workout duration from exercises
 * 
 * @param exercises - Array of exercises with sets, reps, rest, tempo
 * @param transitionTime - Time (seconds) to switch equipment between exercises
 * @returns Total workout duration in seconds
 */
export function computeWorkoutDuration(
  exercises: ExerciseForDuration[],
  transitionTime: number = DEFAULT_EQUIPMENT_TRANSITION_TIME
): number {
  if (!exercises || exercises.length === 0) {
    return 0;
  }

  let totalSeconds = 0;
  let previousEquipment: string | null | undefined = null;

  for (const exercise of exercises) {
    // Calculate time under tension
    const tempoSeconds = parseTempoToSeconds(exercise.tempo);
    const timeUnderTension = exercise.sets * exercise.reps * tempoSeconds;
    
    // Calculate rest time (rest between sets, not after last set)
    const totalRestTime = (exercise.sets - 1) * exercise.restTime;
    
    // Add to total
    totalSeconds += timeUnderTension + totalRestTime;
    
    // Add equipment transition time if equipment changes
    if (previousEquipment !== null && exercise.equipmentType !== previousEquipment) {
      totalSeconds += transitionTime;
    }
    
    previousEquipment = exercise.equipmentType;
  }

  return totalSeconds;
}

/**
 * Format duration in seconds to human-readable string
 * 
 * @param seconds - Total duration in seconds
 * @returns Formatted duration string (e.g., "45 minutes", "1 hour 15 minutes")
 */
export function formatWorkoutDuration(seconds: number): string {
  if (seconds === 0) {
    return "0 minutes";
  }

  const totalMinutes = Math.round(seconds / 60);
  
  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
