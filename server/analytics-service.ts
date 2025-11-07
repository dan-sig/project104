import { db } from "./db";
import { workoutSessions, workoutSets, programExercises, exercises, workoutPrograms } from "../shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface Level1Metrics {
  totalVolume: number;
  avgRPE: number;
  workDensity: number; // volume per minute
  patternDistribution: Record<string, number>; // % by pattern
  bestSets: Array<{
    exercise: string;
    weight: number;
    reps: number;
    isNewPR: boolean;
  }>;
  sessionDuration: number;
  totalSets: number;
}

export interface Level2Metrics {
  workoutsCompleted: number;
  workoutsPlanned: number;
  adherencePercent: number;
  totalVolumeThisWeek: number;
  totalVolumePreviousWeeks: number[]; // last 4 weeks
  avgRPE: number;
  patternVolumePercent: Record<string, number>;
  currentStreak: number;
  weekNumber: number;
  avgSessionDuration: number; // Average workout duration in minutes
}

export interface Level3Metrics {
  totalWorkCompleted: number;
  cycleProgressionScore: number; // 0-100
  volumePerMinute: number;
  patternBalanceIndex: number; // 100 = perfectly balanced
  rpeDistribution: number[]; // histogram buckets
  bestLifts: Array<{
    exercise: string;
    maxWeight: number;
    maxVolume: number;
    improvement: number;
  }>;
  nextPhaseRecommendation: string;
  cycleNumber: number;
  weeksCompleted: number;
}

