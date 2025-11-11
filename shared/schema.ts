// ==========================================
// DATABASE SCHEMA - All Tables and Data Structures
// ==========================================
// This file defines the structure of every database table in Morphit
// Think of it as the blueprint for how data is organized and stored
//
// MAIN TABLES:
// 1. sessions - User login sessions (Replit Auth)
// 2. users - User profiles (height, weight, preferences, goals)
// 3. fitnessAssessments - Fitness test results (push-ups, 1RMs, etc.)
// 4. exercises - Exercise library (196 exercises with details)
// 5. equipment - Equipment reference (auto-populated from exercises)
// 6. workoutPrograms - Generated workout plans (8-week programs)
// 7. programWorkouts - Individual workouts within a program (Mon workout, Wed workout, etc.)
// 8. programExercises - Exercises within each workout (sets, reps, weight)
// 9. workoutSessions - Scheduled daily workouts (pre-generated for 8 weeks)
// 10. workoutSets - Individual set completions (what user actually did)
//
// HOW THEY RELATE:
// User → creates → FitnessAssessment → generates → WorkoutProgram
// WorkoutProgram → contains → ProgramWorkouts → contains → ProgramExercises
// ProgramWorkouts → scheduled as → WorkoutSessions → tracked via → WorkoutSets
//
// VALIDATION:
// Each table has an "insert schema" (using Zod) that validates data before saving
// This prevents bad data from entering the database
// ==========================================

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, date, json, index, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// AUTHENTICATION TABLES
// ==========================================

// TABLE: sessions
// Stores user login sessions for Replit Auth
// Sessions expire after a certain time for security
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),           // Session ID (unique identifier)
    sess: json("sess").notNull(),              // Session data (user info, etc.)
    expire: timestamp("expire").notNull(),      // When this session expires
  },
  (table) => [index("IDX_session_expire").on(table.expire)],  // Index for faster session cleanup
);

// TABLE: users
// Core user profile data - stores everything about a user
// Updated during onboarding and via Settings page
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  sex: text("sex"),  // "male" or "female" - used for accurate BMR/TDEE calculations
  height: real("height"),
  weight: real("weight"),
  dateOfBirth: timestamp("date_of_birth"),
  bmr: integer("bmr"),
  targetCalories: integer("target_calories"),
  focusCycle: text("focus_cycle"),  // Morphit Focus Cycle: flow, build, strong, move
  currentWeekInCycle: integer("current_week_in_cycle").notNull().default(1),  // Current week in 4-week microcycle (1-4): Learn, Load, Push, Deload
  unitPreference: text("unit_preference").notNull().default("imperial"),
  equipment: text("equipment").array(),
  workoutDuration: integer("workout_duration"),
  daysPerWeek: integer("days_per_week"),
  selectedDays: integer("selected_days").array(),  // Legacy: Day-of-week selection (kept for backwards compatibility)
  selectedDates: text("selected_dates").array(),  // NEW: Array of YYYY-MM-DD strings for current 7-day cycle
  cycleNumber: integer("cycle_number").default(1),  // NEW: Tracks which 7-day cycle user is on
  totalWorkoutsCompleted: integer("total_workouts_completed").default(0),  // NEW: Total workouts completed across all cycles
  fitnessLevel: text("fitness_level"),
  isDiscoverable: boolean("is_discoverable").notNull().default(true), // Privacy: Allow trainers to search and find this user
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// TABLE: fitnessAssessments
// Stores fitness test results from both onboarding and retakes
// Used to calculate movement pattern levels and generate workout programs
export const fitnessAssessments = pgTable("fitness_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  testDate: timestamp("test_date").notNull().defaultNow(),
  experienceLevel: text("experience_level"),
  pushups: integer("pushups"),
  pikePushups: integer("pike_pushups"),
  pullups: integer("pullups"),
  squats: integer("squats"),
  walkingLunges: integer("walking_lunges"),
  singleLegRdl: integer("single_leg_rdl"),
  plankHold: integer("plank_hold"),
  mileTime: real("mile_time"),
  squat1rm: real("squat_1rm"),
  deadlift1rm: real("deadlift_1rm"),
  benchPress1rm: real("bench_press_1rm"),
  overheadPress1rm: real("overhead_press_1rm"),
  barbellRow1rm: real("barbell_row_1rm"),
  dumbbellLunge1rm: real("dumbbell_lunge_1rm"),
  farmersCarry1rm: real("farmers_carry_1rm"),
  // Manual level overrides for each movement pattern
  horizontalPushOverride: text("horizontal_push_override"),
  verticalPushOverride: text("vertical_push_override"),
  verticalPullOverride: text("vertical_pull_override"),
  horizontalPullOverride: text("horizontal_pull_override"),
  lowerBodyOverride: text("lower_body_override"),
  hingeOverride: text("hinge_override"),
  coreOverride: text("core_override"),
  rotationOverride: text("rotation_override"),
  carryOverride: text("carry_override"),
  cardioOverride: text("cardio_override"),
});

