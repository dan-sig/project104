// ==========================================
// API ROUTES - Server Endpoints for Morphit
// ==========================================
// This file defines all API endpoints that the frontend can call
// Think of it as the "menu" of actions the app can perform
//
// PRIMARY USER-FACING CATEGORIES:
// 1. Authentication - Login, get user info, update profile
// 2. Onboarding - Complete setup, generate first program
// 3. Programs - Create, retrieve, regenerate workout programs
// 4. Workouts - Get daily workouts, mark complete, track progress
// 5. Exercises - Exercise library, swaps, progressions
// 6. Fitness Tests - Save assessments, track progress
// 7. Calorie Tracking - Calculate and log calories burned
// 8. Settings - Update preferences, nutrition goals, program regeneration
//
// ADDITIONAL ENDPOINTS (Advanced/Admin):
// - Exercise generation (AI-powered exercise library creation)
// - Analytics and reporting
// - Timer utilities for HIIT/interval training
// - Database utilities and admin operations
//
// HOW IT WORKS:
// Frontend calls → API endpoint → Database operation → Response to frontend
// Example: "GET /api/auth/user" → Fetch user from DB → Return user data
//
// AUTHENTICATION:
// Most endpoints require authentication (isAuthenticated middleware)
// This ensures users can only access their own data
//
// NOTE: This is a large file (~2600 lines). Look for section headers (====) to navigate
// ==========================================

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { fitnessAssessments, exercises, programExercises, programWorkouts, workoutSessions, equipment, users, workoutPrograms, workoutSets } from "@shared/schema";
import { eq } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateWorkoutProgram, suggestExerciseSwap, generateProgressionRecommendation } from "./ai-service";
import { generateComprehensiveExerciseLibrary, generateMasterExerciseDatabase, generateExercisesForEquipment } from "./ai-exercise-generator";
import { insertFitnessAssessmentSchema, insertWorkoutSessionSchema, patchWorkoutSessionSchema, insertWorkoutSetSchema, type FitnessAssessment, type ProgramWorkout, type Exercise } from "@shared/schema";
import { determineIntensityFromProgramType, calculateCaloriesBurned, poundsToKg } from "./calorie-calculator";
import { z } from "zod";
import { calculateAge } from "@shared/utils";
import { parseLocalDate, formatLocalDate, isSameCalendarDay, isBeforeCalendarDay, isAfterCalendarDay } from "@shared/dateUtils";
import { parsePromptToFitnessData, getExamplePrompts } from "./prompt-parser";
import { getWeekTheme } from "@shared/cycleConstants";
import OpenAI from "openai";
import { AnalyticsService } from "./analytics-service";

// Guard against duplicate route registration (prevents errors during hot reload)
let routesRegistered = false;