export class AnalyticsService {
  /**
   * LEVEL 1: Post-Workout Metrics (Immediate Feedback)
   * Calculates metrics for a single completed workout session
   */
  async calculateLevel1Metrics(userId: string, sessionId: string): Promise<Level1Metrics> {
    // Get session details
    const session = await db
      .select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      ))
      .limit(1);

    if (!session.length) {
      throw new Error("Session not found");
    }

    const sessionData = session[0];

    // Get all completed sets for this session with exercise details
    const sets = await db
      .select({
        weight: workoutSets.weight,
        reps: workoutSets.reps,
        rir: workoutSets.rir,
        exerciseName: exercises.name,
        movementPattern: exercises.movementPattern,
        exerciseCategory: exercises.exerciseCategory,
      })
      .from(workoutSets)
      .innerJoin(programExercises, eq(workoutSets.programExerciseId, programExercises.id))
      .innerJoin(exercises, eq(programExercises.exerciseId, exercises.id))
      .where(and(
        eq(workoutSets.sessionId, sessionId),
        eq(workoutSets.completed, 1)
      ));

    // Calculate total volume
    const totalVolume = sets.reduce((sum: number, set) => {
      return sum + ((set.weight || 0) * (set.reps || 0));
    }, 0);

    // Calculate average RPE (RPE = 10 - RIR)
    const rirValues = sets.filter((s): s is typeof s & { rir: number } => s.rir !== null).map(s => s.rir);
    const avgRPE = rirValues.length > 0
      ? 10 - (rirValues.reduce((sum: number, rir: number) => sum + rir, 0) / rirValues.length)
      : 0;

    // Calculate work density
    const durationMinutes = sessionData.durationMinutes || 1;
    const workDensity = totalVolume / durationMinutes;

    // Calculate pattern distribution
    const patternCounts: Record<string, number> = {};
    const patternVolumes: Record<string, number> = {};
    sets.forEach((set) => {
      const pattern = set.movementPattern;
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      patternVolumes[pattern] = (patternVolumes[pattern] || 0) + ((set.weight || 0) * (set.reps || 0));
    });

    const totalPatternVolume = Object.values(patternVolumes).reduce((sum, vol) => sum + vol, 0);
    const patternDistribution: Record<string, number> = {};
    Object.keys(patternVolumes).forEach(pattern => {
      patternDistribution[pattern] = totalPatternVolume > 0
        ? (patternVolumes[pattern] / totalPatternVolume) * 100
        : 0;
    });

    // Find best sets (top 3 by volume)
    const bestSets = sets
      .map((set) => ({
        exercise: set.exerciseName,
        weight: set.weight || 0,
        reps: set.reps || 0,
        volume: (set.weight || 0) * (set.reps || 0),
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 3)
      .map((set) => ({
        exercise: set.exercise,
        weight: set.weight,
        reps: set.reps,
        isNewPR: false, // TODO: Compare with historical data to detect PRs
      }));

    return {
      totalVolume,
      avgRPE,
      workDensity,
      patternDistribution,
      bestSets,
      sessionDuration: durationMinutes,
      totalSets: sets.length,
    };
  }

  /**
   * LEVEL 2: Weekly Metrics (Progress & Consistency)
   * Calculates metrics for the current week and compares with previous weeks
   */
  async calculateLevel2Metrics(userId: string): Promise<Level2Metrics> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Get current week sessions
    const currentWeekSessions = await db
      .select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        gte(workoutSessions.scheduledDate, weekStart.toISOString().split('T')[0]),
        lte(workoutSessions.scheduledDate, weekEnd.toISOString().split('T')[0]),
        eq(workoutSessions.isArchived, 0)
      ));

    const workoutsPlanned = currentWeekSessions.length;
    const workoutsCompleted = currentWeekSessions.filter((s) => s.status === 'complete').length;
    const adherencePercent = workoutsPlanned > 0 ? (workoutsCompleted / workoutsPlanned) * 100 : 0;

    // Calculate total volume for current week
    const completedSessionIds = currentWeekSessions
      .filter((s) => s.status === 'complete')
      .map((s) => s.id);

    let totalVolumeThisWeek = 0;
    if (completedSessionIds.length > 0) {
      const sets = await db
        .select({
          weight: workoutSets.weight,
          reps: workoutSets.reps,
        })
        .from(workoutSets)
        .where(and(
          sql`${workoutSets.sessionId} IN (${sql.join(completedSessionIds.map((id) => sql`${id}`), sql`, `)})`,
          eq(workoutSets.completed, 1)
        ));

      totalVolumeThisWeek = sets.reduce((sum: number, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
    }

    // Calculate previous 4 weeks volumes
    const totalVolumePreviousWeeks: number[] = [];
    for (let i = 1; i <= 4; i++) {
      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(weekStart.getDate() - (i * 7));
      const prevWeekEnd = new Date(prevWeekStart);
      prevWeekEnd.setDate(prevWeekStart.getDate() + 7);

      const prevWeekSessions = await db
        .select({ id: workoutSessions.id })
        .from(workoutSessions)
        .where(and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.scheduledDate, prevWeekStart.toISOString().split('T')[0]),
          lte(workoutSessions.scheduledDate, prevWeekEnd.toISOString().split('T')[0]),
          eq(workoutSessions.status, 'complete'),
          eq(workoutSessions.isArchived, 0)
        ));

      const prevSessionIds = prevWeekSessions.map((s) => s.id);
      let prevWeekVolume = 0;

      if (prevSessionIds.length > 0) {
        const prevSets = await db
          .select({
            weight: workoutSets.weight,
            reps: workoutSets.reps,
          })
          .from(workoutSets)
          .where(and(
            sql`${workoutSets.sessionId} IN (${sql.join(prevSessionIds.map((id) => sql`${id}`), sql`, `)})`,
            eq(workoutSets.completed, 1)
          ));

        prevWeekVolume = prevSets.reduce((sum: number, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
      }

      totalVolumePreviousWeeks.push(prevWeekVolume);
    }

    // Calculate average RPE for current week
    let avgRPE = 0;
    if (completedSessionIds.length > 0) {
      const sets = await db
        .select({ rir: workoutSets.rir })
        .from(workoutSets)
        .where(and(
          sql`${workoutSets.sessionId} IN (${sql.join(completedSessionIds.map((id) => sql`${id}`), sql`, `)})`,
          eq(workoutSets.completed, 1)
        ));

      const rirValues = sets.filter((s): s is typeof s & { rir: number } => s.rir !== null).map((s) => s.rir);
      avgRPE = rirValues.length > 0
        ? 10 - (rirValues.reduce((sum: number, rir: number) => sum + rir, 0) / rirValues.length)
        : 0;
    }

    // Calculate pattern volume distribution
    const patternVolumes: Record<string, number> = {};
    if (completedSessionIds.length > 0) {
      const sets = await db
        .select({
          weight: workoutSets.weight,
          reps: workoutSets.reps,
          movementPattern: exercises.movementPattern,
        })
        .from(workoutSets)
        .innerJoin(programExercises, eq(workoutSets.programExerciseId, programExercises.id))
        .innerJoin(exercises, eq(programExercises.exerciseId, exercises.id))
        .where(and(
          sql`${workoutSets.sessionId} IN (${sql.join(completedSessionIds.map((id) => sql`${id}`), sql`, `)})`,
          eq(workoutSets.completed, 1)
        ));

      sets.forEach((set) => {
        const pattern = set.movementPattern;
        patternVolumes[pattern] = (patternVolumes[pattern] || 0) + ((set.weight || 0) * (set.reps || 0));
      });
    }

    const totalPatternVolume = Object.values(patternVolumes).reduce((sum, vol) => sum + vol, 0);
    const patternVolumePercent: Record<string, number> = {};
    Object.keys(patternVolumes).forEach(pattern => {
      patternVolumePercent[pattern] = totalPatternVolume > 0
        ? (patternVolumes[pattern] / totalPatternVolume) * 100
        : 0;
    });

    // Calculate average session duration
    const completedSessions = currentWeekSessions.filter((s) => s.status === 'complete');
    const totalDuration = completedSessions.reduce((sum: number, session) => sum + (session.durationMinutes || 0), 0);
    const avgSessionDuration = workoutsCompleted > 0 ? totalDuration / workoutsCompleted : 0;

    // Calculate current streak (consecutive weeks with 100% adherence)
    let currentStreak = 0;
    if (adherencePercent === 100) {
      currentStreak = 1; // Current week counts
      // TODO: Check previous weeks for streak continuation
    }

    return {
      workoutsCompleted,
      workoutsPlanned,
      adherencePercent,
      totalVolumeThisWeek,
      totalVolumePreviousWeeks,
      avgRPE,
      patternVolumePercent,
      currentStreak,
      weekNumber: Math.ceil((now.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)),
      avgSessionDuration,
    };
  }

  /**
   * LEVEL 3: End-of-Phase / Cycle Metrics (Every 4 Weeks)
   * Calculates comprehensive cycle summary and progression recommendations
   */
  async calculateLevel3Metrics(userId: string): Promise<Level3Metrics> {
    // Get user's current program
    const programs = await db
      .select()
      .from(workoutPrograms)
      .where(eq(workoutPrograms.userId, userId))
      .orderBy(desc(workoutPrograms.createdDate))
      .limit(1);

    if (!programs.length) {
      throw new Error("No active program found");
    }

    const program = programs[0];
    const cycleNumber = 1; // TODO: Get from user profile

    // Get all sessions for current cycle (last 4 weeks or entire program)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const cycleSessions = await db
      .select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        gte(workoutSessions.scheduledDate, fourWeeksAgo.toISOString().split('T')[0]),
        eq(workoutSessions.status, 'complete'),
        eq(workoutSessions.isArchived, 0)
      ));

    const sessionIds = cycleSessions.map((s) => s.id);

    // Calculate total work completed
    let totalWorkCompleted = 0;
    if (sessionIds.length > 0) {
      const sets = await db
        .select({
          weight: workoutSets.weight,
          reps: workoutSets.reps,
        })
        .from(workoutSets)
        .where(and(
          sql`${workoutSets.sessionId} IN (${sql.join(sessionIds.map((id) => sql`${id}`), sql`, `)})`,
          eq(workoutSets.completed, 1)
        ));

      totalWorkCompleted = sets.reduce((sum: number, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
    }

    // Calculate total duration
    const totalDuration = cycleSessions.reduce((sum: number, session) => sum + (session.durationMinutes || 0), 0);
    const volumePerMinute = totalDuration > 0 ? totalWorkCompleted / totalDuration : 0;

    // Calculate pattern balance
    const patternVolumes: Record<string, number> = {};
    if (sessionIds.length > 0) {
      const sets = await db
        .select({
          weight: workoutSets.weight,
          reps: workoutSets.reps,
          movementPattern: exercises.movementPattern,
        })
        .from(workoutSets)
        .innerJoin(programExercises, eq(workoutSets.programExerciseId, programExercises.id))
        .innerJoin(exercises, eq(programExercises.exerciseId, exercises.id))
        .where(and(
          sql`${workoutSets.sessionId} IN (${sql.join(sessionIds.map((id) => sql`${id}`), sql`, `)})`,
          eq(workoutSets.completed, 1)
        ));

      sets.forEach((set) => {
        const pattern = set.movementPattern;
        patternVolumes[pattern] = (patternVolumes[pattern] || 0) + ((set.weight || 0) * (set.reps || 0));
      });
    }

    const volumes = Object.values(patternVolumes);
    const minVolume = volumes.length > 0 ? Math.min(...volumes) : 0;
    const maxVolume = volumes.length > 0 ? Math.max(...volumes) : 1;
    const patternBalanceIndex = maxVolume > 0 ? (minVolume / maxVolume) * 100 : 0;

    // Calculate RPE distribution
    const rpeDistribution = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Buckets 0-9
    if (sessionIds.length > 0) {
      const sets = await db
        .select({ rir: workoutSets.rir })
        .from(workoutSets)
        .where(and(
          sql`${workoutSets.sessionId} IN (${sql.join(sessionIds.map((id) => sql`${id}`), sql`, `)})`,
          eq(workoutSets.completed, 1)
        ));

      sets.forEach((set) => {
        if (set.rir !== null) {
          const rpe = Math.min(9, Math.max(0, 10 - set.rir));
          rpeDistribution[rpe]++;
        }
      });
    }

    // Find best lifts
    const bestLifts: Array<{
      exercise: string;
      maxWeight: number;
      maxVolume: number;
      improvement: number;
    }> = [];

    if (sessionIds.length > 0) {
      const exerciseStats = await db
        .select({
          exerciseName: exercises.name,
          weight: workoutSets.weight,
          reps: workoutSets.reps,
        })
        .from(workoutSets)
        .innerJoin(programExercises, eq(workoutSets.programExerciseId, programExercises.id))
        .innerJoin(exercises, eq(programExercises.exerciseId, exercises.id))
        .where(and(
          sql`${workoutSets.sessionId} IN (${sql.join(sessionIds.map((id) => sql`${id}`), sql`, `)})`,
          eq(workoutSets.completed, 1)
        ));

      const exerciseMaxes: Record<string, { maxWeight: number; maxVolume: number }> = {};
      exerciseStats.forEach((stat) => {
        const volume = (stat.weight || 0) * (stat.reps || 0);
        if (!exerciseMaxes[stat.exerciseName]) {
          exerciseMaxes[stat.exerciseName] = { maxWeight: 0, maxVolume: 0 };
        }
        exerciseMaxes[stat.exerciseName].maxWeight = Math.max(exerciseMaxes[stat.exerciseName].maxWeight, stat.weight || 0);
        exerciseMaxes[stat.exerciseName].maxVolume = Math.max(exerciseMaxes[stat.exerciseName].maxVolume, volume);
      });

      bestLifts.push(...Object.entries(exerciseMaxes)
        .sort((a, b) => b[1].maxVolume - a[1].maxVolume)
        .slice(0, 5)
        .map(([name, stats]) => ({
          exercise: name,
          maxWeight: stats.maxWeight,
          maxVolume: stats.maxVolume,
          improvement: 0, // TODO: Compare with previous cycle
        })));
    }

    // Calculate progression score (0-100)
    const adherence = cycleSessions.length / 12; // Assume 12 workouts in 4 weeks (3/week)
    const balanceScore = patternBalanceIndex;
    const cycleProgressionScore = Math.min(100, (adherence * 40) + (balanceScore * 0.6));

    // Generate recommendation
    let nextPhaseRecommendation = "Continue with current programming";
    if (cycleProgressionScore >= 80) {
      nextPhaseRecommendation = "Ready to progress to next phase - increase volume or intensity";
    } else if (cycleProgressionScore < 60) {
      nextPhaseRecommendation = "Focus on consistency and recovery before progressing";
    }

    return {
      totalWorkCompleted,
      cycleProgressionScore,
      volumePerMinute,
      patternBalanceIndex,
      rpeDistribution,
      bestLifts,
      nextPhaseRecommendation,
      cycleNumber,
      weeksCompleted: 4,
    };
  }
}

export const analyticsService = new AnalyticsService();
