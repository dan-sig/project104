// ==========================================
// FOCUS CYCLE CONSTANTS WITH 4-WEEK MICROCYCLE PROGRESSION
// ==========================================
// Defines training parameters for each of the 4 Focus Cycles across 4 weeks
// All cycles follow the same 4-week pattern: Learn → Load → Push → Deload
// Each week has different volume, intensity, tempo, and rest parameters

export type FocusCycle = 'flow' | 'build' | 'strong' | 'move';
export type WeekTheme = 'Learn' | 'Load' | 'Push' | 'Deload';

// Map week numbers (1-4) to themes
export const WEEK_THEMES: Record<number, WeekTheme> = {
  1: 'Learn',
  2: 'Load',
  3: 'Push',
  4: 'Deload',
};

// Cycle metadata for UI display
export const CYCLE_INFO: Record<FocusCycle, { name: string; tagline: string; description: string; focus: string }> = {
  flow: {
    name: 'Morphit Flow',
    tagline: 'Move freely, control completely.',
    description: 'Restore range, coordination, and end-range control',
    focus: 'Mobility + Stability',
  },
  build: {
    name: 'Morphit Build',
    tagline: 'Shape, strengthen, solidify.',
    description: 'Increase lean muscle and volume tolerance',
    focus: 'Hypertrophy',
  },
  strong: {
    name: 'Morphit Strong',
    tagline: 'Power through precision.',
    description: 'Maximize force production and neural drive',
    focus: 'Strength',
  },
  move: {
    name: 'Morphit Move',
    tagline: 'Train for life, not just today.',
    description: 'Maintain long-term performance and health',
    focus: 'Longevity / Balanced',
  },
};

// Week-specific parameters for a single week
export type WeekParameters = {
  theme: WeekTheme;
  tempo: string;
  rpe: number;
  rir: number;
  restSeconds: {
    power: number;
    compound: number;
    isolation: number;
    core: number;
  };
  setsReps: {
    power: { sets: number; repsRange: [number, number] };
    compound: { sets: number; repsRange: [number, number] };
    isolation: { sets: number; repsRange: [number, number] };
  };
  notes: string;
};

// Complete 4-week cycle definition
export type CycleDefinition = {
  week1: WeekParameters;
  week2: WeekParameters;
  week3: WeekParameters;
  week4: WeekParameters;
};

// ==========================================
// FLOW CYCLE: Mobility + Stability
// ==========================================
const FLOW_CYCLE: CycleDefinition = {
  week1: {
    theme: 'Learn',
    tempo: '4-1-2',
    rpe: 5,
    rir: 5,
    restSeconds: { power: 45, compound: 45, isolation: 45, core: 30 },
    setsReps: {
      power: { sets: 2, repsRange: [10, 10] },
      compound: { sets: 2, repsRange: [12, 12] },
      isolation: { sets: 2, repsRange: [15, 15] },
    },
    notes: 'Fluid motion, breathing focus',
  },
  week2: {
    theme: 'Load',
    tempo: '3-1-2',
    rpe: 6,
    rir: 4,
    restSeconds: { power: 60, compound: 60, isolation: 45, core: 30 },
    setsReps: {
      power: { sets: 3, repsRange: [8, 8] },
      compound: { sets: 3, repsRange: [10, 10] },
      isolation: { sets: 2, repsRange: [12, 12] },
    },
    notes: 'Add mild load or offset',
  },
  week3: {
    theme: 'Push',
    tempo: '2-1-2',
    rpe: 7,
    rir: 3,
    restSeconds: { power: 45, compound: 45, isolation: 45, core: 30 },
    setsReps: {
      power: { sets: 3, repsRange: [8, 8] },
      compound: { sets: 3, repsRange: [8, 8] },
      isolation: { sets: 2, repsRange: [10, 10] },
    },
    notes: 'End-range control, steady tempo',
  },
  week4: {
    theme: 'Deload',
    tempo: '3-1-3',
    rpe: 5,
    rir: 5,
    restSeconds: { power: 60, compound: 60, isolation: 45, core: 30 },
    setsReps: {
      power: { sets: 2, repsRange: [10, 10] },
      compound: { sets: 2, repsRange: [12, 12] },
      isolation: { sets: 2, repsRange: [15, 15] },
    },
    notes: 'Reset pattern, easy flow',
  },
};