export const insertFitnessAssessmentSchema = createInsertSchema(fitnessAssessments).omit({
  id: true,
  testDate: true,
});

export type InsertFitnessAssessment = z.infer<typeof insertFitnessAssessmentSchema>;
export type FitnessAssessment = typeof fitnessAssessments.$inferSelect;

// ==========================================
// EXERCISE LIBRARY TABLES
// ==========================================

// TABLE: exercises
// Master exercise library with 196 exercises
// Each exercise has equipment, difficulty, movement pattern, and category
// Categories: warmup | power | compound | isolation | core | cardio
export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  movementPattern: text("movement_pattern").notNull(),
  equipment: text("equipment").array().notNull(),
  difficulty: text("difficulty").notNull(),
  primaryMuscles: text("primary_muscles").array().notNull(),
  secondaryMuscles: text("secondary_muscles").array(),
  exerciseCategory: text("exercise_category").notNull(), // Unified field: warmup | power | compound | isolation | core | cardio
  isCorrective: integer("is_corrective").notNull().default(0),
  isOlympicLift: integer("is_olympic_lift").notNull().default(0),
  trackingType: text("tracking_type").notNull().default("reps"),
  recommendedTempo: text("recommended_tempo"),
  videoUrl: text("video_url"),
  formTips: text("form_tips").array(),
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
}).extend({
  exerciseCategory: z.enum(["warmup", "power", "compound", "isolation", "core", "cardio"]),
  trackingType: z.enum(["reps", "duration", "both"]).default("reps"),
});

export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

// Equipment reference table - auto-populated from exercises database
export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  category: text("category"), // 'cardio', 'weights', 'bodyweight', 'other'
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
});

export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = typeof equipment.$inferSelect;

// ==========================================
// PROGRAM STRUCTURE TABLES
// ==========================================
// These tables store the AI-generated 8-week workout programs

// TABLE: workoutPrograms
// The top-level program container - one per user at a time
// Links to the fitness assessment that generated it
export const workoutPrograms = pgTable("workout_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  createdDate: timestamp("created_date").notNull().defaultNow(),
  fitnessAssessmentId: varchar("fitness_assessment_id"),
  programType: text("program_type").notNull(),
  weeklyStructure: text("weekly_structure").notNull(),
  durationWeeks: integer("duration_weeks").notNull(),
  intensityLevel: text("intensity_level").notNull().default("moderate"),
  isActive: integer("is_active").notNull().default(1),
  archivedDate: timestamp("archived_date"),
  archivedReason: text("archived_reason"),
});

// TABLE: programWorkouts
// Individual workouts within a program (one per training day)
// Example: Mon=Upper Power, Wed=Lower Strength, Fri=Full Body
// LEGACY: Uses dayOfWeek (1-7) for backwards compatibility
// NEW: Uses workoutIndex (1, 2, 3, ..., N) for date-based scheduling
export const programWorkouts = pgTable("program_workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id").notNull(),
  dayOfWeek: integer("day_of_week"),  // LEGACY: Made optional for new approach
  workoutIndex: integer("workout_index"),  // NEW: Sequential workout number (1, 2, 3, ...)
  workoutName: text("workout_name").notNull(),
  movementFocus: text("movement_focus").array().notNull(),
  workoutType: text("workout_type"),
});

// TABLE: programExercises
// Exercises within each workout with sets/reps/weights
// Example: Bench Press - 4 sets of 8-12 reps at 135 lbs
export const programExercises = pgTable("program_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workoutId: varchar("workout_id").notNull(),
  exerciseId: varchar("exercise_id").notNull(),
  equipment: text("equipment"),
  orderIndex: integer("order_index").notNull(),
  sets: integer("sets").notNull(),
  repsMin: integer("reps_min"),
  repsMax: integer("reps_max"),
  recommendedWeight: real("recommended_weight"),
  durationSeconds: integer("duration_seconds"),
  workSeconds: integer("work_seconds"),
  restSeconds: integer("rest_seconds").notNull(),
  tempo: text("tempo"),
  targetRPE: integer("target_rpe"),
  targetRIR: integer("target_rir"),
  notes: text("notes"),
  supersetGroup: text("superset_group"),
  supersetOrder: integer("superset_order"),
});

