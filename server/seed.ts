import { storage } from "./storage";

const TRAINER_ID = 'test-trainer-123';

export async function seedDatabase() {
  console.log('[SEED] Starting database seed...');

  try {
    // Task 2: Create realistic trainer profile
    console.log('[SEED] Creating trainer profile...');
    
    // Check if profile already exists
    const existingProfile = await storage.getTrainerProfile(TRAINER_ID);
    
    if (!existingProfile) {
      await storage.createTrainerProfile({
        userId: TRAINER_ID,
        bio: "Certified strength coach with 10+ years experience helping clients build sustainable fitness habits. Specializing in functional movement patterns and longevity-focused training.",
        yearsExperience: 10,
        certifications: ['NSCA-CPT', 'CSCS', 'FMS Level 2'],
        specialties: ['Strength Training', 'Functional Movement', 'Corrective Exercise', 'Athletic Performance'],
        socialLinks: {
          instagram: '@alexmartinez_fitness',
          website: 'https://alexmartinezfitness.com',
        },
        onboardingStatus: 'completed',
      });
    }

    // Task 3: Seed custom exercises covering all 10 movement patterns
    console.log('[SEED] Creating custom exercises...');
    
    // Check if exercises already exist to prevent duplicates
    const existingExercises = await storage.getTrainerCustomExercises(TRAINER_ID);
    let createdExercises = existingExercises;
    
    if (existingExercises.length === 0) {
      const customExercises = [
        // 1. Horizontal Push
        {
          trainerId: TRAINER_ID,
          name: 'Floor Press Variation',
          videoUrl: 'https://youtube.com/watch?v=example1',
          exerciseCategory: 'compound' as const,
          trackingType: 'reps' as const,
          difficulty: 'intermediate' as const,
          primaryMuscles: ['chest', 'triceps'],
          secondaryMuscles: ['shoulders'],
          movementPattern: 'horizontal_push',
          equipment: ['dumbbells'],
        },
        // 2. Vertical Push
        {
          trainerId: TRAINER_ID,
          name: 'Z-Press',
          videoUrl: 'https://youtube.com/watch?v=example2',
          exerciseCategory: 'compound' as const,
          trackingType: 'reps' as const,
          difficulty: 'advanced' as const,
          primaryMuscles: ['shoulders', 'triceps'],
          secondaryMuscles: ['core'],
          movementPattern: 'vertical_push',
          equipment: ['barbell'],
        },
        // 3. Horizontal Pull
        {
          trainerId: TRAINER_ID,
          name: 'Banded Pull-Aparts',
          videoUrl: 'https://youtube.com/watch?v=example3',
          exerciseCategory: 'isolation' as const,
          trackingType: 'reps' as const,
          difficulty: 'beginner' as const,
          primaryMuscles: ['upper_back', 'rear_delts'],
          secondaryMuscles: ['rotator_cuff'],
          movementPattern: 'horizontal_pull',
          equipment: ['resistance_band'],
        },
        // 4. Vertical Pull
        {
          trainerId: TRAINER_ID,
          name: 'Kneeling Lat Pulldown',
          videoUrl: 'https://youtube.com/watch?v=example4',
          exerciseCategory: 'compound' as const,
          trackingType: 'reps' as const,
          difficulty: 'intermediate' as const,
          primaryMuscles: ['lats', 'biceps'],
          secondaryMuscles: ['upper_back'],
          movementPattern: 'vertical_pull',
          equipment: ['cable_machine'],
        },
        // 5. Squat
        {
          trainerId: TRAINER_ID,
          name: 'Goblet Squat Pulse',
          videoUrl: 'https://youtube.com/watch?v=example5',
          exerciseCategory: 'compound' as const,
          trackingType: 'reps' as const,
          difficulty: 'beginner' as const,
          primaryMuscles: ['quads', 'glutes'],
          secondaryMuscles: ['core'],
          movementPattern: 'squat',
          equipment: ['dumbbells'],
        },
        // 6. Lunge
        {
          trainerId: TRAINER_ID,
          name: 'Bulgarian Split Squat to Press',
          videoUrl: 'https://youtube.com/watch?v=example6',
          exerciseCategory: 'compound' as const,
          trackingType: 'reps' as const,
          difficulty: 'advanced' as const,
          primaryMuscles: ['quads', 'glutes', 'shoulders'],
          secondaryMuscles: ['core', 'hamstrings'],
          movementPattern: 'lunge',
          equipment: ['dumbbells'],
        },
        // 7. Hinge
        {
          trainerId: TRAINER_ID,
          name: 'Single-Leg Romanian Deadlift',
          videoUrl: 'https://youtube.com/watch?v=example7',
          exerciseCategory: 'compound' as const,
          trackingType: 'reps' as const,
          difficulty: 'intermediate' as const,
          primaryMuscles: ['hamstrings', 'glutes'],
          secondaryMuscles: ['lower_back', 'core'],
          movementPattern: 'hinge',
          equipment: ['dumbbells'],
        },
        // 8. Core
        {
          trainerId: TRAINER_ID,
          name: 'Pallof Press',
          videoUrl: 'https://youtube.com/watch?v=example8',
          exerciseCategory: 'core' as const,
          trackingType: 'reps' as const,
          difficulty: 'beginner' as const,
          primaryMuscles: ['core', 'obliques'],
          secondaryMuscles: [],
          movementPattern: 'core',
          equipment: ['cable_machine'],
        },
        // 9. Rotation
        {
          trainerId: TRAINER_ID,
          name: 'Landmine Rotation',
          videoUrl: 'https://youtube.com/watch?v=example9',
          exerciseCategory: 'compound' as const,
          trackingType: 'reps' as const,
          difficulty: 'intermediate' as const,
          primaryMuscles: ['core', 'obliques'],
          secondaryMuscles: ['shoulders'],
          movementPattern: 'rotation',
          equipment: ['barbell'],
        },
        // 10. Carry
        {
          trainerId: TRAINER_ID,
          name: 'Farmer Carry to Press',
          videoUrl: 'https://youtube.com/watch?v=example10',
          exerciseCategory: 'compound' as const,
          trackingType: 'reps' as const,
          difficulty: 'intermediate' as const,
          primaryMuscles: ['shoulders', 'core'],
          secondaryMuscles: ['traps', 'forearms'],
          movementPattern: 'carry',
          equipment: ['dumbbells'],
        },
      ];

      for (const exercise of customExercises) {
        const created = await storage.createTrainerCustomExercise(exercise);
        createdExercises.push(created);
      }
      console.log(`[SEED] Created ${customExercises.length} custom exercises covering all 10 movement patterns`);
    } else {
      console.log(`[SEED] Custom exercises already exist (${existingExercises.length} found), skipping creation`);
    }

    // Task 4: Generate 2-3 complete training programs with workouts
    console.log('[SEED] Creating training programs...');
    
    // Check if programs already exist
    const existingPrograms = await storage.getTrainerPrograms(TRAINER_ID);
    
    let program1: any;
    let program2: any;
    let program3: any;
    
    if (existingPrograms.length > 0) {
      console.log(`[SEED] Programs already exist (${existingPrograms.length} found), skipping program creation`);
      // Use existing programs for purchases
      program1 = existingPrograms.find(p => p.name === 'Upper Body Power Builder');
      program2 = existingPrograms.find(p => p.name === 'Functional Movement Mastery');
      program3 = existingPrograms.find(p => p.name === 'Beginner Strength Foundation');
    } else {
    
    // Program 1: Upper Body Power
    program1 = await storage.createTrainerProgram({
      trainerId: TRAINER_ID,
      name: 'Upper Body Power Builder',
      description: 'Build explosive upper body strength with compound movements and power training. Perfect for athletes and strength enthusiasts.',
      price: 49.99,
      pricingType: 'one_time',
      difficulty: 'intermediate',
      daysPerWeek: 2,
      durationWeeks: 4,
      isPublished: 1,
      slug: 'upper-body-power-builder',
    });

    // Program 1 - Workout 1
    const p1w1 = await storage.createTrainerProgramWorkout({
      trainerProgramId: program1.id,
      weekNumber: 1,
      dayNumber: 1,
      workoutName: 'Push Power Day',
      estimatedDuration: 45,
      orderIndex: 0,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p1w1.id,
      exerciseId: '1', // Bench Press from system catalog
      customExerciseId: null,
      sets: 4,
      repsMin: 5,
      repsMax: 5,
      restSeconds: 180,
      tempo: '2-0-1-0',
      targetRPE: 8,
      targetRIR: 2,
      orderIndex: 0,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p1w1.id,
      exerciseId: '5', // Overhead Press from system catalog
      customExerciseId: null,
      sets: 3,
      repsMin: 8,
      repsMax: 8,
      restSeconds: 120,
      tempo: '2-0-1-0',
      targetRPE: 7,
      targetRIR: 3,
      orderIndex: 1,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p1w1.id,
      exerciseId: null,
      customExerciseId: createdExercises[0].id, // Banded Pull-Aparts (custom)
      sets: 3,
      repsMin: 15,
      repsMax: 15,
      restSeconds: 60,
      tempo: '1-1-1-1',
      targetRPE: 6,
      targetRIR: 4,
      orderIndex: 2,
    });

    // Program 1 - Workout 2
    const p1w2 = await storage.createTrainerProgramWorkout({
      trainerProgramId: program1.id,
      weekNumber: 1,
      dayNumber: 2,
      workoutName: 'Pull Power Day',
      estimatedDuration: 50,
      orderIndex: 1,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p1w2.id,
      exerciseId: '10', // Pull-ups from system catalog
      customExerciseId: null,
      sets: 4,
      repsMin: 6,
      repsMax: 6,
      restSeconds: 180,
      tempo: '2-0-1-0',
      targetRPE: 8,
      targetRIR: 2,
      orderIndex: 0,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p1w2.id,
      exerciseId: '15', // Barbell Row from system catalog
      customExerciseId: null,
      sets: 3,
      repsMin: 8,
      repsMax: 8,
      restSeconds: 120,
      tempo: '2-0-1-0',
      targetRPE: 7,
      targetRIR: 3,
      orderIndex: 1,
    });

    // Program 2: Full Body Functional
    program2 = await storage.createTrainerProgram({
      trainerId: TRAINER_ID,
      name: 'Functional Movement Mastery',
      description: 'Master all 10 functional movement patterns with science-backed programming. Includes rotation, carry, and anti-movement core work.',
      price: 29.99,
      pricingType: 'subscription',
      difficulty: 'beginner',
      daysPerWeek: 3,
      durationWeeks: 4,
      isPublished: 1,
      slug: 'functional-movement-mastery',
    });

    // Program 2 - Workout 1
    const p2w1 = await storage.createTrainerProgramWorkout({
      trainerProgramId: program2.id,
      weekNumber: 1,
      dayNumber: 1,
      workoutName: 'Lower Body + Core',
      estimatedDuration: 55,
      orderIndex: 0,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p2w1.id,
      exerciseId: '25', // Squats from system catalog
      customExerciseId: null,
      sets: 4,
      repsMin: 8,
      repsMax: 10,
      restSeconds: 150,
      tempo: '3-0-1-0',
      targetRPE: 7,
      targetRIR: 3,
      orderIndex: 0,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p2w1.id,
      exerciseId: null,
      customExerciseId: createdExercises[3].id, // Bulgarian Split Squat to Press (custom)
      sets: 3,
      repsMin: 10,
      repsMax: 10,
      restSeconds: 90,
      tempo: '2-0-1-0',
      targetRPE: 7,
      targetRIR: 3,
      orderIndex: 1,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p2w1.id,
      exerciseId: null,
      customExerciseId: createdExercises[4].id, // Pallof Press (custom)
      sets: 3,
      repsMin: 12,
      repsMax: 12,
      restSeconds: 60,
      tempo: '1-2-1-0',
      targetRPE: 6,
      targetRIR: 4,
      orderIndex: 2,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p2w1.id,
      exerciseId: null,
      customExerciseId: createdExercises[2].id, // Landmine Rotation (custom)
      sets: 3,
      repsMin: 10,
      repsMax: 10,
      restSeconds: 60,
      tempo: '1-0-1-0',
      targetRPE: 6,
      targetRIR: 4,
      orderIndex: 3,
    });

    // Program 2 - Workout 2
    const p2w2 = await storage.createTrainerProgramWorkout({
      trainerProgramId: program2.id,
      weekNumber: 1,
      dayNumber: 3,
      workoutName: 'Upper Body + Carry',
      estimatedDuration: 48,
      orderIndex: 1,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p2w2.id,
      exerciseId: '1', // Bench Press
      customExerciseId: null,
      sets: 3,
      repsMin: 10,
      repsMax: 10,
      restSeconds: 120,
      tempo: '2-0-1-0',
      targetRPE: 7,
      targetRIR: 3,
      orderIndex: 0,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p2w2.id,
      exerciseId: '10', // Pull-ups
      customExerciseId: null,
      sets: 3,
      repsMin: 8,
      repsMax: 8,
      restSeconds: 120,
      tempo: '2-0-1-0',
      targetRPE: 7,
      targetRIR: 3,
      orderIndex: 1,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p2w2.id,
      exerciseId: null,
      customExerciseId: createdExercises[1].id, // Farmer Carry to Press (custom)
      sets: 3,
      repsMin: 8,
      repsMax: 8,
      restSeconds: 90,
      tempo: '1-0-1-0',
      targetRPE: 7,
      targetRIR: 3,
      orderIndex: 2,
    });

    // Program 2 - Workout 3
    const p2w3 = await storage.createTrainerProgramWorkout({
      trainerProgramId: program2.id,
      weekNumber: 1,
      dayNumber: 5,
      workoutName: 'Full Body Power',
      estimatedDuration: 60,
      orderIndex: 2,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p2w3.id,
      exerciseId: '30', // Deadlift from system catalog
      customExerciseId: null,
      sets: 4,
      repsMin: 5,
      repsMax: 5,
      restSeconds: 180,
      tempo: '2-0-1-0',
      targetRPE: 8,
      targetRIR: 2,
      orderIndex: 0,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p2w3.id,
      exerciseId: '5', // Overhead Press
      customExerciseId: null,
      sets: 3,
      repsMin: 8,
      repsMax: 8,
      restSeconds: 120,
      tempo: '2-0-1-0',
      targetRPE: 7,
      targetRIR: 3,
      orderIndex: 1,
    });

    // Program 3: Starter Strength
    program3 = await storage.createTrainerProgram({
      trainerId: TRAINER_ID,
      name: 'Beginner Strength Foundation',
      description: 'Perfect for beginners looking to build a solid strength base. Simple, effective programming focused on the fundamentals.',
      price: 19.99,
      pricingType: 'one_time',
      difficulty: 'beginner',
      daysPerWeek: 3,
      durationWeeks: 4,
      isPublished: 1,
      slug: 'beginner-strength-foundation',
    });

    const p3w1 = await storage.createTrainerProgramWorkout({
      trainerProgramId: program3.id,
      weekNumber: 1,
      dayNumber: 1,
      workoutName: 'Full Body Basics',
      estimatedDuration: 40,
      orderIndex: 0,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p3w1.id,
      exerciseId: '25', // Squats
      customExerciseId: null,
      sets: 3,
      repsMin: 10,
      repsMax: 10,
      restSeconds: 90,
      tempo: '2-0-2-0',
      targetRPE: 6,
      targetRIR: 4,
      orderIndex: 0,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p3w1.id,
      exerciseId: '1', // Bench Press
      customExerciseId: null,
      sets: 3,
      repsMin: 10,
      repsMax: 10,
      restSeconds: 90,
      tempo: '2-0-2-0',
      targetRPE: 6,
      targetRIR: 4,
      orderIndex: 1,
    });

    await storage.createTrainerProgramExercise({
      trainerWorkoutId: p3w1.id,
      exerciseId: '15', // Barbell Row
      customExerciseId: null,
      sets: 3,
      repsMin: 10,
      repsMax: 10,
      restSeconds: 90,
      tempo: '2-0-2-0',
      targetRPE: 6,
      targetRIR: 4,
      orderIndex: 2,
    });
    }

    // Task 5: Populate sales data - create sample purchases and clients
    console.log('[SEED] Creating sample purchases and clients...');

    // Check if purchases already exist
    const existingClients = await storage.getTrainerClientsWithPrograms(TRAINER_ID);
    if (existingClients.length > 0) {
      console.log(`[SEED] Purchases and clients already exist (${existingClients.length} found), skipping creation`);
    } else {
      const clients = [
        { id: 'client-001', email: 'sarah.j@example.com', firstName: 'Sarah', lastName: 'Johnson' },
        { id: 'client-002', email: 'mike.chen@example.com', firstName: 'Mike', lastName: 'Chen' },
        { id: 'client-003', email: 'jessica.rodriguez@example.com', firstName: 'Jessica', lastName: 'Rodriguez' },
      ];

      for (const client of clients) {
        await storage.upsertUser(client);
      }

    // Create purchases with proper fee calculations and client relationships
    const purchase1Price = 49.99;
    const purchase1 = await storage.createProgramPurchase({
      trainerProgramId: program1.id,
      trainerId: TRAINER_ID,
      buyerId: clients[0].id,
      purchasePrice: purchase1Price,
      platformFee: purchase1Price * 0.20,
      trainerEarnings: purchase1Price * 0.80,
      pricingType: 'one_time',
      status: 'completed',
    });

    await storage.createTrainerClient({
      trainerId: TRAINER_ID,
      clientId: clients[0].id,
      sourcePurchaseId: purchase1.id,
    });

    const purchase2Price = 29.99;
    const purchase2 = await storage.createProgramPurchase({
      trainerProgramId: program2.id,
      trainerId: TRAINER_ID,
      buyerId: clients[1].id,
      purchasePrice: purchase2Price,
      platformFee: purchase2Price * 0.20,
      trainerEarnings: purchase2Price * 0.80,
      pricingType: 'subscription',
      status: 'completed',
    });

    await storage.createTrainerClient({
      trainerId: TRAINER_ID,
      clientId: clients[1].id,
      sourcePurchaseId: purchase2.id,
    });

    const purchase3 = await storage.createProgramPurchase({
      trainerProgramId: program2.id,
      trainerId: TRAINER_ID,
      buyerId: clients[2].id,
      purchasePrice: purchase2Price,
      platformFee: purchase2Price * 0.20,
      trainerEarnings: purchase2Price * 0.80,
      pricingType: 'subscription',
      status: 'completed',
    });

    await storage.createTrainerClient({
      trainerId: TRAINER_ID,
      clientId: clients[2].id,
      sourcePurchaseId: purchase3.id,
    });

    const purchase3Price = 19.99;
    const purchase4 = await storage.createProgramPurchase({
      trainerProgramId: program3.id,
      trainerId: TRAINER_ID,
      buyerId: clients[0].id,
      purchasePrice: purchase3Price,
      platformFee: purchase3Price * 0.20,
      trainerEarnings: purchase3Price * 0.80,
      pricingType: 'one_time',
      status: 'completed',
    });

      // Client 0 (Sarah) already added from purchase1, so skip duplicate client record
    }

    // Task 6: Add active invite links
    console.log('[SEED] Creating invite links...');
    
    const existingInvites = await storage.getTrainerInviteLinks(TRAINER_ID);
    if (existingInvites.length > 0) {
      console.log(`[SEED] Invite links already exist (${existingInvites.length} found), skipping creation`);
    } else {
      await storage.createTrainerInviteLink({
        trainerId: TRAINER_ID,
        code: 'WELCOME2024',
        maxUses: null, // Unlimited
        expiresAt: null, // Never expires
      });

      await storage.createTrainerInviteLink({
        trainerId: TRAINER_ID,
        code: 'LIMITED10',
        maxUses: 10,
        expiresAt: null,
      });

      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      
      await storage.createTrainerInviteLink({
        trainerId: TRAINER_ID,
        code: 'FLASH7DAY',
        maxUses: 50,
        expiresAt: oneWeekFromNow,
      });
    }

    console.log('[SEED] Database seed completed successfully!');
    console.log('[SEED] Test trainer credentials:');
    console.log('[SEED]   User ID: test-trainer-123');
    console.log('[SEED]   Email: alex.trainer@morphit.dev');
    console.log('[SEED]   Name: Alex Martinez');
    console.log('[SEED] Navigate to /trainer to see the dashboard');

  } catch (error) {
    console.error('[SEED] Error seeding database:', error);
    throw error;
  }
}