// ==========================================
// BUILD CYCLE: Hypertrophy
// ==========================================
const BUILD_CYCLE: CycleDefinition = {
  week1: {
    theme: 'Learn',
    tempo: '3-1-2',
    rpe: 6,
    rir: 4,
    restSeconds: { power: 60, compound: 60, isolation: 60, core: 45 },
    setsReps: {
      power: { sets: 3, repsRange: [8, 8] },
      compound: { sets: 3, repsRange: [10, 12] },
      isolation: { sets: 2, repsRange: [15, 15] },
    },
    notes: 'Controlled eccentric, pump focus',
  },
  week2: {
    theme: 'Load',
    tempo: '2-1-1',
    rpe: 7,
    rir: 3,
    restSeconds: { power: 90, compound: 90, isolation: 60, core: 45 },
    setsReps: {
      power: { sets: 3, repsRange: [8, 8] },
      compound: { sets: 4, repsRange: [10, 10] },
      isolation: { sets: 3, repsRange: [12, 12] },
    },
    notes: 'Add load, maintain rhythm',
  },
  week3: {
    theme: 'Push',
    tempo: '2-0-X',
    rpe: 8,
    rir: 2,
    restSeconds: { power: 60, compound: 60, isolation: 60, core: 45 },
    setsReps: {
      power: { sets: 3, repsRange: [6, 8] },
      compound: { sets: 4, repsRange: [8, 10] },
      isolation: { sets: 3, repsRange: [10, 10] },
    },
    notes: 'Peak tension, minimal rest',
  },
  week4: {
    theme: 'Deload',
    tempo: '3-1-1',
    rpe: 6,
    rir: 4,
    restSeconds: { power: 90, compound: 90, isolation: 60, core: 45 },
    setsReps: {
      power: { sets: 2, repsRange: [10, 10] },
      compound: { sets: 2, repsRange: [10, 12] },
      isolation: { sets: 2, repsRange: [12, 15] },
    },
    notes: 'Reduce fatigue, keep feel',
  },
};

// ==========================================
// STRONG CYCLE: Maximal Strength
// ==========================================
const STRONG_CYCLE: CycleDefinition = {
  week1: {
    theme: 'Learn',
    tempo: '3-1-1',
    rpe: 6,
    rir: 4,
    restSeconds: { power: 120, compound: 120, isolation: 90, core: 60 },
    setsReps: {
      power: { sets: 3, repsRange: [5, 5] },
      compound: { sets: 3, repsRange: [6, 6] },
      isolation: { sets: 2, repsRange: [10, 10] },
    },
    notes: 'Submaximal, technical precision',
  },
  week2: {
    theme: 'Load',
    tempo: '2-1-1',
    rpe: 7,
    rir: 3,
    restSeconds: { power: 150, compound: 150, isolation: 120, core: 60 },
    setsReps: {
      power: { sets: 4, repsRange: [5, 5] },
      compound: { sets: 4, repsRange: [6, 6] },
      isolation: { sets: 3, repsRange: [8, 8] },
    },
    notes: 'Progressive overload',
  },
  week3: {
    theme: 'Push',
    tempo: '2-0-X',
    rpe: 8,
    rir: 2,
    restSeconds: { power: 150, compound: 150, isolation: 120, core: 60 },
    setsReps: {
      power: { sets: 5, repsRange: [4, 4] },
      compound: { sets: 5, repsRange: [5, 5] },
      isolation: { sets: 3, repsRange: [6, 6] },
    },
    notes: 'Peak neural intensity',
  },
  week4: {
    theme: 'Deload',
    tempo: '3-1-1',
    rpe: 6,
    rir: 4,
    restSeconds: { power: 90, compound: 90, isolation: 90, core: 60 },
    setsReps: {
      power: { sets: 2, repsRange: [5, 5] },
      compound: { sets: 2, repsRange: [5, 5] },
      isolation: { sets: 2, repsRange: [10, 10] },
    },
    notes: 'Low stress, fast recovery',
  },
};

// ==========================================
// MOVE CYCLE: Longevity / Balanced
// ==========================================
const MOVE_CYCLE: CycleDefinition = {
  week1: {
    theme: 'Learn',
    tempo: '3-1-1',
    rpe: 6,
    rir: 4,
    restSeconds: { power: 60, compound: 60, isolation: 60, core: 45 },
    setsReps: {
      power: { sets: 3, repsRange: [10, 10] },
      compound: { sets: 3, repsRange: [10, 10] },
      isolation: { sets: 3, repsRange: [12, 12] },
    },
    notes: 'Baseline Morphit default',
  },
  week2: {
    theme: 'Load',
    tempo: '2-1-1',
    rpe: 7,
    rir: 3,
    restSeconds: { power: 90, compound: 90, isolation: 60, core: 45 },
    setsReps: {
      power: { sets: 3, repsRange: [8, 8] },
      compound: { sets: 4, repsRange: [8, 8] },
      isolation: { sets: 3, repsRange: [10, 10] },
    },
    notes: 'Add intent or load',
  },
  week3: {
    theme: 'Push',
    tempo: '2-0-X',
    rpe: 8,
    rir: 2,
    restSeconds: { power: 60, compound: 60, isolation: 60, core: 45 },
    setsReps: {
      power: { sets: 3, repsRange: [6, 6] },
      compound: { sets: 4, repsRange: [6, 6] },
      isolation: { sets: 3, repsRange: [8, 8] },
    },
    notes: 'Power focus, maintain control',
  },
  week4: {
    theme: 'Deload',
    tempo: '3-1-1',
    rpe: 6,
    rir: 4,
    restSeconds: { power: 90, compound: 90, isolation: 60, core: 45 },
    setsReps: {
      power: { sets: 2, repsRange: [10, 10] },
      compound: { sets: 2, repsRange: [10, 10] },
      isolation: { sets: 2, repsRange: [10, 10] },
    },
    notes: 'Smooth deload, quality movement',
  },
};