export const insertWorkoutProgramSchema = createInsertSchema(workoutPrograms).omit({
  id: true,
  createdDate: true,
}).extend({
  intensityLevel: z.enum(["light", "moderate", "vigorous", "circuit"]).default("moderate"),
});

export const insertProgramWorkoutSchema = createInsertSchema(programWorkouts).omit({
  id: true,
});

export const insertProgramExerciseSchema = createInsertSchema(programExercises).omit({
  id: true,
});

export type InsertWorkoutProgram = z.infer<typeof insertWorkoutProgramSchema>;
export type WorkoutProgram = typeof workoutPrograms.$inferSelect;
export type InsertProgramWorkout = z.infer<typeof insertProgramWorkoutSchema>;
export type ProgramWorkout = typeof programWorkouts.$inferSelect;
export type InsertProgramExercise = z.infer<typeof insertProgramExerciseSchema>;
export type ProgramExercise = typeof programExercises.$inferSelect;

// ==========================================
// WORKOUT TRACKING TABLES
// ==========================================
// These tables track actual workouts completed by users

// TABLE: workoutSessions
// Pre-scheduled daily workouts (generated for 8 weeks at program creation)
// User marks complete after finishing workout
export const workoutSessions = pgTable("workout_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  programWorkoutId: varchar("program_workout_id"),
  workoutName: text("workout_name"),
  sessionDate: timestamp("session_date").notNull().defaultNow(),
  scheduledDate: date("scheduled_date"),
  sessionDayOfWeek: integer("session_day_of_week"),
  sessionType: text("session_type").notNull().default("rest"),
  workoutType: text("workout_type"),
  weekTheme: text("week_theme"),  // Week theme in 4-week cycle: Learn, Load, Push, Deload
  status: text("status").notNull().default("scheduled"), // scheduled → in_progress → partial/complete
  durationMinutes: integer("duration_minutes"),
  elapsedSeconds: integer("elapsed_seconds"), // Tracks timer state for partial workouts
  caloriesBurned: integer("calories_burned"),
  notes: text("notes"),
  isArchived: integer("is_archived").notNull().default(0),
}, (table) => ({
  // Ensure only one active session per user per date (prevents duplicates)
  uniqueUserDateSession: uniqueIndex("unique_user_date_session").on(table.userId, table.scheduledDate, table.isArchived),
}));

