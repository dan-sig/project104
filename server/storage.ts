// ==========================================
// DATABASE STORAGE LAYER
// ==========================================
// This file provides all database operations (CRUD) for Morphit
// Think of it as the "data access layer" - it's the ONLY place that talks to the database
//
// ARCHITECTURE:
// - IStorage interface: Defines all available database operations
// - DbStorage class: Implements operations using Drizzle ORM + PostgreSQL
// - Routes call storage methods (routes.ts → storage.ts → database)
//
// MAIN OPERATION GROUPS:
// 1. User Operations: Get/update user profiles
// 2. Fitness Assessment Operations: Track test results (bodyweight/weights tests)
// 3. Exercise Operations: Manage exercise library (196 exercises)
// 4. Program Operations: Create/manage workout programs (8-week plans)
// 5. Session Operations: Track daily workout sessions (scheduled + completed)
// 6. Set Operations: Track individual exercise sets (actual performance)
// ==========================================

import { 
  type User, 
  type UpsertUser, 
  type FitnessAssessment, 
  type InsertFitnessAssessment,
  type Exercise,
  type InsertExercise,
  type WorkoutProgram,
  type InsertWorkoutProgram,
  type ProgramWorkout,
  type InsertProgramWorkout,
  type ProgramExercise,
  type InsertProgramExercise,
  type WorkoutSession,
  type InsertWorkoutSession,
  type WorkoutSet,
  type InsertWorkoutSet,
  type TrainerCustomExercise,
  type InsertTrainerCustomExercise,
  type TrainerProgram,
  type InsertTrainerProgram,
  type TrainerProgramWorkout,
  type InsertTrainerProgramWorkout,
  type TrainerProgramExercise,
  type InsertTrainerProgramExercise,
  type ProgramPurchase,
  type InsertProgramPurchase,
  type TrainerClient,
  type InsertTrainerClient,
  type TrainerClientRoster,
  type TrainerSalesMetrics,
  type TrainerProfile,
  type InsertTrainerProfile,
  type TrainerDiscountCode,
  type InsertTrainerDiscountCode,
  type TrainerClientInvite,
  type InsertTrainerClientInvite,
  type SupportRequest,
  type InsertSupportRequest,
  type ExerciseRequest,
  type InsertExerciseRequest,
} from "@shared/schema";
import { randomUUID } from "crypto";

// ==========================================
// STORAGE INTERFACE
// ==========================================
// Defines all available database operations
// Any new database operation should be added here first
// ==========================================
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  createFitnessAssessment(assessment: InsertFitnessAssessment): Promise<FitnessAssessment>;
  getUserFitnessAssessments(userId: string): Promise<FitnessAssessment[]>;
  getLatestFitnessAssessment(userId: string): Promise<FitnessAssessment | undefined>;
  getCompleteFitnessProfile(userId: string): Promise<FitnessAssessment | undefined>;
  
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  getExercise(id: string): Promise<Exercise | undefined>;
  getAllExercises(): Promise<Exercise[]>;
  getExercisesByEquipment(equipment: string[]): Promise<Exercise[]>;
  deleteExercise(id: string): Promise<void>;
  
  createWorkoutProgram(program: InsertWorkoutProgram): Promise<WorkoutProgram>;
  getWorkoutProgram(id: string): Promise<WorkoutProgram | undefined>;
  getUserActiveProgram(userId: string): Promise<WorkoutProgram | undefined>;
  getUserPrograms(userId: string): Promise<WorkoutProgram[]>;
  updateWorkoutProgram(id: string, updates: Partial<WorkoutProgram>): Promise<WorkoutProgram | undefined>;
  
  createProgramWorkout(workout: InsertProgramWorkout): Promise<ProgramWorkout>;
  getProgramWorkout(id: string): Promise<ProgramWorkout | undefined>;
  getProgramWorkouts(programId: string): Promise<ProgramWorkout[]>;
  
  createProgramExercise(exercise: InsertProgramExercise): Promise<ProgramExercise>;
  getWorkoutExercises(workoutId: string): Promise<ProgramExercise[]>;
  getProgramExercise(id: string): Promise<ProgramExercise | undefined>;
  updateProgramExercise(id: string, updates: Partial<ProgramExercise>): Promise<ProgramExercise | undefined>;
  
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  createWorkoutSessionsBatch(sessions: InsertWorkoutSession[]): Promise<WorkoutSession[]>;
  getWorkoutSession(id: string): Promise<WorkoutSession | undefined>;
  getSessionByDate(userId: string, scheduledDate: string): Promise<WorkoutSession | undefined>;
  getUserSessions(userId: string): Promise<WorkoutSession[]>;
  getUserSessionsPaginated(userId: string, limit: number, offset: number, startDate?: string, endDate?: string): Promise<{ sessions: WorkoutSession[], total: number }>;
  getTodayCaloriesBurned(userId: string, startDate: Date, endDate: Date): Promise<number>;
  updateWorkoutSession(id: string, updates: Partial<WorkoutSession>): Promise<WorkoutSession | undefined>;
  deleteIncompleteProgramSessions(programId: string): Promise<void>;
  archiveCompletedSessions(userId: string, fromDate: string): Promise<number>;
  deleteIncompleteSessions(userId: string, fromDate: string): Promise<number>;
  cleanupSessionsForRegeneration(userId: string, fromDate: string): Promise<{ archived: number; deleted: number }>;
  removeDuplicateSessions(userId: string): Promise<number>;
  
  createWorkoutSet(set: InsertWorkoutSet): Promise<WorkoutSet>;
  getWorkoutSet(id: string): Promise<WorkoutSet | undefined>;
  getSessionSets(sessionId: string): Promise<WorkoutSet[]>;
  getUserRecentSets(userId: string, exerciseId: string, limit: number): Promise<WorkoutSet[]>;
  updateWorkoutSet(id: string, updates: Partial<WorkoutSet>): Promise<WorkoutSet | undefined>;
  
  createTrainerCustomExercise(exercise: InsertTrainerCustomExercise): Promise<TrainerCustomExercise>;
  getTrainerCustomExercises(trainerId: string): Promise<TrainerCustomExercise[]>;
  getTrainerCustomExercise(id: string): Promise<TrainerCustomExercise | undefined>;
  updateTrainerCustomExercise(id: string, updates: Partial<TrainerCustomExercise>): Promise<TrainerCustomExercise | undefined>;
  
  getTrainerPrograms(trainerId: string): Promise<any[]>; // Returns TrainerProgram with duration stats
  getTrainerProgram(id: string): Promise<TrainerProgram | undefined>;
  createTrainerProgram(program: InsertTrainerProgram): Promise<TrainerProgram>;
  updateTrainerProgram(id: string, updates: Partial<TrainerProgram>): Promise<TrainerProgram | undefined>;
  deleteTrainerProgram(id: string): Promise<void>;
  
  createTrainerProgramWorkout(workout: InsertTrainerProgramWorkout): Promise<TrainerProgramWorkout>;
  getTrainerProgramWorkouts(programId: string): Promise<TrainerProgramWorkout[]>;
  deleteTrainerProgramWorkouts(programId: string): Promise<void>;
  
  createTrainerProgramExercise(exercise: InsertTrainerProgramExercise): Promise<TrainerProgramExercise>;
  getWorkoutExercisesForTrainer(workoutId: string): Promise<TrainerProgramExercise[]>;
  deleteWorkoutExercises(workoutId: string): Promise<void>;
  
  getPublicProgramBySlug(slug: string): Promise<TrainerProgram | undefined>;
  
  createProgramPurchase(purchase: InsertProgramPurchase): Promise<ProgramPurchase>;
  getTrainerPurchases(trainerId: string): Promise<ProgramPurchase[]>;
  getProgramPurchases(programId: string): Promise<ProgramPurchase[]>;
  
  createTrainerClient(client: InsertTrainerClient): Promise<TrainerClient>;
  getTrainerClients(trainerId: string): Promise<TrainerClient[]>;
  getTrainerClientsWithPrograms(trainerId: string): Promise<TrainerClientRoster[]>;
  getTrainerSalesMetrics(trainerId: string): Promise<TrainerSalesMetrics>;
  deleteTrainerClient(connectionId: string): Promise<void>;
  
  getTrainerProfile(userId: string): Promise<TrainerProfile | undefined>;
  getTrainerProfileByUsername(username: string): Promise<TrainerProfile | undefined>;
  createTrainerProfile(profile: InsertTrainerProfile): Promise<TrainerProfile>;
  updateTrainerProfile(userId: string, updates: Partial<TrainerProfile>): Promise<TrainerProfile | undefined>;
  isUsernameTaken(username: string): Promise<boolean>;
  getTrainerClientCount(trainerId: string): Promise<number>;
  getTrainerClientConnection(trainerId: string, clientId: string): Promise<TrainerClient | undefined>;
  getClientTrainerConnection(clientId: string): Promise<TrainerClient | undefined>;
  
  createTrainerDiscountCode(code: InsertTrainerDiscountCode): Promise<TrainerDiscountCode>;
  getTrainerDiscountCodes(trainerId: string): Promise<TrainerDiscountCode[]>;
  getActiveDiscountCodeForTrainer(trainerId: string): Promise<TrainerDiscountCode | undefined>;
  getDiscountCodeByCode(code: string): Promise<TrainerDiscountCode | undefined>;
  redeemDiscountCode(codeId: string, userId: string, purchaseId: string): Promise<void>;
  canTrainerGenerateCode(trainerId: string): Promise<boolean>;
  
  createTrainerClientInvite(invite: InsertTrainerClientInvite): Promise<TrainerClientInvite>;
  getTrainerInvites(trainerId: string): Promise<TrainerClientInvite[]>;
  getClientInvites(clientId: string): Promise<TrainerClientInvite[]>;
  getInviteById(inviteId: string): Promise<TrainerClientInvite | undefined>;
  updateInviteStatus(inviteId: string, status: string, respondedAt?: Date): Promise<TrainerClientInvite | undefined>;
  checkDuplicateInvite(trainerId: string, clientId: string): Promise<TrainerClientInvite | undefined>;
  
  createProgramReview(review: any): Promise<any>;
  getProgramReviews(programId: string): Promise<any[]>;
  getProgramAverageRating(programId: string): Promise<number>;
  canUserReviewProgram(userId: string, programId: string): Promise<boolean>;
  
  createTrainerReview(review: any): Promise<any>;
  getTrainerReviews(trainerId: string): Promise<any[]>;
  getTrainerAverageRating(trainerId: string): Promise<number>;
  canClientReviewTrainer(clientId: string, trainerId: string): Promise<boolean>;
  
  assignProgramToClient(trainerId: string, clientId: string, programId: string, note?: string): Promise<ProgramPurchase>;
  
  createSupportRequest(request: any): Promise<any>;
  getTrainerSupportRequests(trainerId: string): Promise<any[]>;
  
  createExerciseRequest(request: any): Promise<any>;
  getTrainerExerciseRequests(trainerId: string): Promise<any[]>;
  
  getInactiveClients(trainerId: string, daysSinceLastWorkout: number): Promise<Array<{
    clientId: string;
    clientName: string;
    clientEmail: string;
    lastWorkoutDate: string | null;
    daysSinceWorkout: number;
  }>>;
  getPendingInvitesCounts(trainerId: string): Promise<{ sent: number; received: number }>;
  getWorkoutsMissingNotes(trainerId: string): Promise<Array<{
    workoutId: string;
    clientId: string;
    clientName: string;
    scheduledDate: string;
    noteType: 'pre-session' | 'post-session';
  }>>;
  getPerClientAlertSummary(trainerId: string): Promise<Array<{
    clientId: string;
    counts: {
      inactive: number;
      missingPreNotes: number;
      missingPostNotes: number;
    };
    total: number;
  }>>;
  getClientAlertDetail(trainerId: string, clientId: string): Promise<{
    inactiveStatus: {
      isInactive: boolean;
      daysSinceWorkout: number;
      lastWorkoutDate: string | null;
    };
    missingPreNotes: Array<{
      workoutId: string;
      scheduledDate: string;
    }>;
    missingPostNotes: Array<{
      workoutId: string;
      scheduledDate: string;
    }>;
  } | null>;
  
  getUserWorkoutStreak(userId: string): Promise<number>;
  getUnreadTrainerNotes(userId: string): Promise<number>;
  getUnreadTrainerNotesDetail(userId: string): Promise<{
    upcomingNotes: Array<{
      sessionId: string;
      scheduledDate: string;
      workoutName: string;
      notes: string;
    }>;
    pastNotes: Array<{
      sessionId: string;
      scheduledDate: string;
      workoutName: string;
      review: string;
    }>;
  }>;
  getUnreadTrainerNotesSummary(userId: string): Promise<{
    upcomingCount: number;
    pastCount: number;
    nextUpcomingDate?: string;
  }>;
  markNotesAsRead(sessionId: string): Promise<void>;
  getUserPendingInvites(userId: string): Promise<number>;
  getUserProgramStatus(userId: string): Promise<{
    hasActiveProgram: boolean;
    daysRemaining: number | null;
    programName: string | null;
  }>;
  
  createUserSupportRequest(userId: string, request: Omit<InsertSupportRequest, 'userId' | 'trainerId'>): Promise<any>;
  getUserSupportRequests(userId: string): Promise<any[]>;
}