// ==========================================
// MASTER CYCLE DATA
// ==========================================
export const CYCLE_DATA: Record<FocusCycle, CycleDefinition> = {
  flow: FLOW_CYCLE,
  build: BUILD_CYCLE,
  strong: STRONG_CYCLE,
  move: MOVE_CYCLE,
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get the week theme for a given week number
 */
export function getWeekTheme(weekNumber: number): WeekTheme {
  const normalizedWeek = ((weekNumber - 1) % 4) + 1; // Ensure 1-4 range
  return WEEK_THEMES[normalizedWeek];
}

/**
 * Get week parameters for a specific cycle and week
 */
export function getWeekParameters(
  focusCycle: string | null | undefined,
  weekInCycle: number | null | undefined
): WeekParameters {
  const normalized = (focusCycle?.toLowerCase() || 'move') as FocusCycle;
  const normalizedWeek = Math.max(1, Math.min(4, weekInCycle || 1));
  const cycleData = CYCLE_DATA[normalized] || CYCLE_DATA.move;
  const weekKey = `week${normalizedWeek}` as 'week1' | 'week2' | 'week3' | 'week4';
  return cycleData[weekKey];
}

/**
 * Get exercise rest period based on cycle, week, and exercise type
 */
export function getExerciseRestPeriod(
  focusCycle: string | null | undefined,
  weekInCycle: number | null | undefined,
  exerciseType: 'power' | 'compound' | 'isolation' | 'core'
): number {
  const params = getWeekParameters(focusCycle, weekInCycle);
  return params.restSeconds[exerciseType];
}

/**
 * Get sets and reps for a specific exercise type based on cycle and week
 */
export function getSetsAndReps(
  focusCycle: string | null | undefined,
  weekInCycle: number | null | undefined,
  exerciseType: 'power' | 'compound' | 'isolation'
): { sets: number; repsRange: [number, number] } {
  const params = getWeekParameters(focusCycle, weekInCycle);
  return params.setsReps[exerciseType];
}

/**
 * Get tempo for current cycle and week
 */
export function getTempo(
  focusCycle: string | null | undefined,
  weekInCycle: number | null | undefined
): string {
  const params = getWeekParameters(focusCycle, weekInCycle);
  return params.tempo;
}

/**
 * Get RPE for current cycle and week
 */
export function getRPE(
  focusCycle: string | null | undefined,
  weekInCycle: number | null | undefined
): number {
  const params = getWeekParameters(focusCycle, weekInCycle);
  return params.rpe;
}

/**
 * Get RIR (Reps In Reserve) for current cycle and week
 */
export function getRIR(
  focusCycle: string | null | undefined,
  weekInCycle: number | null | undefined
): number {
  const params = getWeekParameters(focusCycle, weekInCycle);
  return params.rir;
}

/**
 * LEGACY: Get cycle parameters (for backwards compatibility)
 * Returns week 2 (Load) parameters as a reasonable default
 */
export function getCycleParameters(focusCycle: string | null | undefined) {
  const params = getWeekParameters(focusCycle, 2);
  return {
    tempo: params.tempo,
    rpeRange: [params.rpe, params.rpe] as [number, number],
    restSeconds: params.restSeconds,
    setsRepsRanges: {
      'primary-compound': {
        beginner: params.setsReps.compound,
        intermediate: params.setsReps.compound,
        advanced: params.setsReps.compound,
      },
      'secondary-compound': {
        beginner: params.setsReps.compound,
        intermediate: params.setsReps.compound,
        advanced: params.setsReps.compound,
      },
      isolation: {
        beginner: params.setsReps.isolation,
        intermediate: params.setsReps.isolation,
        advanced: params.setsReps.isolation,
      },
      'core-accessory': {
        beginner: { sets: 2, repsRange: [15, 20] as [number, number] },
        intermediate: { sets: 3, repsRange: [15, 20] as [number, number] },
        advanced: { sets: 3, repsRange: [15, 20] as [number, number] },
      },
    },
  };
}