// TABLE: workoutSets
// Individual set completions during a workout
// Tracks actual performance: weight lifted, reps completed, RIR (Reps In Reserve)
export const workoutSets = pgTable("workout_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  programExerciseId: varchar("program_exercise_id").notNull(),
  setNumber: integer("set_number").notNull(),
  weight: real("weight"),
  reps: integer("reps"),
  rir: integer("rir"),
  durationSeconds: integer("duration_seconds"),
  completed: integer("completed").notNull().default(0),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertWorkoutSessionSchema = createInsertSchema(workoutSessions).omit({
  id: true,
  sessionDate: true,
}).extend({
  sessionType: z.enum(["workout", "rest"]).optional(),
  workoutType: z.enum(["strength", "cardio", "hiit", "mobility"]).optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
});

export const patchWorkoutSessionSchema = z.object({
  status: z.enum(["scheduled", "in_progress", "partial", "complete", "skipped"]).optional(),
  sessionType: z.enum(["workout", "rest"]).optional(),
  workoutType: z.enum(["strength", "cardio", "hiit", "mobility"]).optional(),
  durationMinutes: z.number().optional(),
  caloriesBurned: z.number().optional(),
  notes: z.string().optional(),
  sessionDate: z.coerce.date().optional(), // Coerce ISO strings from client to Date
});

export const insertWorkoutSetSchema = createInsertSchema(workoutSets).omit({
  id: true,
  timestamp: true,
});

export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type PatchWorkoutSession = z.infer<typeof patchWorkoutSessionSchema>;
export type InsertWorkoutSet = z.infer<typeof insertWorkoutSetSchema>;
export type WorkoutSet = typeof workoutSets.$inferSelect;

// ==========================================
// TRAINER MARKETPLACE TABLES
// ==========================================
// These tables enable trainers to create and sell custom programs

// TABLE: trainerCustomExercises
// Exercises created by trainers for their programs
// Separate from system exercises but follows same structure
export const trainerCustomExercises = pgTable("trainer_custom_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerId: varchar("trainer_id").notNull(), // User ID of the trainer
  name: text("name").notNull(),
  description: text("description"),
  videoUrl: text("video_url"), // Trainer's own video content
  movementPattern: text("movement_pattern").notNull(),
  equipment: text("equipment").array().notNull(),
  difficulty: text("difficulty").notNull(),
  primaryMuscles: text("primary_muscles").array().notNull(),
  secondaryMuscles: text("secondary_muscles").array(),
  exerciseCategory: text("exercise_category").notNull(), // warmup | power | compound | isolation | core | cardio
  trackingType: text("tracking_type").notNull().default("reps"), // reps | duration | both
  recommendedTempo: text("recommended_tempo"),
  formTips: text("form_tips").array(),
  isScalable: integer("is_scalable").notNull().default(1), // Can this exercise progress?
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrainerCustomExerciseSchema = createInsertSchema(trainerCustomExercises).omit({
  id: true,
  createdAt: true,
}).extend({
  exerciseCategory: z.enum(["warmup", "power", "compound", "isolation", "core", "cardio"]),
  trackingType: z.enum(["reps", "duration", "both"]).default("reps"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
});

export type InsertTrainerCustomExercise = z.infer<typeof insertTrainerCustomExerciseSchema>;
export type TrainerCustomExercise = typeof trainerCustomExercises.$inferSelect;

// TABLE: trainerPrograms
// Programs created by trainers to sell to clients
// Can be built from scratch or based on system templates
export const trainerPrograms = pgTable("trainer_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerId: varchar("trainer_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(), // URL-friendly identifier: trainer-name/program-slug
  basedOnTemplate: text("based_on_template"), // null = from scratch, or "flow" | "build" | "strong" | "move"
  difficulty: text("difficulty").notNull(),
  durationWeeks: integer("duration_weeks").notNull().default(4),
  daysPerWeek: integer("days_per_week").notNull(),
  price: real("price").notNull(), // Price in dollars
  pricingType: text("pricing_type").notNull().default("one_time"), // one_time | subscription
  isPublished: integer("is_published").notNull().default(0),
  totalSales: integer("total_sales").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTrainerProgramSchema = createInsertSchema(trainerPrograms).omit({
  id: true,
  totalSales: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  pricingType: z.enum(["one_time", "subscription"]).default("one_time"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
});

export type InsertTrainerProgram = z.infer<typeof insertTrainerProgramSchema>;
export type TrainerProgram = typeof trainerPrograms.$inferSelect;

// TABLE: trainerProgramWorkouts
// Workouts within trainer-created programs
// Similar to programWorkouts but for marketplace programs
export const trainerProgramWorkouts = pgTable("trainer_program_workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerProgramId: varchar("trainer_program_id").notNull(),
  weekNumber: integer("week_number").notNull(), // 1-4 for microcycle
  dayNumber: integer("day_number").notNull(), // 1, 2, 3... based on daysPerWeek
  workoutName: text("workout_name").notNull(),
  description: text("description"),
  movementFocus: text("movement_focus").array(),
  estimatedDuration: integer("estimated_duration"), // Minutes
  orderIndex: integer("order_index").notNull(), // Overall position in program
});

export const insertTrainerProgramWorkoutSchema = createInsertSchema(trainerProgramWorkouts).omit({
  id: true,
});

export type InsertTrainerProgramWorkout = z.infer<typeof insertTrainerProgramWorkoutSchema>;
export type TrainerProgramWorkout = typeof trainerProgramWorkouts.$inferSelect;

// TABLE: trainerProgramExercises
// Exercises within trainer program workouts
// Can reference system exercises OR trainer custom exercises
export const trainerProgramExercises = pgTable("trainer_program_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerWorkoutId: varchar("trainer_workout_id").notNull(),
  exerciseId: varchar("exercise_id"), // System exercise ID (can be null if custom)
  customExerciseId: varchar("custom_exercise_id"), // Trainer custom exercise ID (can be null if system)
  equipment: text("equipment"),
  orderIndex: integer("order_index").notNull(),
  sets: integer("sets").notNull(),
  repsMin: integer("reps_min"),
  repsMax: integer("reps_max"),
  recommendedWeight: real("recommended_weight"),
  durationSeconds: integer("duration_seconds"),
  workSeconds: integer("work_seconds"),
  restSeconds: integer("rest_seconds").notNull(),
  tempo: text("tempo"),
  targetRPE: integer("target_rpe"),
  targetRIR: integer("target_rir"),
  notes: text("notes"),
  supersetGroup: text("superset_group"),
  supersetOrder: integer("superset_order"),
});

export const insertTrainerProgramExerciseSchema = createInsertSchema(trainerProgramExercises).omit({
  id: true,
}).refine(
  (data) => {
    // Exactly one of exerciseId or customExerciseId must be set
    return (data.exerciseId !== null && data.exerciseId !== undefined && !data.customExerciseId) ||
           (data.customExerciseId !== null && data.customExerciseId !== undefined && !data.exerciseId);
  },
  {
    message: "Exactly one of exerciseId or customExerciseId must be provided",
  }
);

export type InsertTrainerProgramExercise = z.infer<typeof insertTrainerProgramExerciseSchema>;
export type TrainerProgramExercise = typeof trainerProgramExercises.$inferSelect;

// TABLE: programPurchases
// Tracks purchases of trainer programs
// Links buyer to program and tracks revenue split
export const programPurchases = pgTable("program_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerProgramId: varchar("trainer_program_id").notNull(),
  trainerId: varchar("trainer_id").notNull(),
  buyerId: varchar("buyer_id").notNull(), // User ID of purchaser
  purchasePrice: real("purchase_price").notNull(),
  platformFee: real("platform_fee").notNull(), // 20% of price
  trainerEarnings: real("trainer_earnings").notNull(), // 80% of price
  pricingType: text("pricing_type").notNull(), // one_time | subscription
  status: text("status").notNull().default("completed"), // completed | refunded
  purchaseDate: timestamp("purchase_date").defaultNow(),
  workoutProgramId: varchar("workout_program_id"), // Generated program ID for the buyer
});

export const insertProgramPurchaseSchema = createInsertSchema(programPurchases).omit({
  id: true,
  purchaseDate: true,
}).extend({
  pricingType: z.enum(["one_time", "subscription"]),
  status: z.enum(["completed", "refunded"]).default("completed"),
});

export type InsertProgramPurchase = z.infer<typeof insertProgramPurchaseSchema>;
export type ProgramPurchase = typeof programPurchases.$inferSelect;

// TABLE: trainerClients - Explicit trainer-client roster linkage
// Created when a client purchases a trainer program or connects via username
export const trainerClients = pgTable("trainer_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerId: varchar("trainer_id").notNull(),
  clientId: varchar("client_id").notNull(), // User ID of client (buyer)
  addedDate: timestamp("added_date").defaultNow(),
  sourcePurchaseId: varchar("source_purchase_id"), // Reference to purchase that created this relationship
  status: text("status").notNull().default("active"), // active | disconnected - Soft delete support
  disconnectedAt: timestamp("disconnected_at"), // When connection was ended (if status = disconnected)
});

export const insertTrainerClientSchema = createInsertSchema(trainerClients).omit({
  id: true,
  addedDate: true,
  disconnectedAt: true,
});

export type InsertTrainerClient = z.infer<typeof insertTrainerClientSchema>;
export type TrainerClient = typeof trainerClients.$inferSelect;

// TABLE: trainerClientInvites - Bidirectional invite system for trainer-client connections
// Tracks pending, accepted, declined, and canceled invitations initiated by either party
export const trainerClientInvites = pgTable("trainer_client_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerId: varchar("trainer_id").notNull(), // User ID of the trainer
  clientId: varchar("client_id").notNull(), // User ID of the client
  status: text("status").notNull().default("pending"), // pending | accepted | declined | canceled | expired
  initiatorRole: text("initiator_role").notNull(), // trainer | client - Who sent the invite
  message: text("message"), // Optional message from the inviter
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"), // When invite was accepted/declined
  expiresAt: timestamp("expires_at"), // Optional expiration (e.g., 30 days from creation)
});

