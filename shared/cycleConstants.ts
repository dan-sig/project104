// ==========================================
// FOCUS CYCLE CONSTANTS
// ==========================================
// Defines training parameters for each of the 4 Focus Cycles
// All cycles use the same foundational programming (10 movement patterns)
// but apply different training parameters

export type FocusCycle = 'flow' | 'build' | 'strong' | 'move';

export type CycleParameters = {
  tempo: string;           // Exercise tempo (eccentric-pause-concentric)
  rpeRange: [number, number];  // RPE range (Rate of Perceived Exertion, 1-10)
  restSeconds: {           // Rest periods by exercise type
    power: number;
    compound: number;
    isolation: number;
    core: number;
  };
  setsRepsRanges: {        // Sets and reps by EXERCISE ROLE and experience level
    'primary-compound': {
      beginner: { sets: number; repsRange: [number, number] };
      intermediate: { sets: number; repsRange: [number, number] };
      advanced: { sets: number; repsRange: [number, number] };
    };
    'secondary-compound': {
      beginner: { sets: number; repsRange: [number, number] };
      intermediate: { sets: number; repsRange: [number, number] };
      advanced: { sets: number; repsRange: [number, number] };
    };
    isolation: {
      beginner: { sets: number; repsRange: [number, number] };
      intermediate: { sets: number; repsRange: [number, number] };
      advanced: { sets: number; repsRange: [number, number] };
    };
    'core-accessory': {
      beginner: { sets: number; repsRange: [number, number] };
      intermediate: { sets: number; repsRange: [number, number] };
      advanced: { sets: number; repsRange: [number, number] };
    };
  };
};

// ==========================================
// CYCLE PARAMETER SPECIFICATIONS
// ==========================================