// ==========================================
// HELPER: Generate Workout Schedule
// ==========================================
// Creates individual workout sessions for the entire program duration
// 
// NEW APPROACH (selectedDates):
// - Accepts selectedDates array (YYYY-MM-DD strings)
// - Creates sessions ONLY for those specific dates
// - Assigns workouts sequentially (workout 1 → date 1, workout 2 → date 2, etc.)
//
// LEGACY APPROACH (dayOfWeek):
// - Loops through all days in the program duration (durationWeeks × 7 days)
// - For each day, checks if there's a matching programWorkout template by dayOfWeek
// - Creates sessions for matching days
//
// INPUT:
//   - programId: Which program these sessions belong to
//   - userId: Who owns these sessions
//   - programWorkouts: Template workouts (indexed or dayOfWeek-based)
//   - durationWeeks: Program duration in weeks (passed explicitly by caller)
//   - startDateString: Start date in YYYY-MM-DD format
//   - selectedDates: (Optional) Array of YYYY-MM-DD strings for NEW approach
//
// OUTPUT: Number of sessions created
//
// IMPORTANT: Cleans up existing future sessions before creating new ones
// This prevents duplicate sessions if user regenerates their program
async function generateWorkoutSchedule(
  programId: string, 
  userId: string, 
  programWorkouts: ProgramWorkout[], 
  durationWeeks: number, 
  startDateString: string,
  selectedDates?: string[]
) {
  try {
    // CRITICAL: Clean up any existing future sessions before creating new ones
    // This prevents duplicate key violations when regenerating programs
    console.log(`[SESSION-CLEANUP] Cleaning up existing sessions from ${startDateString} before creating new ones`);
    const cleanupResult = await storage.cleanupSessionsForRegeneration(userId, startDateString);
    console.log(`[SESSION-CLEANUP] Archived ${cleanupResult.archived} completed sessions, deleted ${cleanupResult.deleted} incomplete sessions`);
    
    // Fetch user to get currentWeekInCycle for weekTheme
    const user = await storage.getUser(userId);
    const weekTheme = user?.currentWeekInCycle ? getWeekTheme(user.currentWeekInCycle) : 'Learn';
    
    const sessions = [];
    
    // ==========================================
    // NEW APPROACH: Use selectedDates (date-based scheduling)
    // ==========================================
    if (selectedDates && selectedDates.length > 0) {
      console.log(`[SESSION-NEW] Creating sessions for ${selectedDates.length} selected dates`);
      
      // Filter workouts to only those with workoutIndex (new approach)
      const indexedWorkouts = programWorkouts.filter(pw => pw.workoutIndex !== null && pw.workoutIndex !== undefined);
      
      // Sort workouts by workoutIndex to ensure correct order
      indexedWorkouts.sort((a, b) => (a.workoutIndex || 0) - (b.workoutIndex || 0));
      
      // Create sessions for each selected date, assigning workouts sequentially
      for (let i = 0; i < selectedDates.length; i++) {
        const scheduledDateString = selectedDates[i];
        const workout = indexedWorkouts[i % indexedWorkouts.length]; // Cycle through workouts if needed
        
        if (workout) {
          const scheduledDate = parseLocalDate(scheduledDateString);
          const calendarDay = scheduledDate.getDay();
          const schemaDayOfWeek = calendarDay === 0 ? 7 : calendarDay;
          
          sessions.push({
            userId,
            programWorkoutId: workout.id,
            workoutName: workout.workoutName,
            scheduledDate: scheduledDateString,
            sessionDayOfWeek: schemaDayOfWeek,
            sessionType: (workout.workoutType ? 'workout' : 'rest') as 'workout' | 'rest',
            workoutType: workout.workoutType as 'strength' | 'cardio' | 'hiit' | 'mobility' | undefined,
            weekTheme,
            status: "scheduled" as const,
          });
        }
      }
      
      console.log(`[SESSION-NEW] Created ${sessions.length} sessions from selectedDates`);
    } 
    // ==========================================
    // LEGACY APPROACH: Use dayOfWeek (week-based scheduling)
    // ==========================================
    else {
      console.log(`[SESSION-LEGACY] Creating sessions using dayOfWeek approach for ${durationWeeks} weeks`);
      
      const today = parseLocalDate(startDateString);
      
      // Create a map of dayOfWeek to programWorkout for quick lookup
      const workoutsByDay = new Map<number, ProgramWorkout>();
      programWorkouts.forEach(pw => {
        if (pw.dayOfWeek !== null && pw.dayOfWeek !== undefined) {
          workoutsByDay.set(pw.dayOfWeek, pw);
        }
      });
      
      // Generate sessions starting from TODAY for the entire duration
      const totalDays = durationWeeks * 7;
      
      for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
        // Use a fresh Date object for each iteration to avoid mutation issues
        const scheduledDate = new Date(today.getTime());
        scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
        
        // Convert Date to YYYY-MM-DD string using shared utility
        const scheduledDateString = formatLocalDate(scheduledDate);
        
        // Get calendar day-of-week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const calendarDay = scheduledDate.getDay();
        
        // Convert to our schema format: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
        // JavaScript: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        // Schema: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
        const schemaDayOfWeek = calendarDay === 0 ? 7 : calendarDay;
        
        // Find the programWorkout for this day
        const programWorkout = workoutsByDay.get(schemaDayOfWeek);
        
        if (programWorkout) {
          sessions.push({
            userId,
            programWorkoutId: programWorkout.id,
            workoutName: programWorkout.workoutName,
            scheduledDate: scheduledDateString,
            sessionDayOfWeek: schemaDayOfWeek,
            sessionType: (programWorkout.workoutType ? 'workout' : 'rest') as 'workout' | 'rest',
            workoutType: programWorkout.workoutType as 'strength' | 'cardio' | 'hiit' | 'mobility' | undefined,
            weekTheme,
            status: "scheduled" as const,
          });
        }
      }
      
      console.log(`[SESSION-LEGACY] Created ${sessions.length} sessions from dayOfWeek mapping`);
    }
    
    console.log(`Creating ${sessions.length} workout sessions for program ${programId}`);
    
    // OPTIMIZATION: Use batch insert instead of loop for better performance
    await storage.createWorkoutSessionsBatch(sessions);
    
    console.log(`Successfully created ${sessions.length} workout sessions`);
    return sessions.length;
  } catch (error) {
    console.error("Error in generateWorkoutSchedule:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Guard against duplicate route registration
  if (routesRegistered) {
    console.log("[ROUTES] Routes already registered, skipping duplicate registration");
    return createServer(app);
  }
  console.log("[ROUTES] Registering routes for the first time");
  
  // Setup Replit Auth (required for all protected endpoints)
  await setupAuth(app);

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================
  // Endpoints for user authentication and profile management
  
  // GET /api/auth/user - Get current user's profile
  // Returns: User object with all profile data (name, settings, metrics, etc.)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user metrics (height and weight)
  app.patch('/api/auth/user/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { height, weight } = req.body;

      if (!height && !weight) {
        return res.status(400).json({ error: "At least one metric (height or weight) is required" });
      }

      const updateData: any = {};
      if (height !== undefined) updateData.height = height;
      if (weight !== undefined) updateData.weight = weight;

      // Recalculate BMR if weight and height are being updated
      const user = await storage.getUser(userId);
      if (user && user.dateOfBirth && (updateData.height || updateData.weight)) {
        const h = updateData.height || user.height;
        const w = updateData.weight || user.weight;
        
        if (h && w && user.dateOfBirth) {
          const age = Math.floor((new Date().getTime() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          const bmr = Math.round(10 * w + 6.25 * h - 5 * age + 5);
          updateData.bmr = bmr;
        }
      }

      await storage.updateUser(userId, updateData);
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user metrics:", error);
      res.status(500).json({ message: "Failed to update metrics" });
    }
  });

  // ==========================================
  // ONBOARDING ROUTES
  // ==========================================
  // Endpoints for new user setup and initial program generation
  
  // POST /api/onboarding-assessment/complete - Complete onboarding with all collected data
  // Receives: User profile, nutrition data, fitness test results (optional)
  // Returns: Success status
  // Side effect: Automatically generates first workout program
  app.post("/api/onboarding-assessment/complete", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { fitnessTest, weightsTest, experienceLevel, startDate, ...profileData} = req.body;
      
      // Convert dateOfBirth string to Date object if present
      if (profileData.dateOfBirth && typeof profileData.dateOfBirth === 'string') {
        profileData.dateOfBirth = new Date(profileData.dateOfBirth);
      }
      
      // Map frontend 'tdee' field to backend 'targetCalories' field
      if (profileData.tdee !== undefined) {
        profileData.targetCalories = profileData.tdee;
        delete profileData.tdee;
      }
      
      // Map experienceLevel to user.fitnessLevel for consistency with AI service
      if (experienceLevel) {
        profileData.fitnessLevel = experienceLevel;
      }
      
      // Reset week and cycle tracking for new program
      profileData.currentWeekInCycle = 1;  // Always start at Week 1 (Learn)
      profileData.cycleNumber = 1;          // Reset cycle counter
      
      // Update user profile with onboarding data
      if (Object.keys(profileData).length > 0) {
        await storage.updateUser(userId, profileData);
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(500).json({ error: "Failed to retrieve user after profile update" });
      }
      
      // Save fitness assessment (delete any same-day assessments first for idempotency)
      if (fitnessTest || weightsTest) {
        const assessmentData = {
          userId,
          experienceLevel: experienceLevel || profileData.fitnessLevel || "beginner",
          ...fitnessTest,
          ...weightsTest,
        };
        
        // Delete any existing same-day assessments to prevent duplicates on retry
        const existingAssessments = await storage.getUserFitnessAssessments(userId);
        const today = new Date();
        const todayAssessments = existingAssessments.filter(a => {
          const testDate = new Date(a.testDate);
          return testDate.toDateString() === today.toDateString();
        });
        
        // Delete same-day assessments via SQL to ensure idempotency
        if (todayAssessments.length > 0) {
          console.log(`[ONBOARDING] Removing ${todayAssessments.length} existing same-day assessment(s) to prevent duplicates`);
          for (const assessment of todayAssessments) {
            await db.delete(fitnessAssessments).where(eq(fitnessAssessments.id, assessment.id));
          }
        }
        
        await storage.createFitnessAssessment(assessmentData);
      }
      
      // Automatically generate workout program after onboarding
      console.log("[ONBOARDING] Automatically generating workout program after assessment completion");
      
      let latestAssessment = await storage.getCompleteFitnessProfile(userId);
      
      // If no assessment exists (user skipped test), create conservative defaults based on experience level
      if (!latestAssessment) {
        console.log("[ONBOARDING] No fitness assessment found. Using conservative defaults based on experience level:", user.fitnessLevel || "beginner");
        
        const conservativeExperienceLevel = user.fitnessLevel || "beginner";
        const conservativeDefaults: any = {
          userId,
          experienceLevel: conservativeExperienceLevel,
          testDate: new Date(),
        };
        
        // Set conservative bodyweight test defaults based on experience level
        if (conservativeExperienceLevel === "advanced") {
          conservativeDefaults.pushups = 15;
          conservativeDefaults.pullups = 5;
          conservativeDefaults.squats = 30;
          conservativeDefaults.mileTime = 9;
        } else if (conservativeExperienceLevel === "intermediate") {
          conservativeDefaults.pushups = 10;
          conservativeDefaults.pullups = 3;
          conservativeDefaults.squats = 20;
          conservativeDefaults.mileTime = 11;
        } else {
          conservativeDefaults.pushups = 5;
          conservativeDefaults.pullups = 0;
          conservativeDefaults.squats = 10;
          conservativeDefaults.mileTime = 15;
        }
        
        latestAssessment = conservativeDefaults;
      }

      const availableExercises = await storage.getAllExercises();
      if (availableExercises.length === 0) {
        console.error("[ONBOARDING] Master exercise database is empty. Returning success without program generation.");
        return res.json({ success: true });
      }

      // Calculate selectedDates from user.selectedDates if available (NEW approach)
      let selectedDates: string[] | undefined;
      if (user.selectedDates && user.selectedDates.length > 0) {
        selectedDates = user.selectedDates;
        console.log(`[ONBOARDING] Using selectedDates from user profile: ${selectedDates.join(', ')}`);
      } else {
        console.log(`[ONBOARDING] No selectedDates in user profile, using legacy selectedDays approach`);
      }

      console.log("[ONBOARDING] Generating program for user:", userId);
      const generatedProgram = await generateWorkoutProgram({
        user,
        latestAssessment,
        availableExercises,
        selectedDates,  // Pass selectedDates for new approach
      });

      // Archive any existing active programs
      const existingPrograms = await storage.getUserPrograms(userId);
      for (const oldProgram of existingPrograms) {
        if (oldProgram.isActive === 1) {
          await storage.updateWorkoutProgram(oldProgram.id, { isActive: 0 });
        }
      }

      // Save the generated program
      const newProgram = await storage.createWorkoutProgram({
        userId,
        programType: generatedProgram.programType || "AI Generated Program",
        weeklyStructure: generatedProgram.weeklyStructure || "Personalized training program",
        durationWeeks: generatedProgram.durationWeeks || 8,
        isActive: 1,
      });

      console.log("[ONBOARDING] Program generated successfully:", newProgram.id);

      // Save generated workout sessions and keep track of created programWorkouts
      const createdProgramWorkouts = [];
      for (const workout of generatedProgram.workouts) {
        const programWorkout = await storage.createProgramWorkout({
          programId: newProgram.id,
          workoutName: workout.workoutName,
          dayOfWeek: workout.dayOfWeek,           // LEGACY: may be undefined in new mode
          workoutIndex: workout.workoutIndex,     // NEW: sequential index (1, 2, 3, ...)
          workoutType: workout.workoutType || null,
          movementFocus: workout.movementFocus || [],
        });
        
        createdProgramWorkouts.push(programWorkout);

        for (const exercise of workout.exercises) {
          const matchingExercise = availableExercises.find(
            ex => ex.name.toLowerCase() === exercise.exerciseName.toLowerCase()
          );

          await storage.createProgramExercise({
            workoutId: programWorkout.id,
            exerciseId: matchingExercise?.id || null,
            equipment: exercise.equipment || "bodyweight",
            sets: exercise.sets,
            repsMin: exercise.repsMin || null,
            repsMax: exercise.repsMax || null,
            recommendedWeight: exercise.recommendedWeight || null,
            durationSeconds: exercise.durationSeconds || null,
            workSeconds: exercise.workSeconds || null,
            restSeconds: exercise.restSeconds,
            tempo: exercise.tempo || null,
            targetRPE: exercise.targetRPE || null,
            targetRIR: exercise.targetRIR || null,
            notes: exercise.notes || null,
            supersetGroup: exercise.supersetGroup || null,
            supersetOrder: exercise.supersetOrder || null,
            orderIndex: workout.exercises.indexOf(exercise),
          });
        }
      }

      console.log("[ONBOARDING] Workout sessions created, generating scheduled sessions");

      // Track which days have workouts to create rest days for remaining days (LEGACY only)
      const scheduledDays = new Set<number>();
      for (const workout of generatedProgram.workouts) {
        if (workout.dayOfWeek) {  // Only process if using legacy dayOfWeek approach
          scheduledDays.add(workout.dayOfWeek);
        }
      }
      
      // Create rest days for any days not scheduled (LEGACY only - new approach doesn't use rest days)
      if (scheduledDays.size > 0) {  // Only create rest days if using legacy approach
        for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
          if (!scheduledDays.has(dayOfWeek)) {
            const restDay = await storage.createProgramWorkout({
              programId: newProgram.id,
              dayOfWeek,
              workoutName: "Rest Day",
              movementFocus: [],
              workoutType: null,
            });
            createdProgramWorkouts.push(restDay);
          }
        }
      }

      // Generate workout schedule for entire program duration starting from TODAY
      // Use client-provided startDate (user's local timezone) with fallback to server date
      const startDateString = startDate || formatLocalDate(new Date());
      await generateWorkoutSchedule(
        newProgram.id, 
        userId, 
        createdProgramWorkouts, 
        newProgram.durationWeeks || 8, 
        startDateString,
        selectedDates  // Pass selectedDates for new approach
      );

      console.log("[ONBOARDING] Program generation complete");
      
      res.json({ success: true, programGenerated: true });
    } catch (error) {
      console.error("Complete onboarding assessment error:", error);
      res.status(500).json({ error: "Failed to complete onboarding assessment" });
    }
  });

  // Complete onboarding after OIDC login - saves assessment and program data
  app.post("/api/auth/complete-onboarding", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { fitnessTest, weightsTest, experienceLevel, generatedProgram, startDate, ...profileData } = req.body;
      
      // Check if user already has existing programs or assessments
      const existingPrograms = await storage.getUserPrograms(userId);
      const existingAssessments = await storage.getUserFitnessAssessments(userId);
      const hasActiveProgram = existingPrograms.some(p => p.isActive === 1);
      
      // If user has existing data, warn them before overwriting
      if (hasActiveProgram || existingAssessments.length > 0) {
        return res.status(200).json({ 
          existingData: true,
          hasPrograms: hasActiveProgram,
          hasAssessments: existingAssessments.length > 0
        });
      }
      
      // Update user profile with onboarding data
      if (Object.keys(profileData).length > 0) {
        await storage.updateUser(userId, profileData);
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(500).json({ error: "Failed to retrieve user after profile update" });
      }
      
      // Save fitness assessment if provided (best effort - don't fail if this errors)
      let savedAssessmentId: string | undefined;
      if (fitnessTest || weightsTest) {
        try {
          const assessmentData = {
            userId,
            experienceLevel: experienceLevel || profileData.fitnessLevel,
            ...fitnessTest,
            ...weightsTest,
          };
          const savedAssessment = await storage.createFitnessAssessment(assessmentData);
          savedAssessmentId = savedAssessment.id;
        } catch (assessmentError) {
          console.error("Failed to save fitness assessment during onboarding:", assessmentError);
          // Continue without assessment - program can still be created
        }
      }
      
      // Check if master exercise database has been populated
      const availableExercises = await storage.getAllExercises();
      if (availableExercises.length === 0) {
        console.error("Master exercise database is empty. Admin must populate via /api/admin/populate-master-exercises");
        return res.status(500).json({ 
          error: "Exercise database not initialized. Please contact support." 
        });
      }
      
      // Require pre-generated workout program
      if (!generatedProgram) {
        console.log("No pre-generated program provided in signup request");
        return res.status(400).json({ 
          error: "No workout program provided. Please generate a program before signing up." 
        });
      }
      
      // Save the pre-generated workout program - this MUST succeed
      console.log("Saving pre-generated program provided in onboarding request");
      const programData = generatedProgram;

      // Archive any existing active programs (fetch again in case they were just created)
      const programsToArchive = await storage.getUserPrograms(userId);
      for (const oldProgram of programsToArchive) {
        if (oldProgram.isActive === 1) {
          await storage.deleteIncompleteProgramSessions(oldProgram.id);
          await storage.updateWorkoutProgram(oldProgram.id, { 
            isActive: 0,
            archivedDate: new Date(),
            archivedReason: "replaced"
          });
        }
      }

      // Create the workout program
      const program = await storage.createWorkoutProgram({
        userId,
        fitnessAssessmentId: savedAssessmentId, // Will be undefined if assessment save failed
        programType: programData.programType,
        weeklyStructure: programData.weeklyStructure,
        durationWeeks: programData.durationWeeks,
        intensityLevel: determineIntensityFromProgramType(programData.programType),
        isActive: 1,
      });

      const scheduledDays = new Set<number>();
      const createdProgramWorkouts: ProgramWorkout[] = [];
      
      // Create all workout days
      for (const workout of programData.workouts) {
        scheduledDays.add(workout.dayOfWeek);
        
        const programWorkout = await storage.createProgramWorkout({
          programId: program.id,
          dayOfWeek: workout.dayOfWeek,
          workoutName: workout.workoutName,
          movementFocus: workout.movementFocus,
          workoutType: workout.workoutType,
        });
        createdProgramWorkouts.push(programWorkout);

        // Create exercises for this workout
        for (let i = 0; i < workout.exercises.length; i++) {
          const exercise = workout.exercises[i];
          const matchingExercise = availableExercises.find(
            ex => ex.name.toLowerCase() === exercise.exerciseName.toLowerCase()
          );

          if (matchingExercise) {
            await storage.createProgramExercise({
              workoutId: programWorkout.id,
              exerciseId: matchingExercise.id,
              equipment: exercise.equipment || null,
              orderIndex: i,
              sets: exercise.sets,
              repsMin: exercise.repsMin,
              repsMax: exercise.repsMax,
              recommendedWeight: exercise.recommendedWeight,
              restSeconds: exercise.restSeconds,
              tempo: exercise.tempo || null,
              notes: exercise.notes,
              supersetGroup: exercise.supersetGroup || null,
              supersetOrder: exercise.supersetOrder || null,
            });
          } else {
            console.warn(`Exercise not found in database: ${exercise.exerciseName}`);
          }
        }
      }
      
      // Create rest days for any days not scheduled
      for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
        if (!scheduledDays.has(dayOfWeek)) {
          const restDay = await storage.createProgramWorkout({
            programId: program.id,
            dayOfWeek,
            workoutName: "Rest Day",
            movementFocus: [],
            workoutType: null,
          });
          createdProgramWorkouts.push(restDay);
        }
      }
      
      // Generate workout schedule for entire program duration
      // Use provided startDate from frontend, or fallback to server's current date
      const startDateString = startDate || formatLocalDate(new Date());
      await generateWorkoutSchedule(program.id, userId, createdProgramWorkouts, programData.durationWeeks, startDateString);
      
      console.log(`Successfully created program ${program.id} with ${createdProgramWorkouts.length} workouts for user ${userId}`);
      
      res.json(user);
    } catch (error) {
      console.error("Onboarding completion error:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  // Force complete onboarding - bypasses existing data check (user confirmed replacement)
  app.post("/api/auth/complete-onboarding-force", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { fitnessTest, weightsTest, experienceLevel, generatedProgram, startDate, ...profileData } = req.body;
      
      // Update user profile with onboarding data
      if (Object.keys(profileData).length > 0) {
        await storage.updateUser(userId, profileData);
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(500).json({ error: "Failed to retrieve user after profile update" });
      }
      
      // Save fitness assessment if provided (best effort - don't fail if this errors)
      let savedAssessmentId: string | undefined;
      if (fitnessTest || weightsTest) {
        try {
          const assessmentData = {
            userId,
            experienceLevel: experienceLevel || profileData.fitnessLevel,
            ...fitnessTest,
            ...weightsTest,
          };
          const savedAssessment = await storage.createFitnessAssessment(assessmentData);
          savedAssessmentId = savedAssessment.id;
        } catch (assessmentError) {
          console.error("Failed to save fitness assessment during onboarding:", assessmentError);
          // Continue without assessment - program can still be created
        }
      }
      
      // Check if master exercise database has been populated
      const availableExercises = await storage.getAllExercises();
      if (availableExercises.length === 0) {
        console.error("Master exercise database is empty. Admin must populate via /api/admin/populate-master-exercises");
        return res.status(500).json({ 
          error: "Exercise database not initialized. Please contact support." 
        });
      }
      
      // Require pre-generated workout program
      if (!generatedProgram) {
        console.log("No pre-generated program provided in signup request");
        return res.status(400).json({ 
          error: "No workout program provided. Please generate a program before signing up." 
        });
      }
      
      // Save the pre-generated workout program - this MUST succeed
      console.log("Saving pre-generated program provided in onboarding request (force mode)");
      const programData = generatedProgram;

      // Archive any existing active programs
      const programsToArchive = await storage.getUserPrograms(userId);
      for (const oldProgram of programsToArchive) {
        if (oldProgram.isActive === 1) {
          await storage.deleteIncompleteProgramSessions(oldProgram.id);
          await storage.updateWorkoutProgram(oldProgram.id, { 
            isActive: 0,
            archivedDate: new Date(),
            archivedReason: "replaced"
          });
        }
      }

      // Create the workout program
      const program = await storage.createWorkoutProgram({
        userId,
        fitnessAssessmentId: savedAssessmentId,
        programType: programData.programType,
        weeklyStructure: programData.weeklyStructure,
        durationWeeks: programData.durationWeeks,
        intensityLevel: determineIntensityFromProgramType(programData.programType),
        isActive: 1,
      });

      const scheduledDays = new Set<number>();
      const createdProgramWorkouts: ProgramWorkout[] = [];
      
      // Create all workout days
      for (const workout of programData.workouts) {
        scheduledDays.add(workout.dayOfWeek);
        
        const programWorkout = await storage.createProgramWorkout({
          programId: program.id,
          dayOfWeek: workout.dayOfWeek,
          workoutName: workout.workoutName,
          movementFocus: workout.movementFocus,
          workoutType: workout.workoutType,
        });
        createdProgramWorkouts.push(programWorkout);

        // Create exercises for this workout
        for (let i = 0; i < workout.exercises.length; i++) {
          const exercise = workout.exercises[i];
          const matchingExercise = availableExercises.find(
            ex => ex.name.toLowerCase() === exercise.exerciseName.toLowerCase()
          );

          if (matchingExercise) {
            await storage.createProgramExercise({
              workoutId: programWorkout.id,
              exerciseId: matchingExercise.id,
              equipment: exercise.equipment || null,
              orderIndex: i,
              sets: exercise.sets,
              repsMin: exercise.repsMin,
              repsMax: exercise.repsMax,
              recommendedWeight: exercise.recommendedWeight,
              restSeconds: exercise.restSeconds,
              tempo: exercise.tempo || null,
              notes: exercise.notes,
              supersetGroup: exercise.supersetGroup || null,
              supersetOrder: exercise.supersetOrder || null,
            });
          } else {
            console.warn(`Exercise not found in database: ${exercise.exerciseName}`);
          }
        }
      }
      
      // Create rest days for any days not scheduled
      for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
        if (!scheduledDays.has(dayOfWeek)) {
          const restDay = await storage.createProgramWorkout({
            programId: program.id,
            dayOfWeek,
            workoutName: "Rest Day",
            movementFocus: [],
            workoutType: null,
          });
          createdProgramWorkouts.push(restDay);
        }
      }
      
      // Generate workout schedule for entire program duration
      // Use provided startDate from frontend, or fallback to server's current date
      const startDateString = startDate || formatLocalDate(new Date());
      await generateWorkoutSchedule(program.id, userId, createdProgramWorkouts, programData.durationWeeks, startDateString);
      
      console.log(`Successfully created program ${program.id} with ${createdProgramWorkouts.length} workouts for user ${userId} (force mode)`);
      
      res.json(user);
    } catch (error) {
      console.error("Onboarding completion error (force mode):", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  app.put("/api/user/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (updates.age !== undefined && (updates.age < 18 || updates.age > 100)) {
        return res.status(400).json({ error: "Age must be between 18 and 100" });
      }
      
      delete updates.bmr;
      delete updates.targetCalories;
      
      const hasPhysicalStatChange = updates.height !== undefined || updates.weight !== undefined || updates.age !== undefined;
      
      if (hasPhysicalStatChange) {
        const finalHeight = updates.height !== undefined ? updates.height : user.height;
        const finalWeight = updates.weight !== undefined ? updates.weight : user.weight;
        const finalAge = updates.age !== undefined ? updates.age : (user.dateOfBirth ? calculateAge(user.dateOfBirth) : null);
        
        if (finalHeight && finalWeight && finalAge) {
          const bmr = Math.round(10 * finalWeight + 6.25 * finalHeight - 5 * finalAge + 5);
          updates.bmr = bmr;
          updates.targetCalories = bmr;  // Set to maintenance by default
        }
      }
      
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.put("/api/user/unit-preference", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { unitPreference } = req.body;
      
      if (!unitPreference || !['imperial', 'metric'].includes(unitPreference)) {
        return res.status(400).json({ error: "Invalid unit preference. Must be 'imperial' or 'metric'" });
      }

      const updatedUser = await storage.updateUser(userId, {
        unitPreference
      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Update unit preference error:", error);
      res.status(500).json({ error: "Failed to update unit preference" });
    }
  });


  // Fitness Assessment routes
  app.post("/api/fitness-assessments", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Fitness assessment request. UserID:", userId);

      const validatedData = insertFitnessAssessmentSchema.parse({
        ...req.body,
        userId,
      });

      const assessment = await storage.createFitnessAssessment(validatedData);
      res.json(assessment);
    } catch (error) {
      console.error("Create assessment error:", error);
      res.status(500).json({ error: "Failed to create fitness assessment" });
    }
  });

  app.get("/api/fitness-assessments", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const assessments = await storage.getUserFitnessAssessments(userId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  app.get("/api/fitness-assessments/latest", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const assessment = await storage.getLatestFitnessAssessment(userId);
      res.json(assessment || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest assessment" });
    }
  });

  app.patch("/api/fitness-assessments/:id/override", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const assessmentId = req.params.id;
      const overrideData = req.body;

      // Verify the assessment belongs to the user
      const assessment = await storage.getFitnessAssessmentById(assessmentId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      // Update the assessment with override data
      const updatedAssessment = await storage.updateFitnessAssessmentOverride(assessmentId, overrideData);
      res.json(updatedAssessment);
    } catch (error) {
      console.error("Override assessment error:", error);
      res.status(500).json({ error: "Failed to update assessment override" });
    }
  });


  // Exercise routes
  app.post("/api/exercises/seed", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const existingExercises = await storage.getAllExercises();
      if (existingExercises.length > 0) {
        return res.json({ count: existingExercises.length, exercises: existingExercises, message: "Exercises already seeded" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let equipmentList = user.equipment || [];
      
      if (!equipmentList.includes("bodyweight")) {
        equipmentList = ["bodyweight", ...equipmentList];
      }

      if (equipmentList.length === 0 || (equipmentList.length === 1 && equipmentList[0] === "bodyweight")) {
        equipmentList = ["bodyweight"];
      }

      console.log(`Generating exercises for ${equipmentList.length} equipment types: ${equipmentList.join(", ")}`);
      const generatedExercises = await generateComprehensiveExerciseLibrary(equipmentList);
      console.log(`Generated ${generatedExercises.length} exercises`);

      const exercises = await Promise.all(
        generatedExercises.map(ex => storage.createExercise(ex))
      );
      
      res.json({ count: exercises.length, exercises });
    } catch (error) {
      console.error("Seed exercises error:", error);
      if (error instanceof Error && error.message.includes("API key")) {
        return res.status(500).json({ error: "AI API configuration error. Please check OpenAI API key." });
      }
      res.status(500).json({ error: "Failed to seed exercises. Please try again or contact support." });
    }
  });

  // Admin endpoint to populate master exercise database (ONE-TIME USE)
  app.post("/api/admin/populate-master-exercises", async (req: Request, res: Response) => {
    try {
      console.log("🔧 ADMIN: Starting master exercise database population...");
      
      const equipmentTypes = [
        "bodyweight", "dumbbells", "barbell", "kettlebell", "resistance bands",
        "cable machine", "pull-up bar", "trx", "medicine ball", "box", "jump rope", "foam roller", "yoga mat"
      ];

      // Generate ALL exercises first before touching the database
      console.log("  Generating all exercises (this may take 2-3 minutes)...");
      const allGeneratedExercises: any[] = [];
      
      for (const equipment of equipmentTypes) {
        try {
          console.log(`    Generating for ${equipment}...`);
          const exercises = await generateExercisesForEquipment(equipment);
          allGeneratedExercises.push(...exercises);
          console.log(`      ✓ ${exercises.length} exercises generated`);
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`      ✗ Failed for ${equipment}:`, error);
          throw new Error(`Exercise generation failed for ${equipment}: ${error}`);
        }
      }
      
      if (allGeneratedExercises.length === 0) {
        throw new Error("No exercises were generated");
      }
      
      console.log(`\n  ✓ Generation complete: ${allGeneratedExercises.length} exercises generated`);
      console.log("  Now replacing database contents...");
      
      // Only NOW clear and replace - all generation succeeded
      const existingExercises = await storage.getAllExercises();
      console.log(`  Clearing ${existingExercises.length} existing exercises...`);
      for (const ex of existingExercises) {
        await storage.deleteExercise(ex.id);
      }
      
      // Save all new exercises
      console.log(`  Saving ${allGeneratedExercises.length} new exercises...`);
      await Promise.all(
        allGeneratedExercises.map(ex => storage.createExercise(ex))
      );
      
      console.log(`\n✅ Master database population complete: ${allGeneratedExercises.length} exercises saved`);
      
      res.json({ 
        success: true,
        count: allGeneratedExercises.length, 
        message: `Successfully populated ${allGeneratedExercises.length} exercises across all equipment types`
      });
    } catch (error) {
      console.error("❌ Master exercise population error:", error);
      if (error instanceof Error && error.message.includes("API key")) {
        return res.status(500).json({ error: "AI API configuration error. Please check OpenAI API key." });
      }
      res.status(500).json({ error: `Failed to populate master exercises: ${error}` });
    }
  });

  // Admin endpoint to cleanup duplicate workout sessions (for testing environment)
  app.post("/api/admin/cleanup-duplicate-sessions", async (req: Request, res: Response) => {
    try {
      console.log("🔧 ADMIN: Starting duplicate session cleanup...");
      
      // Get all active (non-archived) sessions
      const allSessions = await db.query.workoutSessions.findMany({
        where: (sessions, { eq }) => eq(sessions.isArchived, 0),
        orderBy: (sessions, { desc }) => [desc(sessions.sessionDate)],
      });
      
      console.log(`  Found ${allSessions.length} total active sessions`);
      
      // Group sessions by userId + scheduledDate
      const sessionGroups = new Map<string, any[]>();
      
      for (const session of allSessions) {
        if (!session.scheduledDate) continue; // Skip sessions without scheduled dates
        
        const key = `${session.userId}|${session.scheduledDate}`;
        if (!sessionGroups.has(key)) {
          sessionGroups.set(key, []);
        }
        sessionGroups.get(key)!.push(session);
      }
      
      // Find duplicates (groups with more than one session)
      const duplicateGroups = Array.from(sessionGroups.entries())
        .filter(([_, sessions]) => sessions.length > 1);
      
      console.log(`  Found ${duplicateGroups.length} dates with duplicate sessions`);
      
      let deletedCount = 0;
      
      // For each duplicate group, keep the most recent one, delete the rest
      for (const [key, sessions] of duplicateGroups) {
        // Sort by sessionDate (most recent first)
        sessions.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
        
        const [toKeep, ...toDelete] = sessions;
        
        console.log(`  ${key}: Keeping session ${toKeep.id} (${toKeep.workoutName}), deleting ${toDelete.length} duplicates`);
        
        // Delete all but the first (most recent) session
        for (const session of toDelete) {
          await db.delete(workoutSessions).where(eq(workoutSessions.id, session.id));
          deletedCount++;
        }
      }
      
      console.log(`✅ Cleanup complete: Deleted ${deletedCount} duplicate sessions`);
      
      res.json({
        success: true,
        duplicateGroups: duplicateGroups.length,
        deletedSessions: deletedCount,
        message: `Successfully removed ${deletedCount} duplicate sessions from ${duplicateGroups.length} dates`
      });
    } catch (error) {
      console.error("❌ Duplicate session cleanup error:", error);
      res.status(500).json({ error: `Failed to cleanup duplicate sessions: ${error}` });
    }
  });

  // Admin endpoint to clear all user data (for fresh start with new system)
  // ⚠️ WARNING: This permanently deletes ALL user data
  // ✅ PRESERVES: Exercise database and equipment list (core app functionality)
  // 🔒 PROTECTED: Development mode only + authentication + confirmation key
  // 📝 USAGE: POST /api/admin/clear-all-user-data with body { "confirm": "DELETE_ALL_USER_DATA" }
  app.post("/api/admin/clear-all-user-data", isAuthenticated, async (req: any, res: Response) => {
    try {
      // Security check 1: Only allow in development environment
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ 
          error: "Forbidden",
          message: "This endpoint is only available in development mode"
        });
      }

      // Security check 2: Require explicit confirmation to prevent accidental deletion
      const { confirm } = req.body;
      if (confirm !== "DELETE_ALL_USER_DATA") {
        return res.status(400).json({ 
          error: "Missing or invalid confirmation key",
          message: "To proceed, send request with body: { \"confirm\": \"DELETE_ALL_USER_DATA\" }"
        });
      }

      const userId = req.user?.claims?.sub;
      console.log(`🔧 ADMIN: User ${userId} initiated complete user data wipe`);
      console.log("⚠️  This will delete ALL users, programs, sessions, and assessments");
      console.log("✅ Preserving: Exercise database and equipment list");
      
      // Track what gets deleted
      const deletionStats = {
        workoutSets: 0,
        workoutSessions: 0,
        programExercises: 0,
        programWorkouts: 0,
        workoutPrograms: 0,
        fitnessAssessments: 0,
        users: 0,
      };

      // STEP 1: Delete workout_sets (child of workout_sessions)
      console.log("  [1/7] Deleting workout sets...");
      const sets = await db.select().from(workoutSets);
      deletionStats.workoutSets = sets.length;
      if (sets.length > 0) {
        await db.delete(workoutSets);
      }
      console.log(`    ✓ Deleted ${deletionStats.workoutSets} workout sets`);

      // STEP 2: Delete workout_sessions (child of users and program_workouts)
      console.log("  [2/7] Deleting workout sessions...");
      const sessions = await db.select().from(workoutSessions);
      deletionStats.workoutSessions = sessions.length;
      if (sessions.length > 0) {
        await db.delete(workoutSessions);
      }
      console.log(`    ✓ Deleted ${deletionStats.workoutSessions} workout sessions`);

      // STEP 3: Delete program_exercises (child of program_workouts)
      console.log("  [3/7] Deleting program exercises...");
      const programExs = await db.select().from(programExercises);
      deletionStats.programExercises = programExs.length;
      if (programExs.length > 0) {
        await db.delete(programExercises);
      }
      console.log(`    ✓ Deleted ${deletionStats.programExercises} program exercises`);

      // STEP 4: Delete program_workouts (child of workout_programs)
      console.log("  [4/7] Deleting program workouts...");
      const programWos = await db.select().from(programWorkouts);
      deletionStats.programWorkouts = programWos.length;
      if (programWos.length > 0) {
        await db.delete(programWorkouts);
      }
      console.log(`    ✓ Deleted ${deletionStats.programWorkouts} program workouts`);

      // STEP 5: Delete workout_programs (child of users)
      console.log("  [5/7] Deleting workout programs...");
      const programs = await db.select().from(workoutPrograms);
      deletionStats.workoutPrograms = programs.length;
      if (programs.length > 0) {
        await db.delete(workoutPrograms);
      }
      console.log(`    ✓ Deleted ${deletionStats.workoutPrograms} workout programs`);

      // STEP 6: Delete fitness_assessments (child of users)
      console.log("  [6/7] Deleting fitness assessments...");
      const assessments = await db.select().from(fitnessAssessments);
      deletionStats.fitnessAssessments = assessments.length;
      if (assessments.length > 0) {
        await db.delete(fitnessAssessments);
      }
      console.log(`    ✓ Deleted ${deletionStats.fitnessAssessments} fitness assessments`);

      // STEP 7: Delete users (parent table)
      console.log("  [7/7] Deleting users...");
      const allUsers = await db.select().from(users);
      deletionStats.users = allUsers.length;
      if (allUsers.length > 0) {
        await db.delete(users);
      }
      console.log(`    ✓ Deleted ${deletionStats.users} users`);

      // Verify core data is preserved
      const exerciseCount = await db.select().from(exercises);
      const equipmentCount = await db.select().from(equipment);
      
      console.log("\n✅ User data wipe complete!");
      console.log(`✅ Preserved: ${exerciseCount.length} exercises, ${equipmentCount.length} equipment types`);
      console.log("📊 Deletion Summary:");
      console.log(`   - Users: ${deletionStats.users}`);
      console.log(`   - Programs: ${deletionStats.workoutPrograms}`);
      console.log(`   - Sessions: ${deletionStats.workoutSessions}`);
      console.log(`   - Sets: ${deletionStats.workoutSets}`);
      console.log(`   - Assessments: ${deletionStats.fitnessAssessments}`);
      console.log(`   - Total deleted: ${Object.values(deletionStats).reduce((a, b) => a + b, 0)} records`);

      res.json({
        success: true,
        deleted: deletionStats,
        preserved: {
          exercises: exerciseCount.length,
          equipment: equipmentCount.length,
        },
        message: "All user data successfully deleted. Exercise database and equipment preserved.",
      });
    } catch (error) {
      console.error("❌ User data wipe error:", error);
      res.status(500).json({ error: `Failed to clear user data: ${error}` });
    }
  });

  app.get("/api/exercises", async (req: Request, res: Response) => {
    try {
      const exercises = await storage.getAllExercises();
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  app.get("/api/exercises/by-equipment", async (req: Request, res: Response) => {
    try {
      const equipment = req.query.equipment as string;
      const equipmentArray = equipment ? equipment.split(",") : [];
      const exercises = await storage.getExercisesByEquipment(equipmentArray);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  // Get all equipment from reference table (auto-populated from exercises database)
  app.get("/api/equipment", async (req: Request, res: Response) => {
    try {
      const allEquipment = await db
        .select()
        .from(equipment)
        .orderBy(equipment.displayOrder);
      res.json(allEquipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  // Helper function to estimate recommended weight based on bodyweight test
  function estimateWeightFromBodyweightTest(
    exerciseEquipment: string[],
    movementPattern: string,
    assessment: FitnessAssessment
  ): number | undefined {
    // Only estimate for exercises that require weight
    const needsWeight = exerciseEquipment.some(eq => 
      ['dumbbells', 'barbell', 'kettlebell', 'medicine ball', 'resistance bands'].includes(eq.toLowerCase())
    );
    
    if (!needsWeight) {
      return undefined;
    }
    
    const pushups = assessment.pushups || 0;
    const pullups = assessment.pullups || 0;
    const squats = assessment.squats || 0;
    
    // Categorize by movement pattern
    const isPressing = ['horizontal_push', 'vertical_push', 'press'].some(p => movementPattern.toLowerCase().includes(p));
    const isPulling = ['horizontal_pull', 'vertical_pull', 'pull', 'row'].some(p => movementPattern.toLowerCase().includes(p));
    const isLowerBody = ['squat', 'lunge', 'hinge', 'leg'].some(p => movementPattern.toLowerCase().includes(p));
    
    // Estimate weights for dumbbells (per hand) in lbs
    if (isPressing && pushups > 0) {
      if (pushups < 15) return 17.5; // 15-20 lbs average
      if (pushups < 30) return 25;   // 20-30 lbs average
      return 35;                      // 30-40 lbs average
    }
    
    if (isPulling && pullups > 0) {
      if (pullups < 5) return 17.5;  // 15-20 lbs average
      if (pullups < 10) return 25;   // 20-30 lbs average
      return 35;                      // 30-40 lbs average
    }
    
    if (isLowerBody && squats > 0) {
      if (squats < 25) return 17.5;  // 15-20 lbs average
      if (squats < 50) return 30;    // 25-35 lbs average
      return 42.5;                    // 35-50 lbs average
    }
    
    // Default conservative estimate if we can't categorize
    return 20;
  }

  // Workout Program routes
  
  // POST /api/programs/generate-from-prompt - Generate program from natural language prompt
  // Receives: { prompt: string, confirmed?: boolean }
  // Returns: { parsedData, needsAssessment, needsMoreInfo, missingFields, currentSettings?, confirmationMessage? }
  app.post("/api/programs/generate-from-prompt", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, confirmed } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Prompt is required" });
      }
      
      console.log("[PROMPT-PARSE] Parsing user prompt:", prompt, "confirmed:", confirmed);
      
      // Get current user settings
      const currentUser = await storage.getUser(userId);
      const hasExistingSettings = currentUser && currentUser.daysPerWeek && currentUser.workoutDuration && currentUser.equipment;
      
      // Parse the prompt using OpenAI
      const parseResult = await parsePromptToFitnessData(prompt);
      
      if (!parseResult.success) {
        return res.json({
          success: false,
          error: parseResult.error,
          missingFields: parseResult.missingFields,
          needsMoreInfo: true,
        });
      }
      
      const parsedData = parseResult.data!;
      console.log("[PROMPT-PARSE] Successfully extracted data:", parsedData);
      
      // If user has existing settings and hasn't confirmed, ask for confirmation
      if (hasExistingSettings && !confirmed) {
        const cycleNames = { flow: "Morphit Flow", build: "Morphit Build", strong: "Morphit Strong", move: "Morphit Move" };
        const cycleName = cycleNames[currentUser.focusCycle as keyof typeof cycleNames] || "Morphit Move";
        
        return res.json({
          success: false,
          needsConfirmation: true,
          currentSettings: {
            daysPerWeek: currentUser.daysPerWeek,
            workoutDuration: currentUser.workoutDuration,
            equipment: currentUser.equipment,
            focusCycle: currentUser.focusCycle,
            cycleName: cycleName,
            fitnessLevel: currentUser.fitnessLevel,
          },
          parsedData, // Include what we parsed from the prompt
          confirmationMessage: `I see you currently train ${currentUser.daysPerWeek} days/week with ${currentUser.workoutDuration}-minute sessions using ${currentUser.equipment?.join(', ') || 'bodyweight'} equipment on ${cycleName} at ${currentUser.fitnessLevel} level. Would you like to keep these settings or make changes?`,
        });
      }
      
      // Update user profile with extracted data
      await storage.updateUser(userId, {
        daysPerWeek: parsedData.daysPerWeek,
        workoutDuration: parsedData.sessionDuration,
        equipment: parsedData.equipment,
        focusCycle: parsedData.focusCycle,
        fitnessLevel: parsedData.experienceLevel,
      });
      
      res.json({
        success: true,
        parsedData,
        needsAssessment: parsedData.wantsAssessment,
        needsMoreInfo: false,
      });
    } catch (error) {
      console.error("[PROMPT-PARSE] Error:", error);
      res.status(500).json({ error: "Failed to parse your fitness goals. Please try rephrasing." });
    }
  });
  
  // POST /api/profile/update-from-prompt - Update user profile from natural language without regenerating program
  // Receives: { prompt: string, confirmed?: boolean }
  // Returns: { success, updatedFields, message } or { needsConfirmation, confirmationMessage, parsedChanges, currentSettings }
  app.post("/api/profile/update-from-prompt", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, confirmed = false } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Prompt is required" });
      }
      
      console.log("[PROFILE-UPDATE] Parsing user prompt:", prompt, "confirmed:", confirmed);
      
      // Get current user settings
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Parse the prompt using OpenAI
      const parseResult = await parsePromptToFitnessData(prompt);
      
      if (!parseResult.success) {
        return res.json({
          success: false,
          error: parseResult.error,
          missingFields: parseResult.missingFields,
          needsMoreInfo: true,
        });
      }
      
      const parsedData = parseResult.data!;
      console.log("[PROFILE-UPDATE] Successfully extracted data:", parsedData);
      
      // Build update object with only the fields that were specified
      const updateData: any = {};
      const updatedFields: string[] = [];
      const changedFields: string[] = [];
      
      if (parsedData.daysPerWeek !== undefined) {
        updateData.daysPerWeek = parsedData.daysPerWeek;
        updatedFields.push(`${parsedData.daysPerWeek} workout days per week`);
        if (parsedData.daysPerWeek !== currentUser.daysPerWeek) {
          changedFields.push(`days per week from ${currentUser.daysPerWeek || 'unset'} to ${parsedData.daysPerWeek}`);
        }
      }
      
      if (parsedData.sessionDuration !== undefined) {
        updateData.workoutDuration = parsedData.sessionDuration;
        updatedFields.push(`${parsedData.sessionDuration}-minute sessions`);
        if (parsedData.sessionDuration !== currentUser.workoutDuration) {
          changedFields.push(`session duration from ${currentUser.workoutDuration || 'unset'} to ${parsedData.sessionDuration} minutes`);
        }
      }
      
      if (parsedData.equipment && parsedData.equipment.length > 0) {
        updateData.equipment = parsedData.equipment;
        updatedFields.push(`Equipment: ${parsedData.equipment.join(', ')}`);
        const currentEq = currentUser.equipment?.sort().join(', ') || 'none';
        const newEq = parsedData.equipment.sort().join(', ');
        if (currentEq !== newEq) {
          changedFields.push(`equipment from ${currentEq} to ${newEq}`);
        }
      }
      
      if (parsedData.focusCycle) {
        updateData.focusCycle = parsedData.focusCycle;
        const cycleName = parsedData.focusCycle.charAt(0).toUpperCase() + parsedData.focusCycle.slice(1);
        updatedFields.push(`Focus: Morphit ${cycleName}`);
        if (parsedData.focusCycle !== currentUser.focusCycle) {
          const currentCycle = currentUser.focusCycle ? currentUser.focusCycle.charAt(0).toUpperCase() + currentUser.focusCycle.slice(1) : 'unset';
          changedFields.push(`focus cycle from ${currentCycle} to ${cycleName}`);
        }
      }
      
      if (parsedData.experienceLevel) {
        updateData.fitnessLevel = parsedData.experienceLevel;
        updatedFields.push(`Experience: ${parsedData.experienceLevel}`);
        if (parsedData.experienceLevel !== currentUser.fitnessLevel) {
          changedFields.push(`experience level from ${currentUser.fitnessLevel || 'unset'} to ${parsedData.experienceLevel}`);
        }
      }
      
      // If no fields to update
      if (Object.keys(updateData).length === 0) {
        return res.json({
          success: false,
          error: "No changes detected in your request",
          needsMoreInfo: true,
        });
      }
      
      // If not confirmed yet, return confirmation request
      if (!confirmed) {
        console.log("[PROFILE-UPDATE] Requesting confirmation for changes:", changedFields);
        
        // Build unchanged fields list for context
        const unchangedFields: string[] = [];
        if (parsedData.daysPerWeek === undefined && currentUser.daysPerWeek) {
          unchangedFields.push(`${currentUser.daysPerWeek} days per week`);
        }
        if (parsedData.sessionDuration === undefined && currentUser.workoutDuration) {
          unchangedFields.push(`${currentUser.workoutDuration}-minute sessions`);
        }
        if ((!parsedData.equipment || parsedData.equipment.length === 0) && currentUser.equipment?.length) {
          unchangedFields.push(`${currentUser.equipment.join(', ')} equipment`);
        }
        if (!parsedData.focusCycle && currentUser.focusCycle) {
          const cycleName = currentUser.focusCycle.charAt(0).toUpperCase() + currentUser.focusCycle.slice(1);
          unchangedFields.push(`Morphit ${cycleName} focus`);
        }
        
        const confirmationMessage = changedFields.length > 0
          ? `Got it! I'll update your profile to: ${updatedFields.join(', ')}. ${unchangedFields.length > 0 ? `Your ${unchangedFields.join(', ')} will stay the same. ` : ''}Accept these changes and generate your program?`
          : `I'll update your profile to: ${updatedFields.join(', ')}. Accept these changes and generate your program?`;
        
        return res.json({
          success: false,
          needsConfirmation: true,
          confirmationMessage,
          parsedChanges: updatedFields,
          updateData,
          currentSettings: {
            daysPerWeek: currentUser.daysPerWeek,
            workoutDuration: currentUser.workoutDuration,
            equipment: currentUser.equipment,
            focusCycle: currentUser.focusCycle,
            fitnessLevel: currentUser.fitnessLevel,
          },
        });
      }
      
      // Confirmed - Apply the changes
      console.log("[PROFILE-UPDATE] Applying confirmed changes:", updateData);
      await storage.updateUser(userId, updateData);
      
      res.json({
        success: true,
        updatedFields,
        message: updatedFields.length > 0 
          ? `Updated: ${updatedFields.join(', ')}`
          : "No changes detected in your request",
      });
    } catch (error) {
      console.error("[PROFILE-UPDATE] Error:", error);
      res.status(500).json({ error: "Failed to update your profile. Please try rephrasing." });
    }
  });
  
  // GET /api/programs/example-prompts - Get example prompts for user guidance
  app.get("/api/programs/example-prompts", (req: Request, res: Response) => {
    res.json({ examples: getExamplePrompts() });
  });
  
  app.post("/api/programs/generate", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Validate days per week (only 3, 4, or 5 days supported for proper week-level programming)
      if (user.daysPerWeek && ![3, 4, 5].includes(user.daysPerWeek)) {
        return res.status(400).json({ 
          error: "Invalid daysPerWeek. Only 3, 4, or 5 days per week are supported." 
        });
      }

      let latestAssessment = await storage.getCompleteFitnessProfile(userId);
      
      // If no assessment exists (user skipped test), create conservative defaults based on experience level
      if (!latestAssessment) {
        console.log("[PROGRAM] No fitness assessment found. Using conservative defaults based on experience level:", user.fitnessLevel || "beginner");
        
        // Create a conservative default assessment based on user's experience level
        const experienceLevel = user.fitnessLevel || "beginner";
        const conservativeDefaults: any = {
          userId,
          experienceLevel,
          testDate: new Date(),
        };
        
        // Set conservative bodyweight test defaults based on experience level
        if (experienceLevel === "advanced") {
          conservativeDefaults.pushups = 15;
          conservativeDefaults.pullups = 5;
          conservativeDefaults.squats = 30;
          conservativeDefaults.mileTime = 9;
        } else if (experienceLevel === "intermediate") {
          conservativeDefaults.pushups = 10;
          conservativeDefaults.pullups = 3;
          conservativeDefaults.squats = 20;
          conservativeDefaults.mileTime = 11;
        } else {
          conservativeDefaults.pushups = 5;
          conservativeDefaults.pullups = 0;
          conservativeDefaults.squats = 10;
          conservativeDefaults.mileTime = 15;
        }
        
        latestAssessment = conservativeDefaults;
      }

      const availableExercises = await storage.getAllExercises();
      if (availableExercises.length === 0) {
        console.error("Master exercise database is empty. Admin must populate via /api/admin/populate-master-exercises");
        return res.status(500).json({ 
          error: "Exercise database not initialized. Please contact support." 
        });
      }

      console.log("Generating program with complete fitness profile:", {
        hasPushups: !!latestAssessment.pushups,
        hasPullups: !!latestAssessment.pullups,
        hasBenchPress1RM: !!latestAssessment.benchPress1rm,
        hasSquat1RM: !!latestAssessment.squat1rm,
        focusCycle: user.focusCycle,
      });

      // Calculate selectedDates from user.selectedDates if available (NEW approach)
      // This provides specific YYYY-MM-DD dates for the next N workouts
      let selectedDates: string[] | undefined;
      if (user.selectedDates && user.selectedDates.length > 0) {
        selectedDates = user.selectedDates;
        console.log(`[PROGRAM] Using selectedDates from user profile: ${selectedDates.join(', ')}`);
      } else {
        console.log(`[PROGRAM] No selectedDates in user profile, using legacy selectedDays approach`);
      }

      console.log("[TEMPLATE] Starting program generation with focus cycle:", user.focusCycle);
      const generatedProgram = await generateWorkoutProgram({
        user,
        latestAssessment,
        availableExercises,
        selectedDates,  // Pass selectedDates to new approach
      });
      console.log("[TEMPLATE] Program generation completed successfully");

      const existingPrograms = await storage.getUserPrograms(userId);
      for (const oldProgram of existingPrograms) {
        if (oldProgram.isActive === 1) {
          // Delete incomplete workout sessions from old program before archiving
          await storage.deleteIncompleteProgramSessions(oldProgram.id);
          
          await storage.updateWorkoutProgram(oldProgram.id, { 
            isActive: 0,
            archivedDate: new Date(),
            archivedReason: "replaced"
          });
        }
      }

      const program = await storage.createWorkoutProgram({
        userId,
        fitnessAssessmentId: latestAssessment.id,
        programType: generatedProgram.programType,
        weeklyStructure: generatedProgram.weeklyStructure,
        durationWeeks: generatedProgram.durationWeeks,
        intensityLevel: determineIntensityFromProgramType(generatedProgram.programType),
        isActive: 1,
      });

      const scheduledDays = new Set<number>();
      const createdProgramWorkouts: ProgramWorkout[] = [];
      
      for (const workout of generatedProgram.workouts) {
        // Track dayOfWeek for legacy rest day creation (if present)
        if (workout.dayOfWeek) {
          scheduledDays.add(workout.dayOfWeek);
        }
        
        const programWorkout = await storage.createProgramWorkout({
          programId: program.id,
          dayOfWeek: workout.dayOfWeek,         // LEGACY: may be undefined in new mode
          workoutIndex: workout.workoutIndex,   // NEW: sequential index (1, 2, 3, ...)
          workoutName: workout.workoutName,
          movementFocus: workout.movementFocus,
          workoutType: workout.workoutType,
        });
        createdProgramWorkouts.push(programWorkout);

        for (let i = 0; i < workout.exercises.length; i++) {
          const exercise = workout.exercises[i];
          const matchingExercise = availableExercises.find(
            ex => ex.name.toLowerCase() === exercise.exerciseName.toLowerCase()
          );

          if (matchingExercise) {
            // Use AI-provided weight, or fallback to estimation if not provided
            let recommendedWeight = exercise.recommendedWeight;
            if (!recommendedWeight && !exercise.isWarmup) {
              recommendedWeight = estimateWeightFromBodyweightTest(
                matchingExercise.equipment || [],
                matchingExercise.movementPattern,
                latestAssessment
              );
            }
            
            await storage.createProgramExercise({
              workoutId: programWorkout.id,
              exerciseId: matchingExercise.id,
              orderIndex: i,
              sets: exercise.sets,
              repsMin: exercise.repsMin,
              repsMax: exercise.repsMax,
              recommendedWeight,
              durationSeconds: exercise.durationSeconds,
              workSeconds: exercise.workSeconds,
              restSeconds: exercise.restSeconds,
              tempo: exercise.tempo || null,
              targetRPE: exercise.targetRPE,
              targetRIR: exercise.targetRIR,
              notes: exercise.notes,
              supersetGroup: exercise.supersetGroup || null,
              supersetOrder: exercise.supersetOrder || null,
            });
          }
        }
      }
      
      for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
        if (!scheduledDays.has(dayOfWeek)) {
          const restDay = await storage.createProgramWorkout({
            programId: program.id,
            dayOfWeek,
            workoutName: "Rest Day",
            movementFocus: [],
            workoutType: null,
          });
          createdProgramWorkouts.push(restDay);
        }
      }

      // Clean up sessions from TODAY onwards only (never touch historical sessions)
      // Always use server's current date for cleanup, regardless of requested program start date
      const todayString = formatLocalDate(new Date());
      const { archived, deleted } = await storage.cleanupSessionsForRegeneration(userId, todayString);
      console.log(`[GENERATE] Archived ${archived} completed sessions, deleted ${deleted} incomplete sessions from ${todayString} onwards`);

      // Generate workout schedule starting from client-requested date
      const startDateString = startDate || todayString;
      await generateWorkoutSchedule(
        program.id, 
        userId, 
        createdProgramWorkouts, 
        generatedProgram.durationWeeks, 
        startDateString,
        selectedDates  // Pass selectedDates for new approach
      );

      // Remove any duplicate sessions that may have been created
      const duplicatesRemoved = await storage.removeDuplicateSessions(userId);
      if (duplicatesRemoved > 0) {
        console.log(`[GENERATE] Removed ${duplicatesRemoved} duplicate session(s) after schedule generation`);
      }

      res.json({ program, generatedProgram });
    } catch (error) {
      console.error("Generate program error:", error);
      res.status(500).json({ error: "Failed to generate workout program" });
    }
  });

  // Regenerate program endpoint (alias to generate for Settings page)
  app.post("/api/programs/regenerate", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, selectedDates } = req.body;
      console.log("[REGENERATE] Received request with selectedDates:", selectedDates, "length:", selectedDates?.length);
      
      // CRITICAL: Advance week BEFORE AI generation so workouts get correct week parameters
      if (selectedDates && Array.isArray(selectedDates) && selectedDates.length > 0) {
        const currentUser = await storage.getUser(userId);
        if (!currentUser) {
          return res.status(404).json({ error: "User not found" });
        }
        
        const isRepeatCycle = currentUser?.selectedDates && currentUser.selectedDates.length > 0;
        const updateData: any = { selectedDates };
        
        if (isRepeatCycle) {
          // User is repeating the cycle - advance to next week and increment cycle number
          const newCycleNumber = (currentUser.cycleNumber || 0) + 1;
          const newWeekInCycle = ((currentUser.currentWeekInCycle || 1) % 4) + 1; // 1→2→3→4→1
          
          updateData.cycleNumber = newCycleNumber;
          updateData.currentWeekInCycle = newWeekInCycle;
          
          console.log(`[WEEK-PROGRESSION] User advancing from Week ${currentUser.currentWeekInCycle} to Week ${newWeekInCycle}, Cycle ${newCycleNumber}`);
        }
        
        await storage.updateUser(userId, updateData);
        console.log(`[REGENERATE] Saved selectedDates for new 7-day cycle:`, selectedDates);
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let latestAssessment = await storage.getCompleteFitnessProfile(userId);
      
      // If no assessment exists (user skipped test), create conservative defaults based on experience level
      if (!latestAssessment) {
        console.log("[PROGRAM] No fitness assessment found. Using conservative defaults based on experience level:", user.fitnessLevel || "beginner");
        
        // Create a conservative default assessment based on user's experience level
        const experienceLevel = user.fitnessLevel || "beginner";
        const conservativeDefaults: any = {
          userId,
          experienceLevel,
          testDate: new Date(),
        };
        
        // Set conservative bodyweight test defaults based on experience level
        if (experienceLevel === "advanced") {
          conservativeDefaults.pushups = 15;
          conservativeDefaults.pullups = 5;
          conservativeDefaults.squats = 30;
          conservativeDefaults.mileTime = 9;
        } else if (experienceLevel === "intermediate") {
          conservativeDefaults.pushups = 10;
          conservativeDefaults.pullups = 3;
          conservativeDefaults.squats = 20;
          conservativeDefaults.mileTime = 11;
        } else {
          conservativeDefaults.pushups = 5;
          conservativeDefaults.pullups = 0;
          conservativeDefaults.squats = 10;
          conservativeDefaults.mileTime = 15;
        }
        
        latestAssessment = conservativeDefaults;
      }

      const availableExercises = await storage.getAllExercises();
      if (availableExercises.length === 0) {
        console.error("Master exercise database is empty. Admin must populate via /api/admin/populate-master-exercises");
        return res.status(500).json({ 
          error: "Exercise database not initialized. Please contact support." 
        });
      }

      console.log("Regenerating program with complete fitness profile:", {
        hasPushups: !!latestAssessment.pushups,
        hasPullups: !!latestAssessment.pullups,
        hasBenchPress1RM: !!latestAssessment.benchPress1rm,
        hasSquat1RM: !!latestAssessment.squat1rm,
        focusCycle: user.focusCycle,
      });

      console.log("[TEMPLATE] Starting program regeneration with focus cycle:", user.focusCycle);
      const generatedProgram = await generateWorkoutProgram({
        user,
        latestAssessment,
        availableExercises,
        selectedDates,  // Pass selectedDates for date-based scheduling
      });
      console.log("[TEMPLATE] Program regeneration completed successfully");

      const existingPrograms = await storage.getUserPrograms(userId);
      for (const oldProgram of existingPrograms) {
        if (oldProgram.isActive === 1) {
          await storage.updateWorkoutProgram(oldProgram.id, { 
            isActive: 0,
            archivedDate: new Date(),
            archivedReason: "replaced"
          });
        }
      }

      const program = await storage.createWorkoutProgram({
        userId,
        fitnessAssessmentId: latestAssessment.id,
        programType: generatedProgram.programType,
        weeklyStructure: generatedProgram.weeklyStructure,
        durationWeeks: generatedProgram.durationWeeks,
        intensityLevel: determineIntensityFromProgramType(generatedProgram.programType),
        isActive: 1,
      });

      const scheduledDays = new Set<number>();
      const createdProgramWorkouts: ProgramWorkout[] = [];
      
      for (const workout of generatedProgram.workouts) {
        // Track dayOfWeek for legacy rest day creation (if present)
        if (workout.dayOfWeek) {
          scheduledDays.add(workout.dayOfWeek);
        }
        
        const programWorkout = await storage.createProgramWorkout({
          programId: program.id,
          dayOfWeek: workout.dayOfWeek,         // LEGACY: may be undefined in new mode
          workoutIndex: workout.workoutIndex,   // NEW: sequential index (1, 2, 3, ...)
          workoutName: workout.workoutName,
          movementFocus: workout.movementFocus,
          workoutType: workout.workoutType,
        });
        createdProgramWorkouts.push(programWorkout);

        for (let i = 0; i < workout.exercises.length; i++) {
          const exercise = workout.exercises[i];
          const matchingExercise = availableExercises.find(
            ex => ex.name.toLowerCase() === exercise.exerciseName.toLowerCase()
          );

          if (matchingExercise) {
            // Use AI-provided weight, or fallback to estimation if not provided
            let recommendedWeight = exercise.recommendedWeight;
            if (!recommendedWeight && !exercise.isWarmup) {
              recommendedWeight = estimateWeightFromBodyweightTest(
                matchingExercise.equipment || [],
                matchingExercise.movementPattern,
                latestAssessment
              );
            }
            
            await storage.createProgramExercise({
              workoutId: programWorkout.id,
              exerciseId: matchingExercise.id,
              orderIndex: i,
              sets: exercise.sets,
              repsMin: exercise.repsMin,
              repsMax: exercise.repsMax,
              recommendedWeight,
              durationSeconds: exercise.durationSeconds,
              workSeconds: exercise.workSeconds,
              restSeconds: exercise.restSeconds,
              tempo: exercise.tempo || null,
              targetRPE: exercise.targetRPE,
              targetRIR: exercise.targetRIR,
              notes: exercise.notes,
              supersetGroup: exercise.supersetGroup || null,
              supersetOrder: exercise.supersetOrder || null,
            });
          }
        }
      }
      
      for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
        if (!scheduledDays.has(dayOfWeek)) {
          const restDay = await storage.createProgramWorkout({
            programId: program.id,
            dayOfWeek,
            workoutName: "Rest Day",
            movementFocus: [],
            workoutType: null,
          });
          createdProgramWorkouts.push(restDay);
        }
      }

      // Clean up sessions from TODAY onwards only (never touch historical sessions)
      // Always use server's current date for cleanup, regardless of requested program start date
      const todayString = formatLocalDate(new Date());
      const { archived, deleted } = await storage.cleanupSessionsForRegeneration(userId, todayString);
      console.log(`[REGENERATE] Archived ${archived} completed sessions, deleted ${deleted} incomplete sessions from ${todayString} onwards`);

      // Generate workout schedule starting from client-requested date
      const startDateString = startDate || todayString;
      await generateWorkoutSchedule(
        program.id, 
        userId, 
        createdProgramWorkouts, 
        generatedProgram.durationWeeks, 
        startDateString,
        selectedDates  // Pass selectedDates for new approach
      );

      // Remove any duplicate sessions that may have been created
      const duplicatesRemoved = await storage.removeDuplicateSessions(userId);
      if (duplicatesRemoved > 0) {
        console.log(`[REGENERATE] Removed ${duplicatesRemoved} duplicate session(s) after schedule generation`);
      }

      res.json({ program, generatedProgram });
    } catch (error) {
      console.error("Regenerate program error:", error);
      res.status(500).json({ error: "Failed to regenerate workout program" });
    }
  });

  app.post("/api/programs/preview", async (req: Request, res: Response) => {
    try {
      const { 
        experienceLevel, 
        fitnessTest, 
        weightsTest, 
        focusCycle,
        equipment, 
        workoutDuration,
        daysPerWeek,
        unitPreference,
        height,
        weight,
        dateOfBirth
      } = req.body;

      if (!equipment || !Array.isArray(equipment)) {
        return res.status(400).json({ error: "Equipment must be an array" });
      }

      // Validate days per week (only 3, 4, or 5 days supported for proper week-level programming)
      if (daysPerWeek && ![3, 4, 5].includes(daysPerWeek)) {
        return res.status(400).json({ 
          error: "Invalid daysPerWeek. Only 3, 4, or 5 days per week are supported." 
        });
      }

      // If no equipment selected, default to bodyweight
      const finalEquipment = equipment.length === 0 ? ["bodyweight"] : equipment;

      const tempUser = {
        id: "temp-preview-user",
        username: "preview",
        equipment: finalEquipment,
        workoutDuration: workoutDuration || 60,
        daysPerWeek: daysPerWeek || 3,
        focusCycle: focusCycle || "move",
        unitPreference: unitPreference || "imperial",
        fitnessLevel: experienceLevel || "beginner",
        weight: weight,
        height: height,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      };

      const tempAssessment = {
        id: "temp-preview-assessment",
        userId: "temp-preview-user",
        experienceLevel: experienceLevel || "beginner",
        ...fitnessTest,
        ...weightsTest,
        createdAt: new Date(),
      };

      const availableExercises = await storage.getAllExercises();
      if (availableExercises.length === 0) {
        console.error("Master exercise database is empty. Admin must populate via /api/admin/populate-master-exercises");
        return res.status(500).json({ 
          error: "Exercise database not initialized. Please try again later." 
        });
      }

      const generatedProgram = await generateWorkoutProgram({
        user: tempUser as any,
        latestAssessment: tempAssessment as any,
        availableExercises,
      });

      const workoutsWithExercises = generatedProgram.workouts.map((workout) => {
        const exercisesWithDetails = workout.exercises.map((ex) => {
          const matchingExercise = availableExercises.find(
            exercise => exercise.name.toLowerCase() === ex.exerciseName.toLowerCase()
          );
          
          return {
            ...ex,
            exercise: matchingExercise || {
              id: 'unknown',
              name: ex.exerciseName,
              description: '',
              movementPattern: 'unknown',
              equipment: [],
              difficulty: 'beginner',
              primaryMuscles: [],
              secondaryMuscles: [],
              exerciseType: 'main',
              liftType: 'compound',
              isCorrective: 0,
              formTips: []
            }
          };
        });
        
        return { ...workout, exercises: exercisesWithDetails };
      });

      const enrichedProgram = {
        ...generatedProgram,
        workouts: workoutsWithExercises
      };

      res.json(enrichedProgram);
    } catch (error) {
      console.error("Generate preview program error:", error);
      res.status(500).json({ error: "Failed to generate workout program preview" });
    }
  });

  app.get("/api/home-data", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // Remove any duplicate sessions before loading data (safety net)
      const duplicatesRemoved = await storage.removeDuplicateSessions(userId);
      if (duplicatesRemoved > 0) {
        console.log(`[HOME-DATA] Removed ${duplicatesRemoved} duplicate session(s) during home data load`);
      }

      // Fetch all home page data in parallel for optimal performance
      const [user, activeProgram, sessions, fitnessAssessments] = await Promise.all([
        storage.getUser(userId),
        storage.getUserActiveProgram(userId),
        storage.getUserSessions(userId),
        storage.getUserFitnessAssessments(userId),
      ]);

      res.json({
        user: user || null,
        activeProgram: activeProgram || null,
        sessions: sessions || [],
        fitnessAssessments: fitnessAssessments || [],
      });
    } catch (error) {
      console.error("Home data fetch error:", error);
      res.status(500).json({ error: "Failed to fetch home page data" });
    }
  });

  app.get("/api/programs/active", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const program = await storage.getUserActiveProgram(userId);
      res.json(program || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active program" });
    }
  });

  // ==========================================
  // ANALYTICS & INSIGHTS ROUTES
  // ==========================================
  
  // POST /api/insights/prompt - Generate natural language insights about workout progress
  // Receives: { prompt: string, level?: "1" | "2" | "3" }
  // Returns: { success: true, insights: string, metrics: object } or { success: false, error: string }
  app.post("/api/insights/prompt", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, level = "2" } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      // Validate level
      if (!["1", "2", "3"].includes(level)) {
        return res.status(400).json({ success: false, error: "Level must be '1', '2', or '3'" });
      }

      console.log(`[INSIGHTS] Generating insights for user ${userId}, level ${level}`);

      // Create analytics service instance
      const analyticsService = new AnalyticsService();
      
      let metrics: any;
      let levelDescription: string;

      try {
        // Calculate metrics based on level
        if (level === "1") {
          // Level 1: Post-workout metrics (need most recent completed session)
          levelDescription = "post-workout";
          const sessions = await storage.getUserSessions(userId);
          const completedSessions = sessions.filter(s => s.status === 'complete');
          
          if (completedSessions.length === 0) {
            return res.status(404).json({ 
              success: false, 
              error: "No completed workouts found. Complete a workout first to see post-workout insights." 
            });
          }

          // Get most recent completed session
          const recentSession = completedSessions.sort((a, b) => 
            new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
          )[0];

          metrics = await analyticsService.calculateLevel1Metrics(userId, recentSession.id);
        } else if (level === "2") {
          // Level 2: Weekly metrics (default)
          levelDescription = "weekly";
          metrics = await analyticsService.calculateLevel2Metrics(userId);
        } else {
          // Level 3: Cycle metrics
          levelDescription = "cycle";
          metrics = await analyticsService.calculateLevel3Metrics(userId);
        }
      } catch (metricsError) {
        console.error("[INSIGHTS] Error calculating metrics:", metricsError);
        return res.status(500).json({ 
          success: false, 
          error: `Failed to calculate ${levelDescription} metrics. ${metricsError instanceof Error ? metricsError.message : 'Please try again.'}` 
        });
      }

      // Check for OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables."
        });
      }

      // Initialize OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Construct system prompt
      const systemPrompt = `You are a fitness analytics assistant helping users understand their workout progress. 
You have access to their workout metrics and should provide helpful, motivating, and actionable insights.

Guidelines:
- Be encouraging and positive while being honest about the data
- Provide specific, actionable recommendations based on the metrics
- Use the actual numbers from the metrics to support your insights
- Keep responses concise but informative (2-4 paragraphs)
- If the user asks about something not in the metrics, politely explain what data you have available`;

      // Construct user prompt with metrics
      const userPrompt = `The user asked: "${prompt}"

Here are their ${levelDescription} workout metrics:
${JSON.stringify(metrics, null, 2)}

Provide a helpful, motivating response that addresses their question using this data.`;

      // Call OpenAI to generate insights
      let insights: string;
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        insights = completion.choices[0].message.content || "Unable to generate insights at this time.";
      } catch (openaiError) {
        console.error("[INSIGHTS] OpenAI error:", openaiError);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to generate insights. Please try again." 
        });
      }

      console.log(`[INSIGHTS] Successfully generated insights for level ${level}`);

      // Transform metrics to match UI expectations
      let uiMetrics: any = {};
      
      if (level === "1") {
        // Level 1: Post-workout metrics
        uiMetrics = {
          totalVolume: metrics.totalVolume,
          avgRPE: metrics.avgRPE,
          workDensity: metrics.workDensity,
          totalSets: metrics.totalSets,
          avgSessionDuration: metrics.sessionDuration,
          patternDistribution: metrics.patternDistribution,
          bestSets: metrics.bestSets,
        };
      } else if (level === "2") {
        // Level 2: Weekly metrics - map to UI field names
        // Calculate total duration across all sessions (not average)
        const totalDuration = metrics.avgSessionDuration * metrics.workoutsCompleted;
        const avgDuration = totalDuration || 1; // Avoid division by zero
        
        uiMetrics = {
          totalSessions: metrics.workoutsCompleted,
          totalVolume: metrics.totalVolumeThisWeek,
          avgRPE: metrics.avgRPE,
          adherencePercent: metrics.adherencePercent,
          avgWorkDensity: totalDuration > 0 ? metrics.totalVolumeThisWeek / totalDuration : 0, // Volume per minute across all sessions
          avgSessionDuration: metrics.avgSessionDuration,
          weeklyTrend: metrics.totalVolumePreviousWeeks,
          patternBalance: metrics.patternVolumePercent,
          currentStreak: metrics.currentStreak,
        };
      } else {
        // Level 3: Cycle metrics
        uiMetrics = {
          totalSessions: metrics.weeksCompleted * 3, // Approximate
          totalVolume: metrics.totalWorkCompleted,
          volumePerMinute: metrics.volumePerMinute,
          patternBalanceIndex: metrics.patternBalanceIndex,
          cycleProgressionScore: metrics.cycleProgressionScore,
          bestLifts: metrics.bestLifts,
          rpeDistribution: metrics.rpeDistribution,
          recommendation: metrics.nextPhaseRecommendation,
        };
      }

      res.json({
        success: true,
        insights,
        metrics: uiMetrics,
      });
    } catch (error) {
      console.error("[INSIGHTS] Unexpected error:", error);
      res.status(500).json({ 
        success: false, 
        error: "An unexpected error occurred. Please try again." 
      });
    }
  });

  // ==========================================
  // ENDPOINT: Check 7-Day Cycle Completion
  // ==========================================
  // Detects when all workouts in the current 7-day cycle are complete
  // Used to trigger cycle completion prompt with options to repeat or create new program
  //
  // LOGIC:
  // 1. Get user's active program
  // 2. Find all non-archived workout sessions for that program
  // 3. Check if ALL are completed (handles rescheduled workouts properly)
  // 4. Return shouldPrompt: true if cycle is complete
  //
  // RESPONSE:
  // {
  //   shouldPrompt: boolean,
  //   cycleNumber: number,
  //   completedWorkouts: number,
  //   totalCycleWorkouts: number,
  //   selectedDates: string[]
  // }
  app.get("/api/cycles/completion-check", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // Get user data 
      const user = await storage.getUser(userId);
      if (!user) {
        return res.json({ shouldPrompt: false, reason: "no_user" });
      }

      // Get active program
      const activeProgram = await storage.getUserActiveProgram(userId);
      if (!activeProgram) {
        return res.json({ shouldPrompt: false, reason: "no_active_program" });
      }

      // Get all non-archived sessions
      const allSessions = await storage.getUserSessions(userId);
      
      // Get all non-archived workout sessions from current program
      // This includes rescheduled workouts that may not match selectedDates
      const currentCycleWorkouts = allSessions.filter(s => 
        s.sessionType === "workout" && 
        s.isArchived === 0
      );

      // Count completed workout sessions (only fully completed, not ended early)
      const completedWorkouts = currentCycleWorkouts.filter(s => 
        s.status === 'complete'
      );

      // Cycle is complete when ALL workout sessions are completed
      const isCycleComplete = currentCycleWorkouts.length > 0 && 
                             completedWorkouts.length === currentCycleWorkouts.length;

      res.json({
        shouldPrompt: isCycleComplete,
        cycleNumber: user.cycleNumber || 1,
        completedWorkouts: completedWorkouts.length,
        totalCycleWorkouts: currentCycleWorkouts.length,
        selectedDates: user.selectedDates,
        reason: isCycleComplete ? "cycle_complete" : "not_yet"
      });
    } catch (error) {
      console.error("Cycle completion check error:", error);
      res.status(500).json({ error: "Failed to check cycle completion" });
    }
  });

  app.get("/api/programs/archived", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const allPrograms = await storage.getUserPrograms(userId);
      const archivedPrograms = allPrograms.filter(p => p.isActive === 0 && p.archivedDate !== null);
      res.json(archivedPrograms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch archived programs" });
    }
  });

  app.get("/api/program-workouts/:programId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const program = await storage.getWorkoutProgram(req.params.programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      if (program.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to access this program" });
      }

      const workouts = await storage.getProgramWorkouts(req.params.programId);
      res.json(workouts);
    } catch (error) {
      console.error("Fetch program workouts error:", error);
      res.status(500).json({ error: "Failed to fetch program workouts" });
    }
  });

  app.get("/api/programs/:programId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const program = await storage.getWorkoutProgram(req.params.programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      if (program.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to access this program" });
      }

      const workouts = await storage.getProgramWorkouts(program.id);
      const workoutsWithExercises = await Promise.all(
        workouts.map(async (workout) => {
          const exercises = await storage.getWorkoutExercises(workout.id);
          const exercisesWithDetails = await Promise.all(
            exercises.map(async (ex) => {
              const exercise = await storage.getExercise(ex.exerciseId);
              return { ...ex, exercise };
            })
          );
          return { ...workout, exercises: exercisesWithDetails };
        })
      );

      res.json({ ...program, workouts: workoutsWithExercises });
    } catch (error) {
      console.error("Fetch program error:", error);
      res.status(500).json({ error: "Failed to fetch program" });
    }
  });

  app.patch("/api/programs/exercises/:exerciseId/update-weight", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const { recommendedWeight, repsMin, repsMax } = req.body;
      
      const exercise = await storage.getProgramExercise(req.params.exerciseId);
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      // Verify ownership: exercise -> workout -> program -> userId
      const workout = await storage.getProgramWorkout(exercise.workoutId);
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }

      const program = await storage.getWorkoutProgram(workout.programId);
      if (!program || program.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this exercise" });
      }

      const updates: Partial<any> = {};
      if (recommendedWeight !== undefined) {
        updates.recommendedWeight = parseFloat(recommendedWeight);
      }
      if (repsMin !== undefined) {
        updates.repsMin = parseInt(repsMin);
      }
      if (repsMax !== undefined) {
        updates.repsMax = parseInt(repsMax);
      }

      const updatedExercise = await storage.updateProgramExercise(req.params.exerciseId, updates);

      res.json(updatedExercise);
    } catch (error) {
      console.error("Update exercise error:", error);
      res.status(500).json({ error: "Failed to update exercise" });
    }
  });

  app.patch("/api/programs/exercises/:exerciseId/swap", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const { newExerciseId, equipment } = req.body;
      
      if (!newExerciseId) {
        return res.status(400).json({ error: "New exercise ID is required" });
      }

      const programExercise = await storage.getProgramExercise(req.params.exerciseId);
      if (!programExercise) {
        return res.status(404).json({ error: "Program exercise not found" });
      }

      // Verify ownership: exercise -> workout -> program -> userId
      const workout = await storage.getProgramWorkout(programExercise.workoutId);
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }

      const program = await storage.getWorkoutProgram(workout.programId);
      if (!program || program.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to swap this exercise" });
      }

      const newExercise = await storage.getExercise(newExerciseId);
      if (!newExercise) {
        return res.status(404).json({ error: "New exercise not found" });
      }

      const updates: any = { 
        exerciseId: newExerciseId,
        equipment: equipment || null, // Always update equipment field, clear if not provided
      };

      const updatedExercise = await storage.updateProgramExercise(req.params.exerciseId, updates);

      res.json(updatedExercise);
    } catch (error) {
      console.error("Swap exercise error:", error);
      res.status(500).json({ error: "Failed to swap exercise" });
    }
  });

  // Workout Session routes
  app.post("/api/workout-sessions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // Use currentDate from frontend if provided, otherwise use server's date as fallback
      const currentDateString = req.body.currentDate || formatLocalDate(new Date());
      const today = parseLocalDate(currentDateString);
      
      // Calculate current day of week in ISO format (1=Monday, 7=Sunday)
      const dayOfWeek = today.getDay();
      const sessionDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

      const validatedData = insertWorkoutSessionSchema.parse({
        ...req.body,
        userId,
        sessionDayOfWeek,
        scheduledDate: req.body.scheduledDate || currentDateString,
      });

      // Validate that the programWorkoutId exists and belongs to user's program
      let workoutName: string | undefined;
      if (validatedData.programWorkoutId) {
        const programWorkout = await storage.getProgramWorkout(validatedData.programWorkoutId);
        if (!programWorkout) {
          return res.status(404).json({ error: "Program workout not found" });
        }

        workoutName = programWorkout.workoutName;

        // Verify the workout belongs to a program owned by the user
        const program = await storage.getWorkoutProgram(programWorkout.programId);
        if (!program || program.userId !== userId) {
          return res.status(403).json({ error: "Unauthorized access to program workout" });
        }

        // Look for existing pre-scheduled session (calendar-based system)
        const userSessions = await storage.getUserSessions(userId);
        
        // Find the earliest incomplete pre-scheduled session for this workout
        // Pre-scheduled sessions have status="scheduled" and scheduledDate set
        const incompleteSessions = userSessions
          .filter((s: any) => {
            return s.programWorkoutId === validatedData.programWorkoutId && 
                   s.status === 'scheduled' && 
                   s.scheduledDate !== null;
          })
          .sort((a: any, b: any) => {
            const dateA = parseLocalDate(a.scheduledDate).getTime();
            const dateB = parseLocalDate(b.scheduledDate).getTime();
            return dateA - dateB; // Ascending order - earliest first
          });
        
        const existingScheduledSession = incompleteSessions[0];

        // If we found a pre-scheduled session, update it instead of creating new
        if (existingScheduledSession) {
          // Don't update scheduledDate, sessionType, or workoutType - keep original values
          // Only update status, completed, session metadata
          const { scheduledDate, sessionType, workoutType, ...updateData } = validatedData;
          
          const updatedSession = await storage.updateWorkoutSession(existingScheduledSession.id, {
            ...updateData,
            // sessionDate now comes from client (user's local time)
          });
          
          return res.json(updatedSession);
        }

        // If no incomplete sessions found, this workout is complete - don't create duplicates
        if (validatedData.status === 'complete') {
          return res.status(400).json({ 
            error: "No incomplete sessions available for this workout" 
          });
        }
      }

      const session = await storage.createWorkoutSession({
        ...validatedData,
        workoutName,
      });
      res.json(session);
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ error: "Failed to create workout session" });
    }
  });

  // Convert rest day session to cardio session with user-selected type
  app.post("/api/programs/sessions/cardio/:date", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const scheduledDate = req.params.date;
      const cardioType = req.body?.cardioType || 'zone-2'; // Default to zone-2 if not specified

      if (!scheduledDate) {
        return res.status(400).json({ error: "date parameter is required" });
      }

      // Get user's active program
      const activeProgram = await storage.getUserActiveProgram(userId);
      if (!activeProgram) {
        return res.status(404).json({ error: "No active program found" });
      }

      // Parse the scheduled date
      const sessionScheduledDate = parseLocalDate(scheduledDate);

      // Find the existing session on this date (exclude archived and skipped sessions)
      const existingSessions = await storage.getUserSessions(userId);
      const sessionsOnDate = existingSessions.filter((s: any) => {
        if (!s.scheduledDate || s.status === 'archived' || s.status === 'skipped') return false;
        const existingDate = parseLocalDate(s.scheduledDate);
        return formatLocalDate(existingDate) === formatLocalDate(sessionScheduledDate);
      });

      console.log('[CARDIO] Date:', scheduledDate, 'Type:', cardioType, 'Sessions found for this date:', sessionsOnDate.length, sessionsOnDate.map((s: any) => ({ id: s.id, type: s.sessionType, name: s.workoutName })));
      
      // Filter to only REST sessions (sessionType === 'rest')
      const restSessions = sessionsOnDate.filter((s: any) => s.sessionType === 'rest');
      
      if (restSessions.length === 0) {
        // No rest sessions found - this date might already have cardio or a workout
        if (sessionsOnDate.length > 0) {
          console.log('[CARDIO] No rest sessions found, but found workout sessions');
          return res.status(400).json({ error: "This is already a workout day. You can only add cardio to rest days." });
        }
        console.log('[CARDIO] No sessions found for this date');
        return res.status(404).json({ error: "No session found for this date" });
      }
      
      // Select the rest session to convert (most recent one)
      const sessionToConvert = restSessions[0];
      
      // Delete ALL other sessions for this date except the one we're converting
      // This ensures only one session exists per date (enforced by unique constraint)
      const duplicatesToDelete = sessionsOnDate.filter((s: any) => s.id !== sessionToConvert.id);
      if (duplicatesToDelete.length > 0) {
        console.warn(`[CARDIO] Cleaning up ${duplicatesToDelete.length} duplicate sessions for date ${scheduledDate}. IDs:`, duplicatesToDelete.map((s: any) => s.id));
        for (const session of duplicatesToDelete) {
          await db.delete(workoutSessions).where(eq(workoutSessions.id, session.id));
        }
        console.log(`[CARDIO] Successfully deleted ${duplicatesToDelete.length} duplicate sessions`);
      }

      // Configure cardio based on selected type
      let workoutName: string;
      let duration: number;
      let notes: string;

      switch (cardioType) {
        case 'hiit':
          workoutName = 'HIIT Cardio';
          duration = 8; // 5-10 minutes
          notes = 'High-intensity interval training. Alternate between max effort and recovery periods for cardiovascular improvement and calorie burn.';
          break;
        case 'steady-state':
          workoutName = 'Steady State Cardio';
          duration = 12; // 10-15 minutes
          notes = 'Moderate continuous cardio. Maintain a steady, sustainable pace for endurance and heart health.';
          break;
        case 'zone-2':
        default:
          workoutName = 'Zone 2 Cardio';
          duration = 18; // 15-20 minutes
          notes = 'Low-intensity aerobic work. Target: Zone 2 heart rate (60-70% max HR) for fat burning and recovery.';
          break;
      }

      // Get user data for exercise selection
      const user = await storage.getUser(userId);
      const latestAssessment = await storage.getLatestFitnessAssessment(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const fitnessLevel = latestAssessment?.experienceLevel || user.fitnessLevel || 'beginner';
      
      // Fetch cardio exercises from database
      const allExercises = await db.select().from(exercises);
      const cardioExercises = allExercises.filter(ex => 
        ex.movementPattern === "cardio" &&
        ex.equipment?.some(eq => user.equipment?.includes(eq) || eq === "bodyweight")
      );

      // Filter by cardio type
      let selectedExercise: any;
      if (cardioType === 'hiit') {
        // HIIT: prefer exercises with duration tracking (intervals)
        selectedExercise = cardioExercises.find(ex => 
          ex.trackingType === "duration" || 
          ex.name.toLowerCase().includes("hiit") ||
          ex.name.toLowerCase().includes("sprint")
        ) || cardioExercises[0];
      } else if (cardioType === 'steady-state') {
        // Steady-state: prefer jogging, rowing, cycling
        selectedExercise = cardioExercises.find(ex =>
          ex.name.toLowerCase().includes("jog") ||
          ex.name.toLowerCase().includes("row") ||
          ex.name.toLowerCase().includes("cycle")
        ) || cardioExercises[0];
      } else {
        // Zone 2: prefer low-intensity options
        selectedExercise = cardioExercises.find(ex =>
          ex.name.toLowerCase().includes("walk") ||
          ex.name.toLowerCase().includes("zone")
        ) || cardioExercises[0];
      }

      // Create a programWorkout for this cardio session
      const programWorkout = await db.insert(programWorkouts).values({
        programId: activeProgram.id,
        dayOfWeek: new Date(scheduledDate).getDay() || 7,
        workoutName,
        movementFocus: ['cardio'],
        workoutType: 'cardio'
      }).returning();

      if (!programWorkout[0]) {
        return res.status(500).json({ error: "Failed to create program workout" });
      }

      // Create exercise parameters and link to programWorkout
      if (selectedExercise) {
        let sets, workSeconds, restSeconds, durationSeconds;
        
        if (cardioType === 'hiit' && selectedExercise.trackingType === 'duration') {
          // HIIT intervals
          workSeconds = fitnessLevel === 'beginner' ? 20 : fitnessLevel === 'intermediate' ? 30 : 40;
          restSeconds = fitnessLevel === 'beginner' ? 40 : fitnessLevel === 'intermediate' ? 30 : 20;
          const intervalDuration = workSeconds + restSeconds;
          sets = Math.floor((duration * 60) / intervalDuration);
          durationSeconds = workSeconds;
        } else {
          // Continuous cardio
          sets = 1;
          durationSeconds = duration * 60;
          restSeconds = 0;
        }

        // Create program exercise linked to the programWorkout
        await db.insert(programExercises).values({
          workoutId: programWorkout[0].id,
          exerciseId: selectedExercise.id,
          sets,
          durationSeconds,
          workSeconds: cardioType === 'hiit' ? workSeconds : undefined,
          restSeconds,
          orderIndex: 1,
          equipment: selectedExercise.equipment[0] || 'bodyweight'
        });

        console.log('[CARDIO] Created cardio exercise:', { 
          name: selectedExercise.name, 
          type: cardioType, 
          sets, 
          duration: cardioType === 'hiit' ? `${sets} x ${workSeconds}s work / ${restSeconds}s rest` : `${duration} min`
        });
      }

      // Update the session to link to the programWorkout
      console.log('[CARDIO] About to update session with:', { sessionType: "workout", workoutType: "cardio", workoutName, notes, status: "scheduled", programWorkoutId: programWorkout[0].id });
      
      const updatedSession = await storage.updateWorkoutSession(sessionToConvert.id, {
        sessionType: "workout",
        workoutType: "cardio",
        workoutName,
        notes,
        status: "scheduled",
        programWorkoutId: programWorkout[0].id
      });

      if (!updatedSession) {
        return res.status(500).json({ error: "Failed to update session to cardio" });
      }

      console.log('[CARDIO] Successfully converted rest session to', cardioType, 'cardio. Updated session:', { id: updatedSession.id, workoutName: updatedSession.workoutName, workoutType: updatedSession.workoutType });
      res.json(updatedSession);
    } catch (error) {
      console.error("Convert to cardio session error:", error);
      res.status(500).json({ error: "Failed to convert to cardio session" });
    }
  });

  app.post("/api/workout-sessions/archive-old", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // Use currentDate from frontend if provided, otherwise use server's date as fallback
      const currentDateString = req.body.currentDate || formatLocalDate(new Date());
      const today = parseLocalDate(currentDateString);

      // Get all sessions for this user
      const allSessions = await storage.getUserSessions(userId);

      // Archive any completed or skipped sessions from previous dates
      const sessionsToArchive = allSessions.filter((session: any) => {
        if (!session.scheduledDate) return false;
        if (session.status === 'archived') return false; // Already archived
        
        const sessionDate = parseLocalDate(session.scheduledDate);
        
        // Archive if:
        // 1. Session is from a previous date (by calendar date) AND
        // 2. Session is completed (completed=1) OR skipped (status='skipped')
        if (isBeforeCalendarDay(sessionDate, today)) {
          return session.completed === 1 || session.status === 'skipped';
        }
        return false;
      });

      // Archive each session
      const archivedCount = await Promise.all(
        sessionsToArchive.map((session: any) =>
          storage.updateWorkoutSession(session.id, { status: 'archived' })
        )
      );

      console.log(`[ARCHIVE] Archived ${archivedCount.length} old sessions for user ${userId}`);
      
      res.json({ 
        archivedCount: archivedCount.length,
        message: `Archived ${archivedCount.length} old sessions`
      });
    } catch (error) {
      console.error("Archive old sessions error:", error);
      res.status(500).json({ error: "Failed to archive old sessions" });
    }
  });

  // Get missed workouts - detects pending workouts from past dates
  app.get("/api/workout-sessions/missed", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const currentDateString = req.query.currentDate || formatLocalDate(new Date());
      const today = parseLocalDate(currentDateString);

      // Get all sessions for this user
      const allSessions = await storage.getUserSessions(userId);

      // Find missed workouts: scheduled before today, still pending, not archived
      const missedWorkouts = allSessions.filter((session: any) => {
        if (!session.scheduledDate) return false;
        if (session.status === 'archived') return false;
        if (session.completed === 1 || session.status === 'skipped') return false;
        
        const sessionDate = parseLocalDate(session.scheduledDate);
        return isBeforeCalendarDay(sessionDate, today);
      });

      console.log(`[MISSED] Found ${missedWorkouts.length} missed workouts for user ${userId}`);
      res.json({ 
        missedWorkouts,
        count: missedWorkouts.length 
      });
    } catch (error) {
      console.error("Get missed workouts error:", error);
      res.status(500).json({ error: "Failed to get missed workouts" });
    }
  });

  // Reset program from today - reschedule ONLY missed workouts to today, preserve future dates
  app.post("/api/workout-sessions/reset-from-today", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const currentDateString = req.body.currentDate || formatLocalDate(new Date());
      const today = parseLocalDate(currentDateString);

      // STEP 1: Find missed workouts (scheduled before today, not completed)
      const allSessions = await storage.getUserSessions(userId);
      const missedWorkouts = allSessions.filter((session: any) => {
        if (!session.scheduledDate) return false;
        if (session.status === 'archived') return false;
        if (session.completed === 1 || session.status === 'skipped') return false;
        const sessionDate = parseLocalDate(session.scheduledDate);
        return isBeforeCalendarDay(sessionDate, today);
      });

      if (missedWorkouts.length === 0) {
        console.log(`[RESET] No missed workouts to reschedule`);
        return res.json({ message: "No missed workouts to reschedule", rescheduledCount: 0 });
      }

      // STEP 2: Check if there's already a session for today
      const todaySession = allSessions.find((session: any) => 
        session.scheduledDate === currentDateString && session.isArchived === 0
      );

      if (todaySession) {
        console.log(`[RESET] Session already exists for today (${currentDateString}), skipping reschedule`);
        return res.json({ 
          message: "Session already scheduled for today",
          rescheduledCount: 0
        });
      }

      // STEP 3: Move the first missed workout to today AND cascade reschedule all future workouts
      const firstMissedWorkout = missedWorkouts.sort((a: any, b: any) => {
        const dateA = parseLocalDate(a.scheduledDate);
        const dateB = parseLocalDate(b.scheduledDate);
        return dateA.getTime() - dateB.getTime();
      })[0];

      // Calculate how many days the workout was missed by
      const originalDate = parseLocalDate(firstMissedWorkout.scheduledDate!);
      const daysMissed = Math.floor((today.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`[RESET] Missed workout was ${daysMissed} days late, cascading reschedule...`);

      // Update the missed workout to today
      await storage.updateWorkoutSession(firstMissedWorkout.id, {
        scheduledDate: currentDateString,
        sessionDayOfWeek: today.getDay() === 0 ? 7 : today.getDay(),
        status: 'scheduled'
      });

      // STEP 4: Cascade reschedule all future workouts (shift forward by daysMissed)
      const futureWorkouts = allSessions.filter((session: any) => {
        if (!session.scheduledDate) return false;
        if (session.status === 'archived') return false;
        if (session.id === firstMissedWorkout.id) return false; // Exclude the missed workout we just moved
        
        const sessionDate = parseLocalDate(session.scheduledDate);
        return isAfterCalendarDay(sessionDate, originalDate) || isSameCalendarDay(sessionDate, originalDate);
      });

      let rescheduledCount = 1; // Count the missed workout we already moved
      
      for (const futureSession of futureWorkouts) {
        const currentDate = parseLocalDate(futureSession.scheduledDate!);
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + daysMissed);
        
        const newDateString = formatLocalDate(newDate);
        
        await storage.updateWorkoutSession(futureSession.id, {
          scheduledDate: newDateString,
          sessionDayOfWeek: newDate.getDay() === 0 ? 7 : newDate.getDay(),
        });
        
        rescheduledCount++;
      }

      console.log(`[RESET] Moved missed workout to ${currentDateString} and cascaded ${rescheduledCount - 1} future workouts forward by ${daysMissed} days`);
      res.json({ 
        message: `Rescheduled ${rescheduledCount} workout(s)`,
        rescheduledCount
      });
    } catch (error) {
      console.error("Reset from today error:", error);
      res.status(500).json({ error: "Failed to reset program" });
    }
  });

  // Skip missed workouts - mark all missed sessions as skipped
  app.post("/api/workout-sessions/skip-missed", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const currentDateString = req.body.currentDate || formatLocalDate(new Date());
      const today = parseLocalDate(currentDateString);

      // Get all sessions for this user
      const allSessions = await storage.getUserSessions(userId);

      // Find missed workouts: scheduled before today, still pending, not archived
      const missedWorkouts = allSessions.filter((session: any) => {
        if (!session.scheduledDate) return false;
        if (session.status === 'archived') return false;
        if (session.completed === 1 || session.status === 'skipped') return false;
        
        const sessionDate = parseLocalDate(session.scheduledDate);
        return isBeforeCalendarDay(sessionDate, today);
      });

      if (missedWorkouts.length === 0) {
        return res.json({ message: "No missed workouts to skip", skippedCount: 0 });
      }

      // Mark all missed workouts as skipped
      const updates = missedWorkouts.map((workout: any) => 
        storage.updateWorkoutSession(workout.id, {
          status: 'skipped'
        })
      );

      await Promise.all(updates);

      console.log(`[SKIP] Marked ${missedWorkouts.length} missed workouts as skipped for user ${userId}`);
      res.json({ 
        message: `Skipped ${missedWorkouts.length} missed workouts`,
        skippedCount: missedWorkouts.length 
      });
    } catch (error) {
      console.error("Skip missed workouts error:", error);
      res.status(500).json({ error: "Failed to skip missed workouts" });
    }
  });

  app.patch("/api/workout-sessions/:sessionId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // Get the old session to check if completion status is changing
      const oldSession = await storage.getWorkoutSession(req.params.sessionId);
      if (!oldSession) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Validate and transform the patch data (converts boolean completed to integer)
      const validatedData = patchWorkoutSessionSchema.parse(req.body);

      // Branched authorization: Client path vs Trainer path
      const isSessionOwner = oldSession.userId === userId;
      
      if (isSessionOwner) {
        // CLIENT PATH: Session owner can update any field (existing logic continues below)
      } else {
        // TRAINER PATH: Check if user is a trainer with active connection to this client
        const trainerConnection = await storage.getTrainerClientConnection(userId, oldSession.userId);
        
        if (!trainerConnection) {
          return res.status(403).json({ error: "Not authorized to update this session" });
        }

        // Trainer can ONLY update trainer note fields
        const allowedTrainerFields = ['trainerPreSessionNotes', 'trainerPostSessionReview'];
        const requestedFields = Object.keys(validatedData);
        const unauthorizedFields = requestedFields.filter(field => !allowedTrainerFields.includes(field));
        
        if (unauthorizedFields.length > 0) {
          return res.status(403).json({ 
            error: "Trainers can only update trainer notes",
            unauthorizedFields 
          });
        }

        // Require at least one trainer note field (check for undefined, allow empty strings)
        if (validatedData.trainerPreSessionNotes === undefined && validatedData.trainerPostSessionReview === undefined) {
          return res.status(400).json({ error: "At least one trainer note field is required" });
        }

        // Update only trainer notes (skip all client-side effects)
        const trainerNoteUpdates: any = {};
        if (validatedData.trainerPreSessionNotes !== undefined) {
          trainerNoteUpdates.trainerPreSessionNotes = validatedData.trainerPreSessionNotes;
        }
        if (validatedData.trainerPostSessionReview !== undefined) {
          trainerNoteUpdates.trainerPostSessionReview = validatedData.trainerPostSessionReview;
        }

        const session = await storage.updateWorkoutSession(req.params.sessionId, trainerNoteUpdates);
        return res.json(session);
      }

      // CLIENT PATH CONTINUES: Original logic for session owner

      // Do NOT auto-archive - sessions stay visible with their status until date changes
      // Archival happens automatically when viewing home page on a new day

      // Calculate calories burned if workout is being completed
      if (validatedData.status === 'complete' && validatedData.durationMinutes && !validatedData.caloriesBurned) {
        try {
          // Get user data for weight
          const user = await storage.getUser(userId);
          
          // Get program data for intensity level
          let intensityLevel: "light" | "moderate" | "vigorous" | "circuit" = "moderate";
          if (oldSession.programWorkoutId) {
            const programWorkout = await storage.getProgramWorkout(oldSession.programWorkoutId);
            if (programWorkout) {
              const program = await storage.getWorkoutProgram(programWorkout.programId);
              if (program) {
                intensityLevel = program.intensityLevel as any;
                
                // Check if workout contains supersets - boost intensity
                const exercises = await storage.getWorkoutExercises(programWorkout.id);
                const hasSupersets = exercises.some((ex: any) => ex.supersetGroup !== null && ex.supersetGroup !== undefined);
                
                if (hasSupersets) {
                  // Supersets are more intense - boost the MET value
                  if (intensityLevel === "light") {
                    intensityLevel = "moderate";
                  } else if (intensityLevel === "moderate") {
                    intensityLevel = "vigorous";
                  } else if (intensityLevel === "vigorous") {
                    intensityLevel = "circuit";
                  }
                  // circuit stays circuit
                }
              }
            }
          }
          
          // Calculate calories if we have weight data
          if (user?.weight) {
            const weightKg = user.unitPreference === 'imperial' ? poundsToKg(user.weight) : user.weight;
            const calories = calculateCaloriesBurned(
              validatedData.durationMinutes,
              weightKg,
              intensityLevel
            );
            validatedData.caloriesBurned = calories;
          }
        } catch (calorieError) {
          console.error("Error calculating calories:", calorieError);
          // Continue without calories if calculation fails
        }
      }

      // Preserve sessionType and workoutType - don't allow client to overwrite
      const { sessionType, workoutType, ...safeUpdateData } = validatedData;
      
      const session = await storage.updateWorkoutSession(req.params.sessionId, safeUpdateData);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Update user's totalWorkoutsCompleted if workout is being completed for the first time
      console.log(`[WORKOUT-CHECK] Completion check - validatedData.status: ${validatedData.status}, oldSession.status: ${oldSession.status}, session.sessionType: ${session.sessionType}`);
      
      if (validatedData.status === 'complete' && oldSession.status !== 'complete' && session.sessionType === "workout") {
        const user = await storage.getUser(userId);
        if (user) {
          const updatedTotalWorkouts = (user.totalWorkoutsCompleted || 0) + 1;
          await storage.updateUser(userId, {
            totalWorkoutsCompleted: updatedTotalWorkouts
          });
          console.log(`[WORKOUT] User ${userId} completed workout. Total workouts: ${updatedTotalWorkouts}`);
        } else {
          console.log(`[WORKOUT-CHECK] User not found: ${userId}`);
        }
      } else {
        console.log(`[WORKOUT-CHECK] Condition failed - not incrementing counter`);
      }

      res.json(session);
    } catch (error) {
      console.error("Patch session error:", error);
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // Manual workout rescheduling endpoint
  app.patch("/api/workout-sessions/:sessionId/reschedule", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { newDate } = req.body;

      if (!newDate) {
        return res.status(400).json({ error: "newDate is required" });
      }

      // Get the session to verify ownership and validate
      const session = await storage.getWorkoutSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Verify ownership
      if (session.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to reschedule this session" });
      }

      // Validate session can be rescheduled
      if (session.status === 'complete') {
        return res.status(400).json({ error: "Cannot reschedule completed workouts" });
      }

      if (session.status === 'partial') {
        return res.status(400).json({ error: "Cannot reschedule partial workouts. Please finish or end the workout first." });
      }

      if (session.status === 'archived') {
        return res.status(400).json({ error: "Cannot reschedule archived workouts" });
      }

      // Parse the new date
      const newScheduledDate = parseLocalDate(newDate);
      const newDateStr = formatLocalDate(newScheduledDate);

      // Check for conflicts on the new date (only workout sessions, not rest days)
      const conflictingSessions = await storage.getUserSessions(userId);
      const hasConflict = conflictingSessions.some((s: any) => {
        if (s.status === 'archived' || s.id === session.id) return false;
        const displayDate = s.scheduledDate ? parseLocalDate(s.scheduledDate) : (s.sessionDate ? new Date(s.sessionDate) : null);
        if (!displayDate) return false;
        const dateStr = formatLocalDate(displayDate);
        return s.sessionType === 'workout' && dateStr === newDateStr;
      });

      if (hasConflict) {
        return res.status(409).json({ error: "Another workout is already scheduled for this date" });
      }

      // Update the session's scheduled date
      const updatedSession = await storage.updateWorkoutSession(req.params.sessionId, {
        scheduledDate: newDateStr
      });

      if (!updatedSession) {
        return res.status(404).json({ error: "Session not found" });
      }

      console.log(`[RESCHEDULE] User ${userId} rescheduled session ${session.id} to ${newDateStr}`);
      res.json(updatedSession);
    } catch (error) {
      console.error("Reschedule session error:", error);
      res.status(500).json({ error: "Failed to reschedule session" });
    }
  });

  app.get("/api/workout-sessions/paginated", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const limit = parseInt(req.query.limit as string) || 30;
      const offset = parseInt(req.query.offset as string) || 0;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await storage.getUserSessionsPaginated(userId, limit, offset, startDate, endDate);
      res.json(result);
    } catch (error) {
      console.error("Paginated sessions error:", error);
      res.status(500).json({ error: "Failed to fetch paginated sessions" });
    }
  });

  app.get("/api/workout-sessions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const sessions = await storage.getUserSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/workout-sessions/calories/today", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // Use date from query parameter if provided, otherwise use server's date as fallback
      const currentDateString = (req.query.date as string) || formatLocalDate(new Date());
      const today = parseLocalDate(currentDateString);
      
      // Calculate tomorrow for date range
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch completed sessions for today and sum calories
      const totalCalories = await storage.getTodayCaloriesBurned(userId, today, tomorrow);
      res.json({ calories: totalCalories || 0 });
    } catch (error) {
      console.error("Error fetching today's calories:", error);
      res.status(500).json({ error: "Failed to fetch calories" });
    }
  });

  // Workout Set routes
  app.post("/api/workout-sets", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const validatedData = insertWorkoutSetSchema.parse(req.body);
      const set = await storage.createWorkoutSet(validatedData);
      res.json(set);
    } catch (error) {
      console.error("Create set error:", error);
      res.status(500).json({ error: "Failed to create workout set" });
    }
  });

  app.put("/api/workout-sets/:setId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // First get the set to verify ownership
      const existingSet = await storage.getWorkoutSet(req.params.setId);
      if (!existingSet) {
        return res.status(404).json({ error: "Set not found" });
      }

      // Verify ownership: set -> session -> userId
      const session = await storage.getWorkoutSession(existingSet.sessionId);
      if (!session || session.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this set" });
      }

      const set = await storage.updateWorkoutSet(req.params.setId, req.body);
      res.json(set);
    } catch (error) {
      res.status(500).json({ error: "Failed to update set" });
    }
  });

  app.get("/api/workout-sessions/:sessionId/sets", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // Verify ownership: session -> userId
      const session = await storage.getWorkoutSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (session.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to access this session's sets" });
      }

      const sets = await storage.getSessionSets(req.params.sessionId);
      res.json(sets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sets" });
    }
  });

  app.get("/api/workout-sets", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const exerciseId = req.query.exerciseId as string;
      if (!exerciseId) {
        return res.status(400).json({ error: "exerciseId query parameter required" });
      }

      const sets = await storage.getUserRecentSets(userId, exerciseId, 10);
      res.json(sets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout sets" });
    }
  });

  // ==========================================
  // TRAINER CUSTOM EXERCISE ROUTES
  // ==========================================
  // Endpoints for trainers to create and manage custom exercises for their programs

  // GET /api/trainer/custom-exercises - Get all custom exercises for authenticated trainer
  app.get("/api/trainer/custom-exercises/:trainerId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { trainerId } = req.params;

      // Verify the trainer is requesting their own exercises
      if (userId !== trainerId) {
        return res.status(403).json({ error: "Not authorized to access these exercises" });
      }

      const exercises = await storage.getTrainerCustomExercises(trainerId);
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching custom exercises:", error);
      res.status(500).json({ error: "Failed to fetch custom exercises" });
    }
  });

  // POST /api/trainer/custom-exercises - Create a new custom exercise
  app.post("/api/trainer/custom-exercises", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { insertTrainerCustomExerciseSchema } = await import("@shared/schema");

      // Validate request body
      const validatedData = insertTrainerCustomExerciseSchema.parse(req.body);

      // Verify the trainer is creating for themselves
      if (validatedData.trainerId !== userId) {
        return res.status(403).json({ error: "Cannot create exercises for other trainers" });
      }

      const exercise = await storage.createTrainerCustomExercise(validatedData);
      res.status(201).json(exercise);
    } catch (error) {
      console.error("Error creating custom exercise:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid exercise data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create custom exercise" });
    }
  });

  // PATCH /api/trainer/custom-exercises/:id - Update a custom exercise
  app.patch("/api/trainer/custom-exercises/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Get existing exercise to verify ownership
      const existingExercise = await storage.getTrainerCustomExercise(id);
      if (!existingExercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      // Verify the trainer owns this exercise
      if (existingExercise.trainerId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this exercise" });
      }

      // Update with partial data
      const exercise = await storage.updateTrainerCustomExercise(id, req.body);
      res.json(exercise);
    } catch (error) {
      console.error("Error updating custom exercise:", error);
      res.status(500).json({ error: "Failed to update custom exercise" });
    }
  });

  // DELETE /api/trainer/custom-exercises/:id - Delete a custom exercise
  app.delete("/api/trainer/custom-exercises/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Get existing exercise to verify ownership
      const existingExercise = await storage.getTrainerCustomExercise(id);
      if (!existingExercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      // Verify the trainer owns this exercise
      if (existingExercise.trainerId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this exercise" });
      }

      await storage.deleteTrainerCustomExercise(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting custom exercise:", error);
      res.status(500).json({ error: "Failed to delete custom exercise" });
    }
  });

  // ==========================================
  // TRAINER PROGRAM ROUTES
  // ==========================================
  // Endpoints for trainers to create and manage programs for sale

  // GET /api/trainer/programs - Get all programs for authenticated trainer
  app.get("/api/trainer/programs", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const programs = await storage.getTrainerPrograms(userId);
      res.json(programs);
    } catch (error) {
      console.error("Error fetching trainer programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });

  // POST /api/trainer/programs - Create a new program
  app.post("/api/trainer/programs", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { insertTrainerProgramSchema } = await import("@shared/schema");

      // Validate request body
      const validatedData = insertTrainerProgramSchema.parse(req.body);

      // Verify the trainer is creating for themselves
      if (validatedData.trainerId !== userId) {
        return res.status(403).json({ error: "Cannot create programs for other trainers" });
      }

      const program = await storage.createTrainerProgram(validatedData);
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating trainer program:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid program data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create program" });
    }
  });

  // GET /api/trainer/programs/:id - Get a single program with workouts and exercises
  app.get("/api/trainer/programs/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const program = await storage.getTrainerProgram(id);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      // Verify ownership
      if (program.trainerId !== userId) {
        return res.status(403).json({ error: "Not authorized to access this program" });
      }

      res.json(program);
    } catch (error) {
      console.error("Error fetching trainer program:", error);
      res.status(500).json({ error: "Failed to fetch program" });
    }
  });

  // PATCH /api/trainer/programs/:id - Update a program
  app.patch("/api/trainer/programs/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Get existing program to verify ownership
      const existingProgram = await storage.getTrainerProgram(id);
      if (!existingProgram) {
        return res.status(404).json({ error: "Program not found" });
      }

      if (existingProgram.trainerId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this program" });
      }

      // Create partial schema excluding immutable fields
      const partialProgramSchema = z.object({
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        basedOnTemplate: z.string().nullable().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        durationWeeks: z.number().optional(),
        daysPerWeek: z.number().optional(),
        price: z.number().optional(),
        pricingType: z.enum(["one_time", "subscription"]).optional(),
        isPublished: z.number().optional(),
      });

      // Validate and strip immutable fields
      const validatedUpdates = partialProgramSchema.parse(req.body);

      // If trying to publish, validate requirements
      if (validatedUpdates.isPublished === 1) {
        const currentPrice = validatedUpdates.price ?? existingProgram.price;
        if (!currentPrice || currentPrice <= 0) {
          return res.status(400).json({ error: "Cannot publish program without a price" });
        }

        const workouts = await storage.getTrainerProgramWorkouts(id);
        if (workouts.length === 0) {
          return res.status(400).json({ error: "Cannot publish program without workouts" });
        }
      }

      const program = await storage.updateTrainerProgram(id, validatedUpdates);
      res.json(program);
    } catch (error) {
      console.error("Error updating trainer program:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update program" });
    }
  });

  // DELETE /api/trainer/programs/:id - Delete a program
  app.delete("/api/trainer/programs/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const existingProgram = await storage.getTrainerProgram(id);
      if (!existingProgram) {
        return res.status(404).json({ error: "Program not found" });
      }

      if (existingProgram.trainerId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this program" });
      }

      await storage.deleteTrainerProgram(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trainer program:", error);
      res.status(500).json({ error: "Failed to delete program" });
    }
  });

  // GET /api/programs/public/:slug - Public endpoint for viewing program by slug
  app.get("/api/programs/public/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const program = await storage.getPublicProgramBySlug(slug);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      // Only return published programs
      if (!program.isPublished) {
        return res.status(404).json({ error: "Program not found" });
      }

      // Get workouts and exercises for this program
      const workouts = await storage.getTrainerProgramWorkouts(program.id);
      const workoutsWithExercises = await Promise.all(
        workouts.map(async (workout) => {
          const exercises = await storage.getWorkoutExercisesForTrainer(workout.id);
          return { ...workout, exercises };
        })
      );

      // Get trainer info (minimal public info only - no PII)
      const trainer = await storage.getUser(program.trainerId);

      res.json({
        ...program,
        workouts: workoutsWithExercises,
        trainer: trainer ? {
          id: trainer.id,
          // Only expose non-PII trainer info
          // Could add a displayName field to users table in future
        } : null,
      });
    } catch (error) {
      console.error("Error fetching public program:", error);
      res.status(500).json({ error: "Failed to fetch program" });
    }
  });

  // ==========================================
  // TRAINER DASHBOARD ROUTES
  // ==========================================

  // GET /api/trainer/clients - Get trainer's client roster with program details
  app.get("/api/trainer/clients", isAuthenticated, async (req: any, res: Response) => {
    try {
      const trainerId = req.user.claims.sub;
      
      // Fetch real client data
      const clients = await storage.getTrainerClientsWithPrograms(trainerId);
      
      // Test mode: Merge with mock data if flag is enabled
      if (process.env.ENABLE_TEST_DATA === "true") {
        const { generateMockTrainerRoster } = await import("@shared/mocks/trainerTestData");
        const mockRoster = generateMockTrainerRoster();
        console.log("[TEST-MODE] Merging mock trainer roster data with real data");
        return res.json([...mockRoster, ...clients]);
      }
      
      res.json(clients);
    } catch (error) {
      console.error("Error fetching trainer clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // GET /api/trainer/sales - Get trainer's sales metrics and purchase history
  app.get("/api/trainer/sales", isAuthenticated, async (req: any, res: Response) => {
    try {
      const trainerId = req.user.claims.sub;
      
      // Fetch real sales data
      const salesMetrics = await storage.getTrainerSalesMetrics(trainerId);
      
      // Test mode: Merge with mock data if flag is enabled
      if (process.env.ENABLE_TEST_DATA === "true") {
        const { generateMockTrainerSalesMetrics } = await import("@shared/mocks/trainerTestData");
        const mockMetrics = generateMockTrainerSalesMetrics();
        console.log("[TEST-MODE] Merging mock sales metrics with real data");
        
        // Merge metrics
        const mergedMetrics = {
          totalRevenue: salesMetrics.totalRevenue + mockMetrics.totalRevenue,
          monthlyRevenue: salesMetrics.monthlyRevenue + mockMetrics.monthlyRevenue,
          annualRevenue: salesMetrics.annualRevenue + mockMetrics.annualRevenue,
          totalPurchases: salesMetrics.totalPurchases + mockMetrics.totalPurchases,
          activePlans: salesMetrics.activePlans + mockMetrics.activePlans,
          purchases: [...mockMetrics.purchases, ...salesMetrics.purchases],
        };
        
        return res.json(mergedMetrics);
      }
      
      res.json(salesMetrics);
    } catch (error) {
      console.error("Error fetching trainer sales:", error);
      res.status(500).json({ error: "Failed to fetch sales metrics" });
    }
  });

  // Helper function to calculate current workout streak
  function calculateCurrentStreak(completedSessions: any[]): number {
    if (completedSessions.length === 0) return 0;
    
    // Sort by date descending
    const sorted = [...completedSessions].sort((a, b) => {
      const dateA = new Date(a.scheduledDate || a.sessionDate);
      const dateB = new Date(b.scheduledDate || b.sessionDate);
      return dateB.getTime() - dateA.getTime();
    });
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const session of sorted) {
      const sessionDate = new Date(session.scheduledDate || session.sessionDate);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If session is today or yesterday (allowing for streak continuation)
      if (daysDiff === streak || daysDiff === streak + 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // GET /api/trainer/clients/:id - Get individual client details for trainer
  app.get("/api/trainer/clients/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const trainerId = req.user.claims.sub;
      const { id: clientId } = req.params;

      // Verify trainer has active connection to this client
      const connection = await storage.getTrainerClientConnection(trainerId, clientId);
      if (!connection) {
        return res.status(403).json({ error: "Not authorized to view this client" });
      }

      // Fetch client user profile
      const user = await storage.getUser(clientId);
      if (!user) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Fetch client's active program
      const activeProgram = await storage.getUserActiveProgram(clientId);

      // Fetch client's fitness assessments
      const fitnessAssessments = await storage.getUserFitnessAssessments(clientId);

      // Fetch recent workout sessions (last 10)
      const allSessions = await storage.getUserSessions(clientId);
      const recentSessions = allSessions.slice(0, 10);

      // Calculate client stats
      const completedSessions = allSessions.filter(s => s.status === 'complete');
      const totalWorkouts = completedSessions.length;
      const currentStreak = calculateCurrentStreak(completedSessions);

      // Construct client detail response
      const clientDetail = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        fitnessLevel: user.fitnessLevel,
        primaryGoal: user.primaryGoal,
        nutritionGoal: user.nutritionGoal,
        equipmentAccess: user.equipmentAccess,
        weeklyWorkoutDays: user.weeklyWorkoutDays,
        preferredDuration: user.preferredDuration,
        unitPreference: user.unitPreference,
        connectionDate: connection.addedDate?.toISOString() || new Date().toISOString(),
        status: connection.status,
        activeProgram: activeProgram || null,
        fitnessAssessments: fitnessAssessments || [],
        recentSessions,
        stats: {
          totalWorkouts,
          currentStreak,
        },
      };

      res.json(clientDetail);
    } catch (error) {
      console.error("Error fetching client details:", error);
      res.status(500).json({ error: "Failed to fetch client details" });
    }
  });

  // GET /api/trainer/clients/:clientId/sessions - Get client's workout sessions for trainer
  app.get("/api/trainer/clients/:clientId/sessions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const trainerId = req.user.claims.sub;
      const { clientId } = req.params;

      // Verify trainer has active connection to this client
      const connection = await storage.getTrainerClientConnection(trainerId, clientId);
      if (!connection) {
        return res.status(403).json({ error: "Not authorized to view this client's workout sessions" });
      }

      // Fetch client's workout sessions using storage interface
      const sessions = await storage.getUserSessions(clientId);

      res.json(sessions);
    } catch (error) {
      console.error("Error fetching client workout sessions:", error);
      res.status(500).json({ error: "Failed to fetch workout sessions" });
    }
  });

  // ==========================================
  // TRAINER PROFILE ROUTES
  // ==========================================
  // Endpoints for trainer onboarding and profile management

  // GET /api/trainer/profile - Get trainer's profile
  app.get("/api/trainer/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getTrainerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching trainer profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // GET /api/trainer/username/check?username=xxx - Check if username is available
  app.get("/api/trainer/username/check", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { username } = req.query;
      const { insertTrainerProfileSchema } = await import("@shared/schema");

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: "Username is required" });
      }

      // Validate username format using schema validation
      try {
        insertTrainerProfileSchema.shape.username.parse(username);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return res.json({ 
            available: false, 
            error: validationError.errors[0]?.message || "Invalid username format"
          });
        }
      }

      // Check if username is already taken
      const isTaken = await storage.isUsernameTaken(username);
      
      res.json({ 
        available: !isTaken,
        username: username.toLowerCase() // Return normalized version
      });
    } catch (error) {
      console.error("Error checking username availability:", error);
      res.status(500).json({ error: "Failed to check username availability" });
    }
  });

  // POST /api/trainer/profile - Create trainer profile (onboarding)
  app.post("/api/trainer/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { insertTrainerProfileSchema } = await import("@shared/schema");

      // Check if profile already exists
      const existingProfile = await storage.getTrainerProfile(userId);
      if (existingProfile) {
        return res.status(409).json({ error: "Profile already exists" });
      }

      // Inject userId from authenticated session before validation
      const validatedData = insertTrainerProfileSchema.parse({
        ...req.body,
        userId,
      });

      const profile = await storage.createTrainerProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating trainer profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid profile data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // PATCH /api/trainer/profile - Update trainer profile
  app.patch("/api/trainer/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // Verify profile exists
      const existingProfile = await storage.getTrainerProfile(userId);
      if (!existingProfile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const updatedProfile = await storage.updateTrainerProfile(userId, req.body);
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating trainer profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ==========================================
  // CLIENT-TRAINER CONNECTION ROUTES
  // ==========================================
  // Endpoints for connecting clients to trainers via username

  // POST /api/client/connect-trainer - Connect client to trainer by username
  app.post("/api/client/connect-trainer", isAuthenticated, async (req: any, res: Response) => {
    try {
      const clientId = req.user.claims.sub;
      const { username } = req.body;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: "Trainer username is required" });
      }

      // Find trainer by username
      const trainerProfile = await storage.getTrainerProfileByUsername(username.toLowerCase());
      if (!trainerProfile) {
        return res.status(404).json({ error: "Trainer not found" });
      }

      // Check if client is already connected to this trainer
      const existingConnection = await storage.getTrainerClientConnection(trainerProfile.userId, clientId);
      if (existingConnection) {
        return res.status(409).json({ error: "Already connected to this trainer" });
      }

      // Check trainer's client limit
      const clientCount = await storage.getTrainerClientCount(trainerProfile.userId);
      const isFreeTrainer = trainerProfile.subscriptionStatus !== 'premium';
      const FREE_CLIENT_LIMIT = 5;

      if (isFreeTrainer && clientCount >= FREE_CLIENT_LIMIT) {
        return res.status(403).json({ 
          error: "This trainer has reached their client limit",
          limit: FREE_CLIENT_LIMIT,
          upgradeRequired: true
        });
      }

      // Create the connection
      const { insertTrainerClientSchema } = await import("@shared/schema");
      const connectionData = insertTrainerClientSchema.parse({
        trainerId: trainerProfile.userId,
        clientId,
        sourcePurchaseId: null, // No purchase for username-based connections
      });

      const connection = await storage.createTrainerClient(connectionData);

      // Fetch trainer details for response
      const trainer = await storage.getUser(trainerProfile.userId);

      res.status(201).json({
        success: true,
        connection,
        trainer: {
          id: trainer?.id,
          name: [trainer?.firstName, trainer?.lastName].filter(Boolean).join(" ") || "Trainer",
          username: trainerProfile.username,
        },
      });
    } catch (error) {
      console.error("Error connecting to trainer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid connection data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to connect to trainer" });
    }
  });

  // GET /api/client/trainer - Get client's connected trainer
  app.get("/api/client/trainer", isAuthenticated, async (req: any, res: Response) => {
    try {
      const clientId = req.user.claims.sub;
      const connection = await storage.getClientTrainerConnection(clientId);

      if (!connection) {
        return res.status(404).json({ error: "No trainer connected" });
      }

      // Fetch trainer details
      const trainer = await storage.getUser(connection.trainerId);
      const trainerProfile = await storage.getTrainerProfile(connection.trainerId);

      res.json({
        connection,
        trainer: {
          id: trainer?.id,
          name: [trainer?.firstName, trainer?.lastName].filter(Boolean).join(" ") || "Trainer",
          email: trainer?.email,
          username: trainerProfile?.username,
          profile: trainerProfile,
        },
      });
    } catch (error) {
      console.error("Error fetching trainer connection:", error);
      res.status(500).json({ error: "Failed to fetch trainer connection" });
    }
  });

  // DELETE /api/client/trainer - Disconnect from current trainer
  app.delete("/api/client/trainer", isAuthenticated, async (req: any, res: Response) => {
    try {
      const clientId = req.user.claims.sub;
      const connection = await storage.getClientTrainerConnection(clientId);

      if (!connection) {
        return res.status(404).json({ error: "No trainer connected" });
      }

      await storage.deleteTrainerClient(connection.id);

      res.json({
        success: true,
        message: "Successfully disconnected from trainer",
      });
    } catch (error) {
      console.error("Error disconnecting from trainer:", error);
      res.status(500).json({ error: "Failed to disconnect from trainer" });
    }
  });

  // ==========================================
  // USER SEARCH & INVITE ROUTES
  // ==========================================
  // Endpoints for trainer-client bidirectional invite system

  // GET /api/users/search - Search for users by email/name (trainers only)
  app.get("/api/users/search", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { query } = req.query;
      
      // Enforce trainer-only access
      const trainerProfile = await storage.getTrainerProfile(userId);
      if (!trainerProfile) {
        return res.status(403).json({ error: "Only trainers can search for users" });
      }
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }

      // Only discoverable users can be searched
      const searchQuery = query.toLowerCase().trim();
      const searchResults = await db.select({
        id: users.id,
        name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        email: users.email,
      })
        .from(users)
        .where(
          and(
            eq(users.isDiscoverable, true),
            or(
              sql`LOWER(${users.email}) LIKE ${`%${searchQuery}%`}`,
              sql`LOWER(CONCAT(${users.firstName}, ' ', ${users.lastName})) LIKE ${`%${searchQuery}%`}`
            )
          )
        )
        .limit(10);

      res.json({ users: searchResults });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // POST /api/invites - Create a new trainer-client invite
  app.post("/api/invites", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { insertTrainerClientInviteSchema } = await import("@shared/schema");
      
      // Validate request body
      const validatedData = insertTrainerClientInviteSchema.parse(req.body);
      
      // Determine if user is trainer or client
      const trainerProfile = await storage.getTrainerProfile(userId);
      const isTrainer = !!trainerProfile;
      
      // Validate initiator matches authenticated user
      if (isTrainer && validatedData.initiatorRole !== "trainer") {
        return res.status(403).json({ error: "Trainers must use initiatorRole: 'trainer'" });
      }
      if (!isTrainer && validatedData.initiatorRole !== "client") {
        return res.status(403).json({ error: "Clients must use initiatorRole: 'client'" });
      }
      
      // Validate authenticated user matches trainerId/clientId based on role
      if (validatedData.initiatorRole === "trainer" && validatedData.trainerId !== userId) {
        return res.status(403).json({ error: "Cannot create invites for another trainer" });
      }
      if (validatedData.initiatorRole === "client" && validatedData.clientId !== userId) {
        return res.status(403).json({ error: "Cannot create invites for another client" });
      }
      
      // Check for existing active connection
      const existingConnection = await storage.getTrainerClientConnection(
        validatedData.trainerId,
        validatedData.clientId
      );
      if (existingConnection) {
        return res.status(409).json({ error: "Connection already exists" });
      }
      
      // Check for duplicate pending invite
      const duplicateInvite = await storage.checkDuplicateInvite(
        validatedData.trainerId,
        validatedData.clientId
      );
      if (duplicateInvite) {
        return res.status(409).json({ error: "Invite already sent" });
      }
      
      // Create the invite
      const invite = await storage.createTrainerClientInvite(validatedData);
      
      res.status(201).json({ success: true, invite });
    } catch (error) {
      console.error("Error creating invite:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid invite data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create invite" });
    }
  });

  // GET /api/invites - List invites for authenticated user
  app.get("/api/invites", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user is a trainer
      const trainerProfile = await storage.getTrainerProfile(userId);
      
      let invites;
      if (trainerProfile) {
        // Trainers see both sent and received invites
        const allInvites = await storage.getTrainerInvites(userId);
        // Split into sent (trainer initiated) and received (client initiated)
        const sent = allInvites.filter(invite => invite.initiatorRole === "trainer");
        const received = allInvites.filter(invite => invite.initiatorRole === "client");
        
        invites = {
          sent,
          received,
        };
      } else {
        // Clients see both sent and received invites
        const allInvites = await storage.getClientInvites(userId);
        // Split into sent (client initiated) and received (trainer initiated)
        const sent = allInvites.filter(invite => invite.initiatorRole === "client");
        const received = allInvites.filter(invite => invite.initiatorRole === "trainer");
        
        invites = { sent, received };
      }
      
      res.json(invites);
    } catch (error) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ error: "Failed to fetch invites" });
    }
  });

  // PATCH /api/invites/:id - Update invite status (accept/decline/cancel)
  app.patch("/api/invites/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ["accepted", "declined", "canceled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be: accepted, declined, or canceled" });
      }
      
      // Fetch the invite
      const invite = await storage.getInviteById(id);
      if (!invite) {
        return res.status(404).json({ error: "Invite not found" });
      }
      
      // Check if invite is already processed
      if (invite.status !== "pending") {
        return res.status(409).json({ error: `Invite already ${invite.status}` });
      }
      
      // Verify user is part of this invite (trainer or client)
      const isTrainer = invite.trainerId === userId;
      const isClient = invite.clientId === userId;
      
      if (!isTrainer && !isClient) {
        return res.status(403).json({ error: "You are not part of this invite" });
      }
      
      // Authorize action based on status and user role
      if (status === "canceled") {
        // Only the initiator can cancel
        const isInitiator = (invite.initiatorRole === "trainer" && isTrainer) ||
                           (invite.initiatorRole === "client" && isClient);
        if (!isInitiator) {
          return res.status(403).json({ error: "Only the invite sender can cancel" });
        }
        
        // Cancel doesn't set respondedAt (invite was never responded to)
        const updatedInvite = await storage.updateInviteStatus(id, status);
        return res.json({ success: true, invite: updatedInvite });
      } else {
        // Only the recipient can accept/decline
        const isRecipient = (invite.initiatorRole === "trainer" && isClient) ||
                           (invite.initiatorRole === "client" && isTrainer);
        if (!isRecipient) {
          return res.status(403).json({ error: "Only the invite recipient can accept or decline" });
        }
      }
      
      // If accepting, validate freemium limits and create connection
      if (status === "accepted") {
        // Check trainer's client limit
        const clientCount = await storage.getTrainerClientCount(invite.trainerId);
        const trainerProfile = await storage.getTrainerProfile(invite.trainerId);
        const isFreeTrainer = trainerProfile?.subscriptionStatus !== 'premium';
        const FREE_CLIENT_LIMIT = 5;
        
        if (isFreeTrainer && clientCount >= FREE_CLIENT_LIMIT) {
          return res.status(403).json({ 
            error: "Trainer has reached their client limit",
            limit: FREE_CLIENT_LIMIT,
            upgradeRequired: true
          });
        }
        
        // Create the trainer-client connection
        const { insertTrainerClientSchema } = await import("@shared/schema");
        const connectionData = insertTrainerClientSchema.parse({
          trainerId: invite.trainerId,
          clientId: invite.clientId,
          sourcePurchaseId: null,
        });
        
        await storage.createTrainerClient(connectionData);
      }
      
      // Update invite status with respondedAt timestamp (for accept/decline only)
      const updatedInvite = await storage.updateInviteStatus(id, status, new Date());
      
      res.json({ success: true, invite: updatedInvite });
    } catch (error) {
      console.error("Error updating invite:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update invite" });
    }
  });

  // ==========================================
  // TRAINER DISCOUNT CODE ROUTES
  // ==========================================
  // Endpoints for premium trainers to generate monthly discount codes

  // GET /api/trainer/discount-code - Get trainer's active discount code and eligibility
  app.get("/api/trainer/discount-code", isAuthenticated, async (req: any, res: Response) => {
    try {
      const trainerId = req.user.claims.sub;
      
      // Get trainer profile to check subscription status
      const profile = await storage.getTrainerProfile(trainerId);
      if (!profile) {
        return res.status(404).json({ error: "Trainer profile not found" });
      }

      // Get active code (if any)
      const activeCode = await storage.getActiveDiscountCodeForTrainer(trainerId);
      
      // Check eligibility to generate new code
      const canGenerate = await storage.canTrainerGenerateCode(trainerId);
      
      // Calculate cooldown info
      let nextAvailableDate: string | null = null;
      if (!canGenerate && !activeCode && profile.subscriptionStatus === "premium" && !profile.premiumDowngradedAt) {
        // If not eligible and no active code, calculate when they can generate next
        const codes = await storage.getTrainerDiscountCodes(trainerId);
        if (codes.length > 0) {
          const lastCode = codes[0];
          const nextDate = new Date(lastCode.createdAt!);
          nextDate.setDate(nextDate.getDate() + 30);
          nextAvailableDate = nextDate.toISOString();
        } else if (profile.premiumJoinedAt) {
          const nextDate = new Date(profile.premiumJoinedAt);
          nextDate.setDate(nextDate.getDate() + 30);
          nextAvailableDate = nextDate.toISOString();
        }
      }
      
      res.json({
        activeCode,
        canGenerate,
        isPremium: profile.subscriptionStatus === "premium",
        isDowngraded: !!profile.premiumDowngradedAt,
        nextAvailableDate,
      });
    } catch (error) {
      console.error("Error fetching discount code:", error);
      res.status(500).json({ error: "Failed to fetch discount code" });
    }
  });

  // POST /api/trainer/discount-code - Generate new discount code
  app.post("/api/trainer/discount-code", isAuthenticated, async (req: any, res: Response) => {
    try {
      const trainerId = req.user.claims.sub;
      
      // Check eligibility
      const canGenerate = await storage.canTrainerGenerateCode(trainerId);
      if (!canGenerate) {
        return res.status(403).json({ error: "Not eligible to generate discount code" });
      }

      // Generate unique code (TRAINERNAME25-XXXX format)
      const profile = await storage.getTrainerProfile(trainerId);
      const username = profile?.username?.toUpperCase() || "TRAINER";
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `${username}25-${randomSuffix}`;

      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const discountCode = await storage.createTrainerDiscountCode({
        trainerId,
        code,
        expiresAt,
      });

      res.status(201).json(discountCode);
    } catch (error) {
      console.error("Error creating discount code:", error);
      res.status(500).json({ error: "Failed to create discount code" });
    }
  });

  // ==========================================
  // PUBLIC DISCOUNT CODE ROUTES
  // ==========================================
  // Public endpoints for discount code validation

  // GET /api/discount-codes/:code - Validate discount code (public)
  app.get("/api/discount-codes/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const discountCode = await storage.getDiscountCodeByCode(code);

      if (!discountCode) {
        return res.status(404).json({ error: "Discount code not found", valid: false });
      }

      // Check if already redeemed
      if (discountCode.redeemedAt) {
        return res.status(410).json({ error: "Discount code has already been used", valid: false });
      }

      // Check if expired
      if (new Date() > discountCode.expiresAt) {
        return res.status(410).json({ error: "Discount code has expired", valid: false });
      }

      // Fetch trainer info for display
      const trainer = await storage.getUser(discountCode.trainerId);
      const trainerProfile = await storage.getTrainerProfile(discountCode.trainerId);

      res.json({
        valid: true,
        discountPercent: 25,
        code: discountCode.code,
        expiresAt: discountCode.expiresAt,
        trainer: {
          name: [trainer?.firstName, trainer?.lastName].filter(Boolean).join(" ") || "Trainer",
          username: trainerProfile?.username,
        },
      });
    } catch (error) {
      console.error("Error validating discount code:", error);
      res.status(500).json({ error: "Failed to validate discount code", valid: false });
    }
  });

  // ==========================================
  // PUBLIC PROGRAM ROUTES
  // ==========================================

  // POST /api/programs/purchase - Simulate program purchase
  app.post("/api/programs/purchase", async (req: Request, res: Response) => {
    try {
      const { slug, buyerEmail, discountCode: discountCodeString } = req.body;

      if (!slug || !buyerEmail) {
        return res.status(400).json({ error: "Slug and buyer email are required" });
      }

      // Get the program
      const program = await storage.getPublicProgramBySlug(slug);
      if (!program || !program.isPublished) {
        return res.status(404).json({ error: "Program not found or not available" });
      }

      // Validate discount code if provided
      let discountCodeData = null;
      let discountAmount = 0;
      
      if (discountCodeString) {
        discountCodeData = await storage.getDiscountCodeByCode(discountCodeString);
        
        if (!discountCodeData) {
          return res.status(400).json({ error: "Invalid discount code" });
        }
        
        if (discountCodeData.redeemedAt) {
          return res.status(400).json({ error: "Discount code has already been used" });
        }
        
        if (new Date() > discountCodeData.expiresAt) {
          return res.status(400).json({ error: "Discount code has expired" });
        }
        
        // Calculate 25% discount
        discountAmount = program.price * 0.25;
      }

      // Create or get buyer user (simulated)
      // First check if user exists by email
      const existingUsers = await db.select().from(users).where(eq(users.email, buyerEmail)).limit(1);
      let buyer;
      if (existingUsers.length > 0) {
        buyer = existingUsers[0];
      } else {
        // Create new buyer
        const buyerId = `buyer-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        buyer = await storage.upsertUser({
          id: buyerId,
          email: buyerEmail,
          role: "user",
        });
      }

      // Calculate fees with discount applied
      const purchasePrice = program.price - discountAmount;
      const platformFee = purchasePrice * 0.20; // 20%
      const trainerEarnings = purchasePrice * 0.80; // 80%

      // Create a workout program for the buyer (assign program)
      const workoutProgram = await storage.createWorkoutProgram({
        userId: buyer.id,
        programType: `Trainer Program: ${program.name}`,
        weeklyStructure: `${program.daysPerWeek} days/week`,
        durationWeeks: program.durationWeeks,
        intensityLevel: program.difficulty === "beginner" ? "light" : program.difficulty === "advanced" ? "vigorous" : "moderate",
        isActive: 1,
      });

      // Clone trainer workouts and exercises to buyer's program
      const trainerWorkouts = await storage.getTrainerProgramWorkouts(program.id);
      for (const trainerWorkout of trainerWorkouts) {
        // Create program workout for buyer
        const programWorkout = await storage.createProgramWorkout({
          programId: workoutProgram.id,
          workoutName: trainerWorkout.workoutName,
          movementFocus: trainerWorkout.movementFocus ?? [], // Already an array from schema
          workoutIndex: trainerWorkout.orderIndex,
          dayOfWeek: trainerWorkout.dayNumber,
          workoutType: "strength", // Default type
        });

        // Get and clone exercises for this workout
        const trainerExercises = await storage.getWorkoutExercisesForTrainer(trainerWorkout.id);
        for (const trainerExercise of trainerExercises) {
          // Use repsMin/repsMax from schema (default to 8-12 if not set)
          const repsMin = trainerExercise.repsMin ?? 8;
          const repsMax = trainerExercise.repsMax ?? 12;

          await storage.createProgramExercise({
            workoutId: programWorkout.id,
            exerciseId: trainerExercise.exerciseId || "",
            sets: trainerExercise.sets,
            repsMin,
            repsMax,
            restSeconds: trainerExercise.restSeconds || 60,
            tempo: trainerExercise.tempo,
            targetRPE: trainerExercise.targetRPE,
            targetRIR: trainerExercise.targetRIR,
            notes: trainerExercise.notes,
            orderIndex: trainerExercise.orderIndex,
          });
        }
      }

      // Create purchase record with workout program reference and discount info
      const purchase = await storage.createProgramPurchase({
        trainerProgramId: program.id,
        trainerId: program.trainerId,
        buyerId: buyer.id,
        purchasePrice,
        discountCodeId: discountCodeData?.id || null,
        discountAmount: discountAmount > 0 ? discountAmount : null,
        platformFee,
        trainerEarnings,
        pricingType: program.pricingType,
        status: "completed",
        workoutProgramId: workoutProgram.id,
      });

      // Redeem discount code if used
      if (discountCodeData) {
        await storage.redeemDiscountCode(discountCodeData.id, buyer.id, purchase.id);
      }

      // Add client to trainer's roster
      await storage.createTrainerClient({
        trainerId: program.trainerId,
        clientId: buyer.id,
        sourcePurchaseId: purchase.id,
      });

      res.status(201).json({
        success: true,
        purchase,
        workoutProgram,
        message: "Program purchased successfully! You can now access your training program.",
      });
    } catch (error) {
      console.error("Error processing purchase:", error);
      res.status(500).json({ error: "Failed to process purchase" });
    }
  });

  // ==========================================
  // TRAINER PROGRAM WORKOUT & EXERCISE ROUTES
  // ==========================================
  
  // POST /api/trainer/programs/:id/workouts - Bulk create workouts with exercises
  app.post("/api/trainer/programs/:id/workouts", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { id: programId } = req.params;
      
      // Verify program ownership
      const program = await storage.getTrainerProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      if (program.trainerId !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this program" });
      }

      const { workouts } = req.body; // Array of {weekNumber, dayNumber, workoutName, description, movementFocus, estimatedDuration, orderIndex, exercises: [...]}
      
      if (!Array.isArray(workouts) || workouts.length === 0) {
        return res.status(400).json({ error: "Workouts array is required" });
      }

      const createdWorkouts = [];
      
      // Create each workout and its exercises
      for (const workoutData of workouts) {
        const { exercises: exerciseList, ...workoutFields } = workoutData;
        
        // Create workout
        const workout = await storage.createTrainerProgramWorkout({
          trainerProgramId: programId,
          ...workoutFields,
        });
        
        // Create exercises for this workout
        const createdExercises = [];
        if (Array.isArray(exerciseList)) {
          for (const exercise of exerciseList) {
            const createdExercise = await storage.createTrainerProgramExercise({
              trainerWorkoutId: workout.id,
              ...exercise,
            });
            createdExercises.push(createdExercise);
          }
        }
        
        createdWorkouts.push({ ...workout, exercises: createdExercises });
      }
      
      res.status(201).json(createdWorkouts);
    } catch (error) {
      console.error("Error creating program workouts:", error);
      res.status(500).json({ error: "Failed to create workouts" });
    }
  });

  // GET /api/trainer/programs/:id/workouts - Get all workouts for a program
  app.get("/api/trainer/programs/:id/workouts", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { id: programId } = req.params;
      
      // Verify program ownership
      const program = await storage.getTrainerProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      if (program.trainerId !== userId) {
        return res.status(403).json({ error: "Not authorized to access this program" });
      }

      const workouts = await storage.getTrainerProgramWorkouts(programId);
      
      // Fetch exercises for each workout
      const workoutsWithExercises = await Promise.all(
        workouts.map(async (workout) => {
          const exercises = await storage.getWorkoutExercisesForTrainer(workout.id);
          return { ...workout, exercises };
        })
      );
      
      res.json(workoutsWithExercises);
    } catch (error) {
      console.error("Error fetching program workouts:", error);
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });

  // DELETE /api/trainer/programs/:id/workouts - Delete all workouts for a program
  app.delete("/api/trainer/programs/:id/workouts", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { id: programId } = req.params;
      
      // Verify program ownership
      const program = await storage.getTrainerProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      if (program.trainerId !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this program" });
      }

      // First, get all workouts to delete their exercises
      const workouts = await storage.getTrainerProgramWorkouts(programId);
      for (const workout of workouts) {
        await storage.deleteWorkoutExercises(workout.id);
      }
      
      // Then delete the workouts themselves
      await storage.deleteTrainerProgramWorkouts(programId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting program workouts:", error);
      res.status(500).json({ error: "Failed to delete workouts" });
    }
  });

  // GET /api/exercises - Get all system exercises
  app.get("/api/exercises", isAuthenticated, async (req: any, res: Response) => {
    try {
      const exercises = await storage.getAllExercises();
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  // AI Recommendation routes
  app.post("/api/ai/progression-recommendation", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const { exerciseName, recentPerformance } = req.body;
      const recommendation = await generateProgressionRecommendation(
        exerciseName,
        recentPerformance
      );
      res.json(recommendation);
    } catch (error) {
      console.error("Progression recommendation error:", error);
      res.status(500).json({ error: "Failed to generate recommendation" });
    }
  });

  app.post("/api/ai/exercise-swap", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const { currentExerciseName, targetMovementPattern, availableEquipment, reason } = req.body;
      const suggestions = await suggestExerciseSwap(
        currentExerciseName,
        targetMovementPattern,
        availableEquipment,
        reason
      );
      res.json({ suggestions });
    } catch (error) {
      console.error("Exercise swap error:", error);
      res.status(500).json({ error: "Failed to suggest exercise swap" });
    }
  });

  app.post("/api/exercises/similar", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      const { exerciseId, movementPattern, primaryMuscles, currentEquipment } = req.body;
      
      // Fetch user data and fitness assessment for difficulty filtering
      const user = await storage.getUser(userId);
      const latestAssessment = await storage.getLatestFitnessAssessment(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Calculate movement pattern levels and get allowed difficulties
      const { calculateMovementPatternLevels, getMovementDifficultiesMap, isExerciseAllowed: checkExerciseAllowed } = await import("@shared/utils");
      
      const fitnessLevel = latestAssessment?.experienceLevel || user.fitnessLevel || 'beginner';
      
      // Use assessment if available, otherwise default all patterns to user's declared fitness level
      const movementLevels = latestAssessment 
        ? calculateMovementPatternLevels(latestAssessment, user)
        : { 
            horizontal_push: fitnessLevel as 'beginner' | 'intermediate' | 'advanced', 
            vertical_push: fitnessLevel as 'beginner' | 'intermediate' | 'advanced', 
            vertical_pull: fitnessLevel as 'beginner' | 'intermediate' | 'advanced',
            horizontal_pull: fitnessLevel as 'beginner' | 'intermediate' | 'advanced', 
            squat: fitnessLevel as 'beginner' | 'intermediate' | 'advanced', 
            lunge: fitnessLevel as 'beginner' | 'intermediate' | 'advanced', 
            hinge: fitnessLevel as 'beginner' | 'intermediate' | 'advanced', 
            core: fitnessLevel as 'beginner' | 'intermediate' | 'advanced', 
            carry: fitnessLevel as 'beginner' | 'intermediate' | 'advanced', 
            cardio: fitnessLevel as 'beginner' | 'intermediate' | 'advanced', 
            rotation: fitnessLevel as 'beginner' | 'intermediate' | 'advanced' 
          };
      
      const movementDifficulties = getMovementDifficultiesMap(movementLevels, fitnessLevel);
      
      // Get allowed difficulty levels for this movement pattern
      const allowedDifficulties = movementDifficulties[movementPattern as keyof typeof movementDifficulties] || ['beginner'];
      
      // Database-level filtering: fetch only exercises matching movement pattern and difficulty
      const { sql: sqlFunc } = await import("drizzle-orm");
      
      const candidateExercises = await db.select()
        .from(exercises)
        .where(
          sqlFunc`${exercises.movementPattern} = ${movementPattern} 
              AND ${exercises.difficulty} = ANY(ARRAY[${sqlFunc.join(allowedDifficulties.map(d => sqlFunc`${d}`), sqlFunc`, `)}]::text[])`
        );
      
      // Client-side filtering: only filter by muscle groups now
      const similarExercises = candidateExercises.filter(ex => {
        // Match broad muscle groups
        const hasMatchingMuscle = primaryMuscles.some((muscle: string) => 
          ex.primaryMuscles.includes(muscle)
        );
        return hasMatchingMuscle;
      });

      // Build results with ALL available equipment variants
      const results: Array<Exercise & { selectedEquipment?: string }> = [];
      const userEquipment = user.equipment || [];
      
      for (const ex of similarExercises) {
        // Get all equipment options that user has OR bodyweight (always available)
        const availableEquipment = ex.equipment.filter(eq => 
          eq === 'bodyweight' || userEquipment.includes(eq)
        );
        
        if (availableEquipment.length === 0) {
          // Skip exercises with no compatible equipment
          continue;
        }
        
        // Add one entry per available equipment variant
        for (const equipment of availableEquipment) {
          // Skip if this is the exact same exercise with same equipment (no point swapping to itself)
          if (ex.id === exerciseId && equipment === currentEquipment) {
            continue;
          }
          
          results.push({ ...ex, selectedEquipment: equipment });
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error("Similar exercises error:", error);
      res.status(500).json({ error: "Failed to fetch similar exercises" });
    }
  });

  // ==========================================
  // PROGRAM REVIEW ROUTES
  // ==========================================

  // POST /api/programs/:id/reviews - Create a review for a program
  app.post("/api/programs/:id/reviews", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { id: programId } = req.params;
      const { rating, reviewText } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const canReview = await storage.canUserReviewProgram(userId, programId);
      if (!canReview) {
        return res.status(403).json({ error: "You can only review programs you have purchased" });
      }

      const review = await storage.createProgramReview({
        programId,
        userId,
        rating,
        reviewText: reviewText || null,
        status: "published",
      });

      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating program review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // GET /api/programs/:id/reviews - Get reviews for a program
  app.get("/api/programs/:id/reviews", async (req: Request, res: Response) => {
    try {
      const { id: programId } = req.params;
      const reviews = await storage.getProgramReviews(programId);
      const averageRating = await storage.getProgramAverageRating(programId);
      
      res.json({
        reviews,
        averageRating,
        totalReviews: reviews.length,
      });
    } catch (error) {
      console.error("Error fetching program reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // ==========================================
  // PROGRAM ASSIGNMENT ROUTES
  // ==========================================

  // POST /api/trainer/assign-program - Assign a program to a client (no purchase required)
  app.post("/api/trainer/assign-program", isAuthenticated, async (req: any, res: Response) => {
    try {
      const trainerId = req.user.claims.sub;
      const { clientId, programId, note } = req.body;

      if (!clientId || !programId) {
        return res.status(400).json({ error: "Client ID and Program ID are required" });
      }

      // Verify the client is connected to this trainer
      const clients = await storage.getTrainerClientsWithPrograms(trainerId);
      const isConnected = clients.some(c => c.clientId === clientId);
      
      if (!isConnected) {
        return res.status(403).json({ error: "Client is not connected to your account" });
      }

      // Verify the program belongs to this trainer
      const program = await storage.getTrainerProgramById(programId);
      if (!program || program.trainerId !== trainerId) {
        return res.status(403).json({ error: "Program not found or does not belong to you" });
      }

      const assignment = await storage.assignProgramToClient(trainerId, clientId, programId, note);
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning program:", error);
      res.status(500).json({ error: "Failed to assign program" });
    }
  });

  const httpServer = createServer(app);

  // Mark routes as registered only after successful setup
  routesRegistered = true;
  console.log("[ROUTES] Route registration completed successfully");

  return httpServer;
}