export const insertTrainerClientInviteSchema = createInsertSchema(trainerClientInvites).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
}).extend({
  status: z.enum(["pending", "accepted", "declined", "canceled", "expired"]).default("pending"),
  initiatorRole: z.enum(["trainer", "client"]),
});

export type InsertTrainerClientInvite = z.infer<typeof insertTrainerClientInviteSchema>;
export type TrainerClientInvite = typeof trainerClientInvites.$inferSelect;

// ==========================================
// TRAINER DASHBOARD API RESPONSE TYPES
// ==========================================

// Response type for GET /api/trainer/clients
export const trainerClientRosterSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  clientEmail: z.string(),
  programId: z.string().nullable(),
  programName: z.string().nullable(),
  purchaseDate: z.string(), // ISO timestamp
  subscriptionType: z.enum(["one_time", "subscription"]),
  purchasePrice: z.number(),
  trainerEarnings: z.number(), // 80% of purchase price
  addedDate: z.string(), // ISO timestamp
});

export type TrainerClientRoster = z.infer<typeof trainerClientRosterSchema>;

// Response type for GET /api/trainer/sales
export const trainerSalesMetricsSchema = z.object({
  totalRevenue: z.number(), // Total trainer earnings (all-time)
  monthlyRevenue: z.number(), // MRR from subscription purchases
  annualRevenue: z.number(), // ARR from annual subscriptions
  totalPurchases: z.number(),
  activePlans: z.number(), // One-time + active subscriptions
  purchases: z.array(z.object({
    id: z.string(),
    programName: z.string(),
    buyerName: z.string(),
    buyerEmail: z.string(),
    purchasePrice: z.number(),
    platformFee: z.number(),
    trainerEarnings: z.number(),
    pricingType: z.enum(["one_time", "subscription"]),
    status: z.enum(["completed", "refunded"]),
    purchaseDate: z.string(), // ISO timestamp
  })),
});