import { db } from "./db";
import { 
  users, 
  fitnessAssessments, 
  exercises, 
  workoutPrograms, 
  programWorkouts, 
  programExercises, 
  workoutSessions, 
  workoutSets,
  trainerCustomExercises,
  trainerPrograms,
  trainerProgramWorkouts,
  trainerProgramExercises,
  programPurchases,
  trainerClients,
  trainerProfiles,
  trainerDiscountCodes,
  trainerClientInvites,
  programReviews,
  trainerReviews,
  supportRequests,
  exerciseRequests,
} from "@shared/schema";
import { eq, desc, and, inArray, gte, lte, or, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// ==========================================
// DATABASE STORAGE IMPLEMENTATION
// ==========================================
// Implements all database operations using Drizzle ORM
// ==========================================

export class DbStorage implements IStorage {
  // ==========================================
  // USER OPERATIONS
  // ==========================================
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // ==========================================
  // FITNESS ASSESSMENT OPERATIONS
  // ==========================================
  // Tracks bodyweight test results (push-ups, squats, mile time)
  // and weights test results (1RMs for major lifts)
  // ==========================================
  async createFitnessAssessment(insertAssessment: InsertFitnessAssessment): Promise<FitnessAssessment> {
    const result = await db.insert(fitnessAssessments).values(insertAssessment).returning();
    return result[0];
  }

  async getUserFitnessAssessments(userId: string): Promise<FitnessAssessment[]> {
    return db.select().from(fitnessAssessments)
      .where(eq(fitnessAssessments.userId, userId))
      .orderBy(desc(fitnessAssessments.testDate));
  }

  async getLatestFitnessAssessment(userId: string): Promise<FitnessAssessment | undefined> {
    const result = await db.select().from(fitnessAssessments)
      .where(eq(fitnessAssessments.userId, userId))
      .orderBy(desc(fitnessAssessments.testDate))
      .limit(1);
    return result[0];
  }

  async getCompleteFitnessProfile(userId: string): Promise<FitnessAssessment | undefined> {
    const assessments = await db.select().from(fitnessAssessments)
      .where(eq(fitnessAssessments.userId, userId))
      .orderBy(desc(fitnessAssessments.testDate));
    
    if (assessments.length === 0) {
      return undefined;
    }
    
    // Get most recent bodyweight test data
    const bodyweightTest = assessments.find(a => a.pushups || a.pullups || a.squats || a.mileTime);
    
    // Get most recent weights test data
    const weightsTest = assessments.find(a => 
      a.squat1rm || a.deadlift1rm || a.benchPress1rm || a.overheadPress1rm || a.barbellRow1rm
    );
    
    // Merge the data, preferring the most recent overall assessment for metadata
    const latestAssessment = assessments[0];
    
    return {
      ...latestAssessment,
      // Override with bodyweight data if available
      pushups: bodyweightTest?.pushups ?? latestAssessment.pushups,
      pullups: bodyweightTest?.pullups ?? latestAssessment.pullups,
      squats: bodyweightTest?.squats ?? latestAssessment.squats,
      mileTime: bodyweightTest?.mileTime ?? latestAssessment.mileTime,
      // Override with weights data if available
      squat1rm: weightsTest?.squat1rm ?? latestAssessment.squat1rm,
      deadlift1rm: weightsTest?.deadlift1rm ?? latestAssessment.deadlift1rm,
      benchPress1rm: weightsTest?.benchPress1rm ?? latestAssessment.benchPress1rm,
      overheadPress1rm: weightsTest?.overheadPress1rm ?? latestAssessment.overheadPress1rm,
      barbellRow1rm: weightsTest?.barbellRow1rm ?? latestAssessment.barbellRow1rm,
    };
  }

  async getFitnessAssessmentById(id: string): Promise<FitnessAssessment | undefined> {
    const result = await db.select().from(fitnessAssessments).where(eq(fitnessAssessments.id, id)).limit(1);
    return result[0];
  }

  async updateFitnessAssessmentOverride(id: string, overrideData: Partial<FitnessAssessment>): Promise<FitnessAssessment | undefined> {
    const result = await db.update(fitnessAssessments).set(overrideData).where(eq(fitnessAssessments.id, id)).returning();
    return result[0];
  }

  // ==========================================
  // EXERCISE OPERATIONS
  // ==========================================
  // Manages the exercise library (196 exercises)
  // Filters by equipment, movement patterns, difficulty
  // ==========================================
  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const result = await db.insert(exercises).values(insertExercise).returning();
    return result[0];
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const result = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
    return result[0];
  }

  async getAllExercises(): Promise<Exercise[]> {
    return db.select().from(exercises);
  }

  async getExercisesByEquipment(equipment: string[]): Promise<Exercise[]> {
    // Database-level filtering using array overlap operator
    // Equipment array includes bodyweight by default since it's always available
    const equipmentWithBodyweight = Array.from(new Set([...equipment, "bodyweight"]));
    
    return db.select()
      .from(exercises)
      .where(sql`${exercises.equipment} && ARRAY[${sql.join(equipmentWithBodyweight.map(eq => sql`${eq}`), sql`, `)}]::text[]`);
  }

  async deleteExercise(id: string): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  // ==========================================
  // PROGRAM OPERATIONS
  // ==========================================
  // Creates and manages workout programs (8-week plans)
  // Programs → ProgramWorkouts → ProgramExercises hierarchy
  // ==========================================
  async createWorkoutProgram(insertProgram: InsertWorkoutProgram): Promise<WorkoutProgram> {
    const result = await db.insert(workoutPrograms).values(insertProgram).returning();
    return result[0];
  }

  async getWorkoutProgram(id: string): Promise<WorkoutProgram | undefined> {
    const result = await db.select().from(workoutPrograms).where(eq(workoutPrograms.id, id)).limit(1);
    return result[0];
  }

  async getUserActiveProgram(userId: string): Promise<WorkoutProgram | undefined> {
    const result = await db.select().from(workoutPrograms)
      .where(and(eq(workoutPrograms.userId, userId), eq(workoutPrograms.isActive, 1)))
      .limit(1);
    return result[0];
  }

  async getUserPrograms(userId: string): Promise<WorkoutProgram[]> {
    return db.select().from(workoutPrograms)
      .where(eq(workoutPrograms.userId, userId))
      .orderBy(desc(workoutPrograms.createdDate));
  }

  async updateWorkoutProgram(id: string, updates: Partial<WorkoutProgram>): Promise<WorkoutProgram | undefined> {
    const result = await db.update(workoutPrograms).set(updates).where(eq(workoutPrograms.id, id)).returning();
    return result[0];
  }

  async createProgramWorkout(insertWorkout: InsertProgramWorkout): Promise<ProgramWorkout> {
    const result = await db.insert(programWorkouts).values(insertWorkout).returning();
    return result[0];
  }

  async getProgramWorkout(id: string): Promise<ProgramWorkout | undefined> {
    const result = await db.select().from(programWorkouts).where(eq(programWorkouts.id, id)).limit(1);
    return result[0];
  }

  async getProgramWorkouts(programId: string): Promise<ProgramWorkout[]> {
    return db.select().from(programWorkouts)
      .where(eq(programWorkouts.programId, programId))
      .orderBy(programWorkouts.dayOfWeek);
  }

  async createProgramExercise(insertExercise: InsertProgramExercise): Promise<ProgramExercise> {
    const result = await db.insert(programExercises).values(insertExercise).returning();
    return result[0];
  }

  async getWorkoutExercises(workoutId: string): Promise<ProgramExercise[]> {
    return db.select().from(programExercises)
      .where(eq(programExercises.workoutId, workoutId))
      .orderBy(programExercises.orderIndex);
  }

  async getProgramExercise(id: string): Promise<ProgramExercise | undefined> {
    const result = await db.select().from(programExercises).where(eq(programExercises.id, id)).limit(1);
    return result[0];
  }

  async updateProgramExercise(id: string, updates: Partial<ProgramExercise>): Promise<ProgramExercise | undefined> {
    const result = await db.update(programExercises).set(updates).where(eq(programExercises.id, id)).returning();
    return result[0];
  }

  // ==========================================
  // WORKOUT SESSION OPERATIONS
  // ==========================================
  // Manages daily workout sessions (scheduled & completed)
  // Includes archival, pagination, calorie tracking
  // ==========================================
  async createWorkoutSession(insertSession: InsertWorkoutSession): Promise<WorkoutSession> {
    // VALIDATION: Prevent NULL scheduledDate to avoid duplicate session bugs
    // NULL dates bypass the unique constraint (userId, scheduledDate, isArchived)
    if (!insertSession.scheduledDate) {
      throw new Error("scheduledDate is required - cannot create session with NULL date");
    }
    
    const result = await db.insert(workoutSessions).values(insertSession).returning();
    return result[0];
  }

  async createWorkoutSessionsBatch(insertSessions: InsertWorkoutSession[]): Promise<WorkoutSession[]> {
    if (insertSessions.length === 0) {
      return [];
    }
    
    // VALIDATION: Prevent NULL scheduledDate to avoid duplicate session bugs
    // NULL dates bypass the unique constraint (userId, scheduledDate, isArchived)
    const invalidSessions = insertSessions.filter(s => !s.scheduledDate);
    if (invalidSessions.length > 0) {
      throw new Error(`Cannot create ${invalidSessions.length} session(s) with NULL scheduledDate`);
    }
    
    const result = await db.insert(workoutSessions).values(insertSessions).returning();
    return result;
  }

  async getWorkoutSession(id: string): Promise<WorkoutSession | undefined> {
    const result = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).limit(1);
    return result[0];
  }

  async getUserSessions(userId: string): Promise<WorkoutSession[]> {
    return db.select().from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.isArchived, 0)
      ))
      .orderBy(desc(workoutSessions.sessionDate));
  }

  async getUserSessionsPaginated(
    userId: string, 
    limit: number, 
    offset: number, 
    startDate?: string, 
    endDate?: string
  ): Promise<{ sessions: WorkoutSession[], total: number }> {
    // Build where conditions - exclude archived sessions
    const conditions = [
      eq(workoutSessions.userId, userId),
      eq(workoutSessions.isArchived, 0)
    ];
    
    if (startDate) {
      conditions.push(gte(workoutSessions.scheduledDate, startDate));
    }
    
    if (endDate) {
      const { lte } = await import("drizzle-orm");
      conditions.push(lte(workoutSessions.scheduledDate, endDate));
    }
    
    // Get paginated sessions
    const sessions = await db.select()
      .from(workoutSessions)
      .where(and(...conditions))
      .orderBy(desc(workoutSessions.sessionDate))
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const { count } = await import("drizzle-orm");
    const totalResult = await db.select({ count: count() })
      .from(workoutSessions)
      .where(and(...conditions));
    
    return {
      sessions,
      total: totalResult[0]?.count || 0
    };
  }

  async getTodayCaloriesBurned(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const sessions = await db.select().from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, 'complete')
      ));
    
    // Filter by date and sum calories
    let totalCalories = 0;
    for (const session of sessions) {
      // Check sessionDate (when workout was actually completed)
      const sessionDateTime = session.sessionDate ? new Date(session.sessionDate) : null;
      if (sessionDateTime && sessionDateTime >= startDate && sessionDateTime < endDate) {
        totalCalories += session.caloriesBurned || 0;
      }
    }
    
    return totalCalories;
  }

  async updateWorkoutSession(id: string, updates: Partial<WorkoutSession>): Promise<WorkoutSession | undefined> {
    const result = await db.update(workoutSessions).set(updates).where(eq(workoutSessions.id, id)).returning();
    return result[0];
  }

  async deleteIncompleteProgramSessions(programId: string): Promise<void> {
    // Get all program workouts for this program
    const programWorkouts = await this.getProgramWorkouts(programId);
    const programWorkoutIds = programWorkouts.map(pw => pw.id);
    
    if (programWorkoutIds.length === 0) {
      return;
    }

    // Delete all incomplete sessions for this program
    const { inArray: inArrayOp } = await import("drizzle-orm");
    await db.delete(workoutSessions)
      .where(and(
        inArrayOp(workoutSessions.programWorkoutId, programWorkoutIds),
        inArrayOp(workoutSessions.status, ['scheduled', 'partial'])
      ));
  }

  async archiveCompletedSessions(userId: string, fromDate: string): Promise<number> {
    // Archive only COMPLETED sessions from the specified date onwards
    // This preserves historical workout data while cleaning up for program regeneration
    // Skip sessions that are already archived to avoid duplicate key constraint violation
    const result = await db.update(workoutSessions)
      .set({ isArchived: 1 })
      .where(and(
        eq(workoutSessions.userId, userId),
        gte(workoutSessions.scheduledDate, fromDate),
        eq(workoutSessions.status, 'complete'),
        eq(workoutSessions.isArchived, 0) // Only archive non-archived sessions
      ))
      .returning();
    
    return result.length;
  }

  async deleteIncompleteSessions(userId: string, fromDate: string): Promise<number> {
    // Delete all INCOMPLETE sessions from the specified date onwards
    // This cleans up pending workouts when regenerating a program
    const { inArray: inArrayOp } = await import("drizzle-orm");
    const result = await db.delete(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        gte(workoutSessions.scheduledDate, fromDate),
        inArrayOp(workoutSessions.status, ['scheduled', 'partial'])
      ))
      .returning();
    
    return result.length;
  }

  async cleanupSessionsForRegeneration(userId: string, fromDate: string): Promise<{ archived: number; deleted: number }> {
    // Three-phase cleanup for program regeneration:
    // 1. DELETE existing archived sessions to avoid unique constraint violations
    // 2. Archive completed sessions to preserve workout history
    // 3. Delete incomplete sessions to make room for new program
    
    // First, delete any already-archived sessions from this date onwards
    // This prevents duplicate key errors when archiving
    await db.delete(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        gte(workoutSessions.scheduledDate, fromDate),
        eq(workoutSessions.isArchived, 1)
      ));
    
    const archived = await this.archiveCompletedSessions(userId, fromDate);
    const deleted = await this.deleteIncompleteSessions(userId, fromDate);
    
    return { archived, deleted };
  }

  async removeDuplicateSessions(userId: string): Promise<number> {
    // Find and remove duplicate sessions for the same date (including NULL dates)
    // Keep the most recent session (by sessionDate timestamp) for each scheduled_date
    
    // Get all non-archived sessions for the user
    const allSessions = await db.select().from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.isArchived, 0)
      ))
      .orderBy(workoutSessions.scheduledDate, desc(workoutSessions.sessionDate));
    
    // Group by scheduled_date to find duplicates (use "NULL" as key for null dates)
    const sessionsByDate = new Map<string, WorkoutSession[]>();
    for (const session of allSessions) {
      const dateKey = session.scheduledDate || "NULL";
      
      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, []);
      }
      sessionsByDate.get(dateKey)!.push(session);
    }
    
    // Find and delete duplicates (keep most recent)
    const idsToDelete: string[] = [];
    for (const [date, sessions] of Array.from(sessionsByDate.entries())) {
      if (sessions.length > 1) {
        // Sort by sessionDate descending (most recent first)
        sessions.sort((a: WorkoutSession, b: WorkoutSession) => {
          const aTime = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
          const bTime = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
          return bTime - aTime;
        });
        
        // Keep the first (most recent), delete the rest
        for (let i = 1; i < sessions.length; i++) {
          idsToDelete.push(sessions[i].id);
        }
        
        console.log(`[DUPLICATE-CLEANUP] Found ${sessions.length} sessions for ${date}, keeping most recent (${sessions[0].id}), removing ${sessions.length - 1} older session(s)`);
      }
    }
    
    // Delete all duplicate sessions in one query
    if (idsToDelete.length > 0) {
      await db.delete(workoutSessions)
        .where(inArray(workoutSessions.id, idsToDelete));
      
      console.log(`[DUPLICATE-CLEANUP] Removed ${idsToDelete.length} duplicate session(s) for user ${userId}`);
    }
    
    return idsToDelete.length;
  }

  async getSessionByDate(userId: string, scheduledDate: string): Promise<WorkoutSession | undefined> {
    // Get the active (non-archived) session for a specific date
    // Ensures only one session per day is returned
    const result = await db.select().from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.scheduledDate, scheduledDate),
        eq(workoutSessions.isArchived, 0)
      ))
      .limit(1);
    
    return result[0];
  }

  // ==========================================
  // WORKOUT SET OPERATIONS
  // ==========================================
  // Tracks individual set completions (actual performance)
  // Records weight, reps, RIR for progressive overload
  // ==========================================
  async createWorkoutSet(insertSet: InsertWorkoutSet): Promise<WorkoutSet> {
    const result = await db.insert(workoutSets).values(insertSet).returning();
    return result[0];
  }

  async getWorkoutSet(id: string): Promise<WorkoutSet | undefined> {
    const result = await db.select().from(workoutSets).where(eq(workoutSets.id, id)).limit(1);
    return result[0];
  }

  async getSessionSets(sessionId: string): Promise<WorkoutSet[]> {
    return db.select().from(workoutSets)
      .where(eq(workoutSets.sessionId, sessionId))
      .orderBy(workoutSets.setNumber);
  }

  async getUserRecentSets(userId: string, exerciseId: string, limit: number): Promise<WorkoutSet[]> {
    // Optimize with database-level JOIN instead of fetching all sessions first
    // This reduces data transfer and filtering on the client side
    return db.select({
      id: workoutSets.id,
      sessionId: workoutSets.sessionId,
      programExerciseId: workoutSets.programExerciseId,
      setNumber: workoutSets.setNumber,
      reps: workoutSets.reps,
      weight: workoutSets.weight,
      durationSeconds: workoutSets.durationSeconds,
      rir: workoutSets.rir,
      completed: workoutSets.completed,
      timestamp: workoutSets.timestamp,
    })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
      .innerJoin(programExercises, eq(workoutSets.programExerciseId, programExercises.id))
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(programExercises.exerciseId, exerciseId),
        eq(workoutSets.completed, 1)
      ))
      .orderBy(desc(workoutSets.timestamp))
      .limit(limit);
  }

  async updateWorkoutSet(id: string, updates: Partial<WorkoutSet>): Promise<WorkoutSet | undefined> {
    const result = await db.update(workoutSets).set(updates).where(eq(workoutSets.id, id)).returning();
    return result[0];
  }

  // ==========================================
  // TRAINER CUSTOM EXERCISE OPERATIONS
  // ==========================================
  async createTrainerCustomExercise(exercise: InsertTrainerCustomExercise): Promise<TrainerCustomExercise> {
    const result = await db.insert(trainerCustomExercises).values(exercise).returning();
    return result[0];
  }

  async getTrainerCustomExercises(trainerId: string): Promise<TrainerCustomExercise[]> {
    return db.select().from(trainerCustomExercises)
      .where(eq(trainerCustomExercises.trainerId, trainerId))
      .orderBy(desc(trainerCustomExercises.createdAt));
  }

  async getTrainerCustomExercise(id: string): Promise<TrainerCustomExercise | undefined> {
    const result = await db.select().from(trainerCustomExercises)
      .where(eq(trainerCustomExercises.id, id))
      .limit(1);
    return result[0];
  }

  async updateTrainerCustomExercise(id: string, updates: Partial<TrainerCustomExercise>): Promise<TrainerCustomExercise | undefined> {
    const result = await db.update(trainerCustomExercises)
      .set(updates)
      .where(eq(trainerCustomExercises.id, id))
      .returning();
    return result[0];
  }


  // ==========================================
  // TRAINER PROGRAM OPERATIONS
  // ==========================================
  async getTrainerPrograms(trainerId: string): Promise<any[]> {
    // Aggregate workout duration stats using raw SQL for better control
    const result = await db.execute(sql`
      SELECT 
        p.*,
        COALESCE(AVG(w.estimated_duration)::integer, 0) as avg_duration,
        COALESCE(SUM(w.estimated_duration)::integer, 0) as total_duration,
        COALESCE(COUNT(w.id)::integer, 0) as workout_count
      FROM trainer_programs p
      LEFT JOIN trainer_program_workouts w ON p.id = w.trainer_program_id
      WHERE p.trainer_id = ${trainerId}
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    
    return result.rows as any[];
  }

  async getTrainerProgram(id: string): Promise<TrainerProgram | undefined> {
    const result = await db.select().from(trainerPrograms)
      .where(eq(trainerPrograms.id, id))
      .limit(1);
    return result[0];
  }

  async createTrainerProgram(program: InsertTrainerProgram): Promise<TrainerProgram> {
    const result = await db.insert(trainerPrograms).values(program).returning();
    return result[0];
  }

  async updateTrainerProgram(id: string, updates: Partial<TrainerProgram>): Promise<TrainerProgram | undefined> {
    const result = await db.update(trainerPrograms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trainerPrograms.id, id))
      .returning();
    return result[0];
  }

  async deleteTrainerProgram(id: string): Promise<void> {
    await db.delete(trainerPrograms).where(eq(trainerPrograms.id, id));
  }

  async getPublicProgramBySlug(slug: string): Promise<TrainerProgram | undefined> {
    const result = await db.select().from(trainerPrograms)
      .where(eq(trainerPrograms.slug, slug))
      .limit(1);
    return result[0];
  }

  // ==========================================
  // PROGRAM PURCHASE OPERATIONS
  // ==========================================
  async createProgramPurchase(purchase: InsertProgramPurchase): Promise<ProgramPurchase> {
    const result = await db.insert(programPurchases).values(purchase).returning();
    return result[0];
  }

  async getTrainerPurchases(trainerId: string): Promise<ProgramPurchase[]> {
    return db.select().from(programPurchases)
      .where(eq(programPurchases.trainerId, trainerId))
      .orderBy(desc(programPurchases.fulfilledAt));
  }

  async getProgramPurchases(programId: string): Promise<ProgramPurchase[]> {
    return db.select().from(programPurchases)
      .where(eq(programPurchases.trainerProgramId, programId))
      .orderBy(desc(programPurchases.fulfilledAt));
  }

  // ==========================================
  // TRAINER CLIENT ROSTER OPERATIONS
  // ==========================================
  async createTrainerClient(client: InsertTrainerClient): Promise<TrainerClient> {
    const result = await db.insert(trainerClients).values(client).returning();
    return result[0];
  }

  async getTrainerClients(trainerId: string): Promise<TrainerClient[]> {
    return db.select().from(trainerClients)
      .where(and(
        eq(trainerClients.trainerId, trainerId),
        eq(trainerClients.status, "active")
      ))
      .orderBy(desc(trainerClients.addedDate));
  }

  async getTrainerClientsWithPrograms(trainerId: string): Promise<TrainerClientRoster[]> {
    // Join trainerClients → users → programPurchases → trainerPrograms → workoutPrograms
    const results = await db
      .select({
        clientId: trainerClients.clientId,
        firstName: users.firstName,
        lastName: users.lastName,
        clientEmail: users.email,
        programId: workoutPrograms.id,
        programName: trainerPrograms.name,
        purchaseDate: programPurchases.fulfilledAt,
        subscriptionType: programPurchases.pricingType,
        purchasePrice: programPurchases.purchasePrice,
        trainerEarnings: programPurchases.trainerEarnings,
        addedDate: trainerClients.addedDate,
      })
      .from(trainerClients)
      .leftJoin(users, eq(trainerClients.clientId, users.id))
      .leftJoin(programPurchases, eq(trainerClients.sourcePurchaseId, programPurchases.id))
      .leftJoin(trainerPrograms, eq(programPurchases.trainerProgramId, trainerPrograms.id))
      .leftJoin(workoutPrograms, eq(programPurchases.workoutProgramId, workoutPrograms.id))
      .where(and(
        eq(trainerClients.trainerId, trainerId),
        eq(trainerClients.status, "active")
      ))
      .orderBy(desc(trainerClients.addedDate));

    return results.map(r => ({
      clientId: r.clientId,
      clientName: [r.firstName, r.lastName].filter(Boolean).join(" ") || "Unknown",
      clientEmail: r.clientEmail || "",
      programId: r.programId,
      programName: r.programName,
      purchaseDate: r.purchaseDate?.toISOString() || new Date().toISOString(),
      subscriptionType: (r.subscriptionType as "one_time" | "subscription") || "one_time",
      purchasePrice: r.purchasePrice || 0,
      trainerEarnings: r.trainerEarnings || 0,
      addedDate: r.addedDate?.toISOString() || new Date().toISOString(),
    }));
  }

  async getTrainerSalesMetrics(trainerId: string): Promise<TrainerSalesMetrics> {
    // Fetch all purchases for this trainer
    const purchases = await db
      .select({
        id: programPurchases.id,
        programName: trainerPrograms.name,
        buyerFirstName: users.firstName,
        buyerLastName: users.lastName,
        buyerEmail: users.email,
        purchasePrice: programPurchases.purchasePrice,
        platformFee: programPurchases.platformFee,
        trainerEarnings: programPurchases.trainerEarnings,
        pricingType: programPurchases.pricingType,
        status: programPurchases.status,
        purchaseDate: programPurchases.fulfilledAt,
      })
      .from(programPurchases)
      .leftJoin(trainerPrograms, eq(programPurchases.trainerProgramId, trainerPrograms.id))
      .leftJoin(users, eq(programPurchases.buyerId, users.id))
      .where(eq(programPurchases.trainerId, trainerId))
      .orderBy(desc(programPurchases.fulfilledAt));

    // Calculate revenue metrics
    const totalRevenue = purchases.reduce((sum, p) => sum + (p.trainerEarnings || 0), 0);
    const monthlyRevenue = purchases
      .filter(p => p.pricingType === "subscription")
      .reduce((sum, p) => sum + (p.trainerEarnings || 0), 0);
    const annualRevenue = monthlyRevenue * 12;
    const totalPurchases = purchases.length;
    const activePlans = purchases.filter(p => p.status === "completed").length;

    return {
      totalRevenue,
      monthlyRevenue,
      annualRevenue,
      totalPurchases,
      activePlans,
      purchases: purchases.map(p => ({
        id: p.id,
        programName: p.programName || "Unknown Program",
        buyerName: [p.buyerFirstName, p.buyerLastName].filter(Boolean).join(" ") || "Unknown",
        buyerEmail: p.buyerEmail || "",
        purchasePrice: p.purchasePrice || 0,
        platformFee: p.platformFee || 0,
        trainerEarnings: p.trainerEarnings || 0,
        pricingType: (p.pricingType as "one_time" | "subscription") || "one_time",
        status: (p.status as "completed" | "refunded") || "completed",
        purchaseDate: p.purchaseDate?.toISOString() || new Date().toISOString(),
      })),
    };
  }

  // ==========================================
  // TRAINER PROGRAM WORKOUT OPERATIONS
  // ==========================================
  async createTrainerProgramWorkout(workout: InsertTrainerProgramWorkout): Promise<TrainerProgramWorkout> {
    const result = await db.insert(trainerProgramWorkouts).values(workout).returning();
    return result[0];
  }

  async getTrainerProgramWorkouts(programId: string): Promise<TrainerProgramWorkout[]> {
    return db.select().from(trainerProgramWorkouts)
      .where(eq(trainerProgramWorkouts.trainerProgramId, programId))
      .orderBy(trainerProgramWorkouts.orderIndex);
  }

  async deleteTrainerProgramWorkouts(programId: string): Promise<void> {
    await db.delete(trainerProgramWorkouts).where(eq(trainerProgramWorkouts.trainerProgramId, programId));
  }

  // ==========================================
  // TRAINER PROGRAM EXERCISE OPERATIONS
  // ==========================================
  async createTrainerProgramExercise(exercise: InsertTrainerProgramExercise): Promise<TrainerProgramExercise> {
    const result = await db.insert(trainerProgramExercises).values(exercise).returning();
    return result[0];
  }

  async getWorkoutExercisesForTrainer(workoutId: string): Promise<TrainerProgramExercise[]> {
    return db.select().from(trainerProgramExercises)
      .where(eq(trainerProgramExercises.trainerWorkoutId, workoutId))
      .orderBy(trainerProgramExercises.orderIndex);
  }

  async deleteWorkoutExercises(workoutId: string): Promise<void> {
    await db.delete(trainerProgramExercises).where(eq(trainerProgramExercises.trainerWorkoutId, workoutId));
  }

  // ==========================================
  // TRAINER PROFILE OPERATIONS
  // ==========================================
  async getTrainerProfile(userId: string): Promise<TrainerProfile | undefined> {
    const result = await db.select().from(trainerProfiles).where(eq(trainerProfiles.userId, userId)).limit(1);
    return result[0];
  }

  async createTrainerProfile(profile: InsertTrainerProfile): Promise<TrainerProfile> {
    const result = await db.insert(trainerProfiles).values(profile).returning();
    return result[0];
  }

  async updateTrainerProfile(userId: string, updates: Partial<TrainerProfile>): Promise<TrainerProfile | undefined> {
    const result = await db
      .update(trainerProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trainerProfiles.userId, userId))
      .returning();
    return result[0];
  }

  async getTrainerProfileByUsername(username: string): Promise<TrainerProfile | undefined> {
    const result = await db
      .select()
      .from(trainerProfiles)
      .where(eq(sql`LOWER(${trainerProfiles.username})`, username.toLowerCase()))
      .limit(1);
    return result[0];
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    const result = await db
      .select({ id: trainerProfiles.id })
      .from(trainerProfiles)
      .where(eq(sql`LOWER(${trainerProfiles.username})`, username.toLowerCase()))
      .limit(1);
    return result.length > 0;
  }

  async getTrainerClientCount(trainerId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(trainerClients)
      .where(and(
        eq(trainerClients.trainerId, trainerId),
        eq(trainerClients.status, "active")
      ));
    return result[0]?.count || 0;
  }

  async getTrainerClientConnection(trainerId: string, clientId: string): Promise<TrainerClient | undefined> {
    const result = await db
      .select()
      .from(trainerClients)
      .where(and(
        eq(trainerClients.trainerId, trainerId),
        eq(trainerClients.clientId, clientId),
        eq(trainerClients.status, "active")
      ))
      .limit(1);
    return result[0];
  }

  async getClientTrainerConnection(clientId: string): Promise<TrainerClient | undefined> {
    const result = await db
      .select()
      .from(trainerClients)
      .where(and(
        eq(trainerClients.clientId, clientId),
        eq(trainerClients.status, "active")
      ))
      .limit(1);
    return result[0];
  }

  async deleteTrainerClient(connectionId: string): Promise<void> {
    // Soft delete: mark as disconnected instead of hard delete
    await db
      .update(trainerClients)
      .set({
        status: "disconnected",
        disconnectedAt: new Date(),
      })
      .where(eq(trainerClients.id, connectionId));
  }

  // ==========================================
  // TRAINER DISCOUNT CODE OPERATIONS
  // ==========================================
  async createTrainerDiscountCode(codeData: InsertTrainerDiscountCode): Promise<TrainerDiscountCode> {
    const result = await db.insert(trainerDiscountCodes).values(codeData).returning();
    return result[0];
  }

  async getTrainerDiscountCodes(trainerId: string): Promise<TrainerDiscountCode[]> {
    return db.select().from(trainerDiscountCodes)
      .where(eq(trainerDiscountCodes.trainerId, trainerId))
      .orderBy(desc(trainerDiscountCodes.createdAt));
  }

  async getActiveDiscountCodeForTrainer(trainerId: string): Promise<TrainerDiscountCode | undefined> {
    const result = await db.select().from(trainerDiscountCodes)
      .where(
        and(
          eq(trainerDiscountCodes.trainerId, trainerId),
          sql`${trainerDiscountCodes.redeemedAt} IS NULL`,
          sql`${trainerDiscountCodes.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(trainerDiscountCodes.createdAt))
      .limit(1);
    return result[0];
  }

  async getDiscountCodeByCode(code: string): Promise<TrainerDiscountCode | undefined> {
    const result = await db.select().from(trainerDiscountCodes)
      .where(eq(trainerDiscountCodes.code, code))
      .limit(1);
    return result[0];
  }

  async redeemDiscountCode(codeId: string, userId: string, purchaseId: string): Promise<void> {
    await db
      .update(trainerDiscountCodes)
      .set({
        redeemedAt: new Date(),
        redeemedBy: userId,
        redeemedByPurchaseId: purchaseId,
      })
      .where(eq(trainerDiscountCodes.id, codeId));
  }

  async canTrainerGenerateCode(trainerId: string): Promise<boolean> {
    // Check if trainer is premium
    const profile = await this.getTrainerProfile(trainerId);
    if (!profile || profile.subscriptionStatus !== "premium") {
      return false;
    }

    // Check if they have downgraded (downgrade disqualifies them)
    if (profile.premiumDowngradedAt) {
      return false;
    }

    // Check if they already have an active (unused, non-expired) code
    const activeCode = await this.getActiveDiscountCodeForTrainer(trainerId);
    if (activeCode) {
      return false;
    }

    // Check if they've generated a code within the last 30 days
    // Compare against EITHER last code creation OR premium join date (whichever is more recent)
    const codes = await db.select().from(trainerDiscountCodes)
      .where(eq(trainerDiscountCodes.trainerId, trainerId))
      .orderBy(desc(trainerDiscountCodes.createdAt))
      .limit(1);

    if (codes.length > 0) {
      const lastCode = codes[0];
      const daysSinceLastCode = Math.floor((Date.now() - lastCode.createdAt!.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastCode < 30) {
        return false;
      }
    } else if (profile.premiumJoinedAt) {
      // No codes yet, check if 30 days have passed since joining premium
      const daysSincePremiumJoin = Math.floor((Date.now() - profile.premiumJoinedAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSincePremiumJoin < 30) {
        return false;
      }
    }

    return true;
  }

  // ==========================================
  // TRAINER CLIENT INVITE OPERATIONS
  // ==========================================
  async createTrainerClientInvite(invite: InsertTrainerClientInvite): Promise<TrainerClientInvite> {
    const result = await db.insert(trainerClientInvites).values(invite).returning();
    return result[0];
  }

  async getTrainerInvites(trainerId: string): Promise<any[]> {
    const trainerUser = alias(users, "trainerUser");
    const clientUser = alias(users, "clientUser");
    
    const results = await db.select({
      id: trainerClientInvites.id,
      trainerId: trainerClientInvites.trainerId,
      clientId: trainerClientInvites.clientId,
      initiatorRole: trainerClientInvites.initiatorRole,
      status: trainerClientInvites.status,
      createdAt: trainerClientInvites.createdAt,
      respondedAt: trainerClientInvites.respondedAt,
      trainerName: sql<string>`CONCAT(${trainerUser.firstName}, ' ', ${trainerUser.lastName})`,
      trainerEmail: trainerUser.email,
      clientName: sql<string>`CONCAT(${clientUser.firstName}, ' ', ${clientUser.lastName})`,
      clientEmail: clientUser.email,
    })
      .from(trainerClientInvites)
      .leftJoin(trainerUser, eq(trainerClientInvites.trainerId, trainerUser.id))
      .leftJoin(clientUser, eq(trainerClientInvites.clientId, clientUser.id))
      .where(eq(trainerClientInvites.trainerId, trainerId))
      .orderBy(desc(trainerClientInvites.createdAt));
    
    // Transform to structured format
    return results.map(r => ({
      id: r.id,
      trainerId: r.trainerId,
      clientId: r.clientId,
      initiatorRole: r.initiatorRole,
      status: r.status,
      createdAt: r.createdAt,
      respondedAt: r.respondedAt,
      initiator: {
        role: r.initiatorRole,
        user: r.initiatorRole === "trainer" 
          ? { id: r.trainerId, name: r.trainerName, email: r.trainerEmail }
          : { id: r.clientId, name: r.clientName, email: r.clientEmail },
      },
      counterpart: {
        role: r.initiatorRole === "trainer" ? "client" as const : "trainer" as const,
        user: r.initiatorRole === "trainer"
          ? { id: r.clientId, name: r.clientName, email: r.clientEmail }
          : { id: r.trainerId, name: r.trainerName, email: r.trainerEmail },
      },
    }));
  }

  async getClientInvites(clientId: string): Promise<any[]> {
    const trainerUser = alias(users, "trainerUser");
    const clientUser = alias(users, "clientUser");
    
    const results = await db.select({
      id: trainerClientInvites.id,
      trainerId: trainerClientInvites.trainerId,
      clientId: trainerClientInvites.clientId,
      initiatorRole: trainerClientInvites.initiatorRole,
      status: trainerClientInvites.status,
      createdAt: trainerClientInvites.createdAt,
      respondedAt: trainerClientInvites.respondedAt,
      trainerName: sql<string>`CONCAT(${trainerUser.firstName}, ' ', ${trainerUser.lastName})`,
      trainerEmail: trainerUser.email,
      clientName: sql<string>`CONCAT(${clientUser.firstName}, ' ', ${clientUser.lastName})`,
      clientEmail: clientUser.email,
    })
      .from(trainerClientInvites)
      .leftJoin(trainerUser, eq(trainerClientInvites.trainerId, trainerUser.id))
      .leftJoin(clientUser, eq(trainerClientInvites.clientId, clientUser.id))
      .where(eq(trainerClientInvites.clientId, clientId))
      .orderBy(desc(trainerClientInvites.createdAt));
    
    // Transform to structured format
    return results.map(r => ({
      id: r.id,
      trainerId: r.trainerId,
      clientId: r.clientId,
      initiatorRole: r.initiatorRole,
      status: r.status,
      createdAt: r.createdAt,
      respondedAt: r.respondedAt,
      initiator: {
        role: r.initiatorRole,
        user: r.initiatorRole === "trainer" 
          ? { id: r.trainerId, name: r.trainerName, email: r.trainerEmail }
          : { id: r.clientId, name: r.clientName, email: r.clientEmail },
      },
      counterpart: {
        role: r.initiatorRole === "trainer" ? "client" as const : "trainer" as const,
        user: r.initiatorRole === "trainer"
          ? { id: r.clientId, name: r.clientName, email: r.clientEmail }
          : { id: r.trainerId, name: r.trainerName, email: r.trainerEmail },
      },
    }));
  }

  async getInviteById(inviteId: string): Promise<TrainerClientInvite | undefined> {
    const result = await db.select().from(trainerClientInvites)
      .where(eq(trainerClientInvites.id, inviteId))
      .limit(1);
    return result[0];
  }

  async updateInviteStatus(inviteId: string, status: string, respondedAt?: Date): Promise<TrainerClientInvite | undefined> {
    const updateData: any = { status };
    
    // Only set respondedAt if provided (for accept/decline, not cancel)
    if (respondedAt) {
      updateData.respondedAt = respondedAt;
    }
    
    const result = await db.update(trainerClientInvites)
      .set(updateData)
      .where(eq(trainerClientInvites.id, inviteId))
      .returning();
    return result[0];
  }

  async checkDuplicateInvite(trainerId: string, clientId: string): Promise<TrainerClientInvite | undefined> {
    const result = await db.select().from(trainerClientInvites)
      .where(and(
        eq(trainerClientInvites.trainerId, trainerId),
        eq(trainerClientInvites.clientId, clientId),
        eq(trainerClientInvites.status, "pending")
      ))
      .limit(1);
    return result[0];
  }

  // ==========================================
  // PROGRAM REVIEW OPERATIONS
  // ==========================================
  async createProgramReview(review: any): Promise<any> {
    const result = await db.insert(programReviews).values(review).returning();
    return result[0];
  }

  async getProgramReviews(programId: string): Promise<any[]> {
    return db.select().from(programReviews)
      .where(and(
        eq(programReviews.programId, programId),
        eq(programReviews.status, "published")
      ))
      .orderBy(desc(programReviews.createdAt));
  }

  async getProgramAverageRating(programId: string): Promise<number> {
    const result = await db.select({
      avgRating: sql<number>`AVG(${programReviews.rating})::float`
    })
    .from(programReviews)
    .where(and(
      eq(programReviews.programId, programId),
      eq(programReviews.status, "published")
    ));
    
    return result[0]?.avgRating || 0;
  }

  async canUserReviewProgram(userId: string, programId: string): Promise<boolean> {
    const purchase = await db.select().from(programPurchases)
      .where(and(
        eq(programPurchases.buyerId, userId),
        eq(programPurchases.trainerProgramId, programId)
      ))
      .limit(1);
    
    if (purchase.length === 0) return false;
    
    const existingReview = await db.select().from(programReviews)
      .where(and(
        eq(programReviews.userId, userId),
        eq(programReviews.programId, programId)
      ))
      .limit(1);
    
    return existingReview.length === 0;
  }

  // ==========================================
  // TRAINER REVIEW OPERATIONS
  // ==========================================
  async createTrainerReview(review: any): Promise<any> {
    const result = await db.insert(trainerReviews).values(review).returning();
    return result[0];
  }

  async getTrainerReviews(trainerId: string): Promise<any[]> {
    return db.select().from(trainerReviews)
      .where(and(
        eq(trainerReviews.trainerId, trainerId),
        eq(trainerReviews.status, "published")
      ))
      .orderBy(desc(trainerReviews.createdAt));
  }

  async getTrainerAverageRating(trainerId: string): Promise<number> {
    const result = await db.select({
      avgRating: sql<number>`AVG(${trainerReviews.rating})::float`
    })
    .from(trainerReviews)
    .where(and(
      eq(trainerReviews.trainerId, trainerId),
      eq(trainerReviews.status, "published")
    ));
    
    return result[0]?.avgRating || 0;
  }

  async canClientReviewTrainer(clientId: string, trainerId: string): Promise<boolean> {
    const connection = await db.select().from(trainerClients)
      .where(and(
        eq(trainerClients.clientId, clientId),
        eq(trainerClients.trainerId, trainerId),
        eq(trainerClients.status, "active")
      ))
      .limit(1);
    
    if (connection.length === 0) return false;
    
    const existingReview = await db.select().from(trainerReviews)
      .where(and(
        eq(trainerReviews.clientId, clientId),
        eq(trainerReviews.trainerId, trainerId)
      ))
      .limit(1);
    
    return existingReview.length === 0;
  }

  // ==========================================
  // PROGRAM ASSIGNMENT OPERATIONS
  // ==========================================
  async assignProgramToClient(trainerId: string, clientId: string, programId: string, note?: string): Promise<ProgramPurchase> {
    const purchase: InsertProgramPurchase = {
      trainerProgramId: programId,
      trainerId,
      buyerId: clientId,
      purchasePrice: 0,
      platformFee: 0,
      trainerEarnings: 0,
      pricingType: "one_time",
      status: "completed",
      isAssigned: 1,
      assignedBy: trainerId,
      assignmentNote: note || null,
      discountCodeId: null,
      discountAmount: null,
      workoutProgramId: null,
    };

    const result = await db.insert(programPurchases).values(purchase).returning();
    return result[0];
  }

  async createSupportRequest(request: InsertSupportRequest): Promise<SupportRequest> {
    const result = await db.insert(supportRequests).values(request).returning();
    return result[0];
  }

  async getTrainerSupportRequests(trainerId: string): Promise<SupportRequest[]> {
    return db.select().from(supportRequests)
      .where(eq(supportRequests.trainerId, trainerId))
      .orderBy(desc(supportRequests.createdAt));
  }

  async createExerciseRequest(request: InsertExerciseRequest): Promise<ExerciseRequest> {
    const result = await db.insert(exerciseRequests).values(request).returning();
    return result[0];
  }

  async getTrainerExerciseRequests(trainerId: string): Promise<ExerciseRequest[]> {
    return db.select().from(exerciseRequests)
      .where(eq(exerciseRequests.trainerId, trainerId))
      .orderBy(desc(exerciseRequests.createdAt));
  }

  // ==========================================
  // TRAINER ALERT OPERATIONS
  // ==========================================
  async getInactiveClients(trainerId: string, daysSinceLastWorkout: number = 7): Promise<Array<{
    clientId: string;
    clientName: string;
    clientEmail: string;
    lastWorkoutDate: string | null;
    daysSinceWorkout: number;
  }>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastWorkout);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const results = await db
      .select({
        clientId: trainerClients.clientId,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
        clientEmail: users.email,
        lastCompletedDate: sql<string | null>`
          (SELECT MAX(ws.scheduled_date) 
           FROM ${workoutSessions} ws 
           WHERE ws.user_id = ${trainerClients.clientId} 
           AND ws.status = 'complete')
        `,
      })
      .from(trainerClients)
      .innerJoin(users, eq(trainerClients.clientId, users.id))
      .where(
        and(
          eq(trainerClients.trainerId, trainerId),
          eq(trainerClients.status, 'active')
        )
      );

    return results
      .filter(r => {
        if (!r.lastCompletedDate) return true; // Never worked out
        return r.lastCompletedDate < cutoffStr;
      })
      .map(r => {
        const daysSince = r.lastCompletedDate 
          ? Math.floor((Date.now() - new Date(r.lastCompletedDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        return {
          clientId: r.clientId,
          clientName: `${r.clientFirstName} ${r.clientLastName}`,
          clientEmail: r.clientEmail || 'N/A',
          lastWorkoutDate: r.lastCompletedDate,
          daysSinceWorkout: daysSince,
        };
      });
  }

  async getPendingInvitesCounts(trainerId: string): Promise<{ sent: number; received: number }> {
    const sentResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(trainerClientInvites)
      .where(
        and(
          eq(trainerClientInvites.trainerId, trainerId),
          eq(trainerClientInvites.status, 'pending')
        )
      );

    const receivedResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(trainerClientInvites)
      .where(
        and(
          eq(trainerClientInvites.clientId, trainerId),
          eq(trainerClientInvites.status, 'pending')
        )
      );

    return {
      sent: sentResult[0]?.count || 0,
      received: receivedResult[0]?.count || 0,
    };
  }

  async getWorkoutsMissingNotes(trainerId: string): Promise<Array<{
    workoutId: string;
    clientId: string;
    clientName: string;
    scheduledDate: string;
    noteType: 'pre-session' | 'post-session';
  }>> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get upcoming workouts (next 3 days) missing pre-session notes
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const upcomingMissingPreNotes = await db
      .select({
        workoutId: workoutSessions.id,
        clientId: trainerClients.clientId,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
        scheduledDate: workoutSessions.scheduledDate,
      })
      .from(workoutSessions)
      .innerJoin(trainerClients, eq(workoutSessions.userId, trainerClients.clientId))
      .innerJoin(users, eq(trainerClients.clientId, users.id))
      .where(
        and(
          eq(trainerClients.trainerId, trainerId),
          eq(trainerClients.status, 'active'),
          gte(workoutSessions.scheduledDate, today),
          lte(workoutSessions.scheduledDate, futureDateStr),
          eq(workoutSessions.status, 'scheduled'),
          or(
            isNull(workoutSessions.trainerPreSessionNotes),
            eq(workoutSessions.trainerPreSessionNotes, '')
          )
        )
      );

    // Get completed workouts (last 7 days) missing post-session reviews
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const pastDateStr = pastDate.toISOString().split('T')[0];

    const completedMissingPostNotes = await db
      .select({
        workoutId: workoutSessions.id,
        clientId: trainerClients.clientId,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
        scheduledDate: workoutSessions.scheduledDate,
      })
      .from(workoutSessions)
      .innerJoin(trainerClients, eq(workoutSessions.userId, trainerClients.clientId))
      .innerJoin(users, eq(trainerClients.clientId, users.id))
      .where(
        and(
          eq(trainerClients.trainerId, trainerId),
          eq(trainerClients.status, 'active'),
          gte(workoutSessions.scheduledDate, pastDateStr),
          lte(workoutSessions.scheduledDate, today),
          eq(workoutSessions.status, 'complete'),
          or(
            isNull(workoutSessions.trainerPostSessionReview),
            eq(workoutSessions.trainerPostSessionReview, '')
          )
        )
      );

    const results = [
      ...upcomingMissingPreNotes.map(r => ({
        workoutId: r.workoutId,
        clientId: r.clientId,
        clientName: `${r.clientFirstName} ${r.clientLastName}`,
        scheduledDate: r.scheduledDate || '',
        noteType: 'pre-session' as const,
      })),
      ...completedMissingPostNotes.map(r => ({
        workoutId: r.workoutId,
        clientId: r.clientId,
        clientName: `${r.clientFirstName} ${r.clientLastName}`,
        scheduledDate: r.scheduledDate || '',
        noteType: 'post-session' as const,
      })),
    ];

    return results;
  }

  async getPerClientAlertSummary(trainerId: string): Promise<Array<{
    clientId: string;
    counts: {
      inactive: number;
      missingPreNotes: number;
      missingPostNotes: number;
    };
    total: number;
  }>> {
    // Get all clients
    const clients = await this.getTrainerClients(trainerId);
    const activeClients = clients.filter(c => c.status === 'active');
    
    // Get inactive clients
    const inactiveClients = await this.getInactiveClients(trainerId, 7);
    const inactiveClientIds = new Set(inactiveClients.map(c => c.clientId));
    
    // Get workouts missing notes
    const workoutsMissingNotes = await this.getWorkoutsMissingNotes(trainerId);
    
    // Group missing notes by client
    const missingNotesByClient = new Map<string, { preNotes: number; postNotes: number }>();
    for (const workout of workoutsMissingNotes) {
      if (!missingNotesByClient.has(workout.clientId)) {
        missingNotesByClient.set(workout.clientId, { preNotes: 0, postNotes: 0 });
      }
      const counts = missingNotesByClient.get(workout.clientId)!;
      if (workout.noteType === 'pre-session') {
        counts.preNotes++;
      } else {
        counts.postNotes++;
      }
    }
    
    // Build summary for each client
    return activeClients.map(client => {
      const noteCounts = missingNotesByClient.get(client.clientId) || { preNotes: 0, postNotes: 0 };
      const isInactive = inactiveClientIds.has(client.clientId) ? 1 : 0;
      
      return {
        clientId: client.clientId,
        counts: {
          inactive: isInactive,
          missingPreNotes: noteCounts.preNotes,
          missingPostNotes: noteCounts.postNotes,
        },
        total: isInactive + noteCounts.preNotes + noteCounts.postNotes,
      };
    });
  }

  async getClientAlertDetail(trainerId: string, clientId: string): Promise<{
    inactiveStatus: {
      isInactive: boolean;
      daysSinceWorkout: number;
      lastWorkoutDate: string | null;
    };
    missingPreNotes: Array<{
      workoutId: string;
      scheduledDate: string;
    }>;
    missingPostNotes: Array<{
      workoutId: string;
      scheduledDate: string;
    }>;
  } | null> {
    // Verify trainer-client relationship
    const connection = await db
      .select()
      .from(trainerClients)
      .where(
        and(
          eq(trainerClients.trainerId, trainerId),
          eq(trainerClients.clientId, clientId),
          eq(trainerClients.status, 'active')
        )
      )
      .limit(1);
    
    if (connection.length === 0) {
      return null; // Not authorized or connection doesn't exist
    }

    // Get inactive status
    const inactiveClients = await this.getInactiveClients(trainerId, 7);
    const inactiveClient = inactiveClients.find(c => c.clientId === clientId);
    
    // Get all workouts missing notes for this client
    const allMissingNotes = await this.getWorkoutsMissingNotes(trainerId);
    const clientMissingNotes = allMissingNotes.filter(w => w.clientId === clientId);
    
    const missingPreNotes = clientMissingNotes
      .filter(w => w.noteType === 'pre-session')
      .map(w => ({
        workoutId: w.workoutId,
        scheduledDate: w.scheduledDate,
      }));
    
    const missingPostNotes = clientMissingNotes
      .filter(w => w.noteType === 'post-session')
      .map(w => ({
        workoutId: w.workoutId,
        scheduledDate: w.scheduledDate,
      }));
    
    return {
      inactiveStatus: {
        isInactive: !!inactiveClient,
        daysSinceWorkout: inactiveClient?.daysSinceWorkout || 0,
        lastWorkoutDate: inactiveClient?.lastWorkoutDate || null,
      },
      missingPreNotes,
      missingPostNotes,
    };
  }

  // ==========================================
  // USER ALERT OPERATIONS
  // ==========================================
  
  async getUserWorkoutStreak(userId: string): Promise<number> {
    // Get completed workouts in chronological order
    const completedSessions = await db
      .select({ scheduledDate: workoutSessions.scheduledDate })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, 'complete')
        )
      )
      .orderBy(desc(workoutSessions.scheduledDate));

    if (completedSessions.length === 0) return 0;

    // Calculate streak from today backwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);

    // Check each day going backwards
    for (let i = 0; i < 365; i++) { // Max 1 year streak
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasWorkout = completedSessions.some(s => s.scheduledDate === dateStr);
      
      if (hasWorkout) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Allow for rest days (check if we've started the streak)
        if (streak > 0) {
          // If no workout for 3+ consecutive days, streak is broken
          const threeDaysAgo = new Date(currentDate);
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 2);
          const hasRecentWorkout = completedSessions.some(s => {
            const sDate = new Date(s.scheduledDate!);
            return sDate > threeDaysAgo && sDate <= currentDate;
          });
          
          if (!hasRecentWorkout) break;
        }
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }

    return streak;
  }

  async getUnreadTrainerNotes(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    // Count upcoming workouts with unread pre-session notes
    const upcomingWithNotes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.scheduledDate, today),
          eq(workoutSessions.status, 'scheduled'),
          sql`${workoutSessions.trainerPreSessionNotes} IS NOT NULL AND ${workoutSessions.trainerPreSessionNotes} != ''`,
          sql`${workoutSessions.notesReadAt} IS NULL`
        )
      );

    // Count completed workouts with unread post-session reviews
    const completedWithReviews = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, 'complete'),
          sql`${workoutSessions.trainerPostSessionReview} IS NOT NULL AND ${workoutSessions.trainerPostSessionReview} != ''`,
          sql`${workoutSessions.notesReadAt} IS NULL`
        )
      );

    return (upcomingWithNotes[0]?.count || 0) + (completedWithReviews[0]?.count || 0);
  }

  async getUnreadTrainerNotesDetail(userId: string): Promise<{
    upcomingNotes: Array<{
      sessionId: string;
      scheduledDate: string;
      workoutName: string;
      notes: string;
    }>;
    pastNotes: Array<{
      sessionId: string;
      scheduledDate: string;
      workoutName: string;
      review: string;
    }>;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get upcoming workouts with unread pre-session notes
    const upcomingNotes = await db
      .select({
        sessionId: workoutSessions.id,
        scheduledDate: workoutSessions.scheduledDate,
        workoutName: workoutSessions.workoutName,
        notes: workoutSessions.trainerPreSessionNotes,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.scheduledDate, today),
          eq(workoutSessions.status, 'scheduled'),
          sql`${workoutSessions.trainerPreSessionNotes} IS NOT NULL AND ${workoutSessions.trainerPreSessionNotes} != ''`,
          sql`${workoutSessions.notesReadAt} IS NULL`
        )
      )
      .orderBy(workoutSessions.scheduledDate)
      .limit(10);

    // Get completed workouts with unread post-session reviews
    const pastNotes = await db
      .select({
        sessionId: workoutSessions.id,
        scheduledDate: workoutSessions.scheduledDate,
        workoutName: workoutSessions.workoutName,
        review: workoutSessions.trainerPostSessionReview,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, 'complete'),
          sql`${workoutSessions.trainerPostSessionReview} IS NOT NULL AND ${workoutSessions.trainerPostSessionReview} != ''`,
          sql`${workoutSessions.notesReadAt} IS NULL`
        )
      )
      .orderBy(desc(workoutSessions.scheduledDate))
      .limit(10);

    return {
      upcomingNotes: upcomingNotes.map(n => ({
        sessionId: n.sessionId,
        scheduledDate: n.scheduledDate || '',
        workoutName: n.workoutName || '',
        notes: n.notes || '',
      })),
      pastNotes: pastNotes.map(n => ({
        sessionId: n.sessionId,
        scheduledDate: n.scheduledDate || '',
        workoutName: n.workoutName || '',
        review: n.review || '',
      })),
    };
  }

  async getUnreadTrainerNotesSummary(userId: string): Promise<{
    upcomingCount: number;
    pastCount: number;
    nextUpcomingDate?: string;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Count upcoming workouts with unread pre-session notes
    const upcomingWithNotes = await db
      .select({ 
        count: sql<number>`count(*)::int`,
        nextDate: sql<string>`MIN(${workoutSessions.scheduledDate})`
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.scheduledDate, today),
          eq(workoutSessions.status, 'scheduled'),
          sql`${workoutSessions.trainerPreSessionNotes} IS NOT NULL AND ${workoutSessions.trainerPreSessionNotes} != ''`,
          sql`${workoutSessions.notesReadAt} IS NULL`
        )
      );

    // Count completed workouts with unread post-session reviews
    const completedWithReviews = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, 'complete'),
          sql`${workoutSessions.trainerPostSessionReview} IS NOT NULL AND ${workoutSessions.trainerPostSessionReview} != ''`,
          sql`${workoutSessions.notesReadAt} IS NULL`
        )
      );

    return {
      upcomingCount: upcomingWithNotes[0]?.count || 0,
      pastCount: completedWithReviews[0]?.count || 0,
      nextUpcomingDate: upcomingWithNotes[0]?.nextDate || undefined,
    };
  }

  async markNotesAsRead(sessionId: string): Promise<void> {
    await db
      .update(workoutSessions)
      .set({ notesReadAt: new Date() })
      .where(eq(workoutSessions.id, sessionId));
  }

  async getUserPendingInvites(userId: string): Promise<number> {
    // Count pending invites where user is the client (received invites from trainers)
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(trainerClientInvites)
      .where(
        and(
          eq(trainerClientInvites.clientId, userId),
          eq(trainerClientInvites.status, 'pending')
        )
      );

    return result[0]?.count || 0;
  }

  async getUserProgramStatus(userId: string): Promise<{
    hasActiveProgram: boolean;
    daysRemaining: number | null;
    programName: string | null;
  }> {
    const activeProgram = await this.getUserActiveProgram(userId);
    
    if (!activeProgram) {
      return {
        hasActiveProgram: false,
        daysRemaining: null,
        programName: null,
      };
    }

    // Get all sessions for this program
    const sessions = await db
      .select({ scheduledDate: workoutSessions.scheduledDate })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.workoutProgramId, activeProgram.id)
        )
      )
      .orderBy(desc(workoutSessions.scheduledDate));

    if (sessions.length === 0) {
      return {
        hasActiveProgram: true,
        daysRemaining: null,
        programName: activeProgram.programType,
      };
    }

    // Find the last scheduled date
    const lastDate = sessions[0].scheduledDate;
    if (!lastDate) {
      return {
        hasActiveProgram: true,
        daysRemaining: null,
        programName: activeProgram.programType,
      };
    }

    // Calculate days remaining
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(lastDate);
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      hasActiveProgram: true,
      daysRemaining: Math.max(0, daysRemaining),
      programName: activeProgram.programType,
    };
  }

  // ==========================================
  // USER SUPPORT OPERATIONS
  // ==========================================
  
  async createUserSupportRequest(
    userId: string,
    request: Omit<InsertSupportRequest, 'userId' | 'trainerId'>
  ): Promise<SupportRequest> {
    // Get user's subscription tier for auto-tagging
    const user = await db.select({ subscriptionTier: users.subscriptionTier })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    const tier = user[0]?.subscriptionTier || 'free';
    
    const result = await db.insert(supportRequests).values({
      ...request,
      userId,
      tier,
    }).returning();
    
    return result[0];
  }

  async getUserSupportRequests(userId: string): Promise<SupportRequest[]> {
    return db.select().from(supportRequests)
      .where(eq(supportRequests.userId, userId))
      .orderBy(desc(supportRequests.createdAt));
  }
}

export const storage = new DbStorage();