export const CYCLE_PARAMETERS: Record<FocusCycle, CycleParameters> = {
  // FLOW: Mobility + Stability focus
  // Emphasis on controlled movements, lower intensity, steady-state cardio
  flow: {
    tempo: '4-1-2',  // Slow eccentric (4s), pause (1s), moderate concentric (2s)
    rpeRange: [5, 6], // Lower intensity - should feel moderate
    restSeconds: {
      power: 45,      // Shorter rest (mobility focus, not maximal power)
      compound: 45,
      isolation: 45,
      core: 30,
    },
    setsRepsRanges: {
      'primary-compound': {
        beginner: { sets: 2, repsRange: [12, 15] },
        intermediate: { sets: 3, repsRange: [12, 15] },
        advanced: { sets: 3, repsRange: [12, 15] },
      },
      'secondary-compound': {
        beginner: { sets: 2, repsRange: [12, 15] },
        intermediate: { sets: 3, repsRange: [12, 15] },
        advanced: { sets: 3, repsRange: [12, 15] },
      },
      isolation: {
        beginner: { sets: 2, repsRange: [15, 20] },
        intermediate: { sets: 2, repsRange: [15, 20] },
        advanced: { sets: 3, repsRange: [15, 20] },
      },
      'core-accessory': {
        beginner: { sets: 2, repsRange: [15, 20] },
        intermediate: { sets: 2, repsRange: [15, 20] },
        advanced: { sets: 3, repsRange: [15, 20] },
      },
    },
  },

  // BUILD: Hypertrophy focus
  // Emphasis on muscle growth, time under tension, minimal HIIT
  build: {
    tempo: '2-1-1',  // Controlled eccentric (2s), pause (1s), explosive concentric (1s)
    rpeRange: [7, 8], // Moderate-high intensity - should feel challenging
    restSeconds: {
      power: 90,       // Moderate rest for hypertrophy
      compound: 90,
      isolation: 60,
      core: 45,
    },
    setsRepsRanges: {
      'primary-compound': {
        beginner: { sets: 3, repsRange: [8, 10] },
        intermediate: { sets: 4, repsRange: [8, 10] },
        advanced: { sets: 4, repsRange: [8, 10] },
      },
      'secondary-compound': {
        beginner: { sets: 3, repsRange: [10, 12] },
        intermediate: { sets: 4, repsRange: [10, 12] },
        advanced: { sets: 4, repsRange: [10, 12] },
      },
      isolation: {
        beginner: { sets: 2, repsRange: [12, 15] },
        intermediate: { sets: 3, repsRange: [12, 15] },
        advanced: { sets: 3, repsRange: [12, 15] },
      },
      'core-accessory': {
        beginner: { sets: 2, repsRange: [15, 20] },
        intermediate: { sets: 3, repsRange: [15, 20] },
        advanced: { sets: 3, repsRange: [15, 20] },
      },
    },
  },

  // STRONG: Maximal strength focus
  // Emphasis on heavy loads, fast tempos, longer rest, more power work
  strong: {
    tempo: '2-0-X',  // Controlled eccentric (2s), no pause, explosive concentric (as fast as possible)
    rpeRange: [8, 9], // High intensity - should feel very challenging
    restSeconds: {
      power: 150,      // Longer rest for full recovery
      compound: 150,
      isolation: 120,
      core: 60,
    },
    setsRepsRanges: {
      'primary-compound': {
        beginner: { sets: 3, repsRange: [4, 6] },
        intermediate: { sets: 4, repsRange: [4, 6] },
        advanced: { sets: 5, repsRange: [3, 5] },
      },
      'secondary-compound': {
        beginner: { sets: 3, repsRange: [6, 8] },
        intermediate: { sets: 4, repsRange: [6, 8] },
        advanced: { sets: 4, repsRange: [6, 8] },
      },
      isolation: {
        beginner: { sets: 2, repsRange: [10, 12] },
        intermediate: { sets: 3, repsRange: [10, 12] },
        advanced: { sets: 3, repsRange: [10, 12] },
      },
      'core-accessory': {
        beginner: { sets: 2, repsRange: [12, 15] },
        intermediate: { sets: 3, repsRange: [12, 15] },
        advanced: { sets: 3, repsRange: [12, 15] },
      },
    },
  },

  // MOVE: Longevity + balanced training
  // Emphasis on overall fitness, varied cardio, sustainable intensity
  move: {
    tempo: '3-1-1',  // Moderate eccentric (3s), pause (1s), controlled concentric (1s)
    rpeRange: [7, 7], // Consistent moderate intensity
    restSeconds: {
      power: 90,       // Moderate rest for balanced training
      compound: 90,
      isolation: 60,
      core: 45,
    },
    setsRepsRanges: {
      'primary-compound': {
        beginner: { sets: 3, repsRange: [8, 10] },
        intermediate: { sets: 3, repsRange: [8, 10] },
        advanced: { sets: 4, repsRange: [8, 10] },
      },
      'secondary-compound': {
        beginner: { sets: 3, repsRange: [10, 12] },
        intermediate: { sets: 3, repsRange: [10, 12] },
        advanced: { sets: 4, repsRange: [10, 12] },
      },
      isolation: {
        beginner: { sets: 2, repsRange: [12, 15] },
        intermediate: { sets: 2, repsRange: [12, 15] },
        advanced: { sets: 3, repsRange: [12, 15] },
      },
      'core-accessory': {
        beginner: { sets: 2, repsRange: [15, 20] },
        intermediate: { sets: 2, repsRange: [15, 20] },
        advanced: { sets: 3, repsRange: [15, 20] },
      },
    },
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export function getCycleParameters(focusCycle: string | null | undefined): CycleParameters {
  const normalized = (focusCycle?.toLowerCase() || 'move') as FocusCycle;
  return CYCLE_PARAMETERS[normalized] || CYCLE_PARAMETERS.move;
}

export function getExerciseRestPeriod(
  focusCycle: string | null | undefined,
  exerciseType: 'power' | 'compound' | 'isolation' | 'core'
): number {
  const params = getCycleParameters(focusCycle);
  return params.restSeconds[exerciseType];
}

export function getSetsAndReps(
  focusCycle: string | null | undefined,
  exerciseRole: 'primary-compound' | 'secondary-compound' | 'isolation' | 'core-accessory',
  experienceLevel: string | null | undefined
): { sets: number; repsRange: [number, number] } {
  const params = getCycleParameters(focusCycle);
  const level = (experienceLevel?.toLowerCase() || 'beginner') as 'beginner' | 'intermediate' | 'advanced';
  const roleRanges = params.setsRepsRanges[exerciseRole];
  return roleRanges[level] || roleRanges.beginner;
}