export type TrainerSalesMetrics = z.infer<typeof trainerSalesMetricsSchema>;

// ==========================================
// TRAINER PROFILE & INVITE SYSTEM
// ==========================================

// TABLE: trainerProfiles - Trainer-specific profile data (1:1 with users)
// Created during trainer onboarding flow
export const trainerProfiles = pgTable("trainer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  username: varchar("username").notNull().unique(), // Unique trainer username for client discovery (e.g., "alexmartinez")
  bio: text("bio"),
  yearsExperience: integer("years_experience"),
  specialties: text("specialties").array().default(sql`array[]::text[]`),
  certifications: text("certifications").array().default(sql`array[]::text[]`),
  socialLinks: json("social_links").$type<{ instagram?: string; website?: string; linkedin?: string }>(),
  subscriptionStatus: text("subscription_status").notNull().default("free"), // free | premium - Controls client limit (5 free, unlimited premium)
  onboardingStatus: text("onboarding_status").notNull().default("pending"), // pending | bio_complete | expertise_complete | completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTrainerProfileSchema = createInsertSchema(trainerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .transform(val => val.toLowerCase()), // Normalize to lowercase
  subscriptionStatus: z.enum(["free", "premium"]).default("free"),
  onboardingStatus: z.enum(["pending", "bio_complete", "expertise_complete", "completed"]).default("pending"),
  socialLinks: z.object({
    instagram: z.string().optional(),
    website: z.string().url().optional(),
    linkedin: z.string().optional(),
  }).optional(),
});

export type InsertTrainerProfile = z.infer<typeof insertTrainerProfileSchema>;
export type TrainerProfile = typeof trainerProfiles.$inferSelect;

// TABLE: trainerInviteLinks - Client invite link system
// Trainers generate shareable links to invite clients
export const trainerInviteLinks = pgTable("trainer_invite_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerId: varchar("trainer_id").notNull(),
  code: varchar("code").notNull(), // Unique invite code (e.g., "TRAIN-ABC123")
  customMessage: text("custom_message"),
  targetProgramId: varchar("target_program_id"), // Optional: Pre-select specific program
  maxUses: integer("max_uses"), // null = unlimited
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: timestamp("expires_at"), // null = never expires
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("trainer_invite_code_unique").on(table.trainerId, table.code),
]);

export const insertTrainerInviteLinkSchema = createInsertSchema(trainerInviteLinks).omit({
  id: true,
  currentUses: true,
  lastUsedAt: true,
  createdAt: true,
});

export type InsertTrainerInviteLink = z.infer<typeof insertTrainerInviteLinkSchema>;
export type TrainerInviteLink = typeof trainerInviteLinks.$inferSelect;
