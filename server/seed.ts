import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { trainerDiscountCodes, programPurchases, workoutSessions } from "@shared/schema";

const TRAINER_ID = 'test-trainer-123';

// Real user IDs for clients and additional trainers
const CLIENT_IDS = {
  SARAH: 'user-sarah-001',
  MIKE: 'user-mike-002',
  JESSICA: 'user-jessica-003',
  DAVID: 'user-david-004',
};

const TRAINER_IDS = {
  ALEX: TRAINER_ID, // Our test trainer
  EMMA: 'trainer-emma-001',
  JAMES: 'trainer-james-002',
};

export async function seedDatabase() {
  console.log('[SEED] Starting database seed...');

  try {
    // Create all users first (clients and trainers)
    console.log('[SEED] Creating users...');
    
    const users = [
      // Test trainer (for development login)
      {
        id: TRAINER_IDS.ALEX,
        email: 'alex.trainer@morphit.dev',
        firstName: 'Alex',
        lastName: 'Martinez',
        profileImageUrl: null,
        isDiscoverable: true,
      },
      // Client users
      {
        id: CLIENT_IDS.SARAH,
        email: 'sarah.johnson@example.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        profileImageUrl: null,
        isDiscoverable: true,
      },
      {
        id: CLIENT_IDS.MIKE,
        email: 'mike.chen@example.com',
        firstName: 'Mike',
        lastName: 'Chen',
        profileImageUrl: null,
        isDiscoverable: true,
      },
      {
        id: CLIENT_IDS.JESSICA,
        email: 'jessica.rodriguez@example.com',
        firstName: 'Jessica',
        lastName: 'Rodriguez',
        profileImageUrl: null,
        isDiscoverable: false, // This user opted out of discoverability
      },
      {
        id: CLIENT_IDS.DAVID,
        email: 'david.kim@example.com',
        firstName: 'David',
        lastName: 'Kim',
        profileImageUrl: null,
        isDiscoverable: true,
      },
      // Additional trainer users
      {
        id: TRAINER_IDS.EMMA,
        email: 'emma.wilson@morphit.dev',
        firstName: 'Emma',
        lastName: 'Wilson',
        profileImageUrl: null,
        isDiscoverable: true,
      },
      {
        id: TRAINER_IDS.JAMES,
        email: 'james.taylor@morphit.dev',
        firstName: 'James',
        lastName: 'Taylor',
        profileImageUrl: null,
        isDiscoverable: true,
      },
    ];

    for (const user of users) {
      await storage.upsertUser(user);
    }
    console.log(`[SEED] Created ${users.length} users`);

    // Create trainer profiles
    console.log('[SEED] Creating trainer profiles...');
    
    // Main test trainer - Alex Martinez
    const existingProfile = await storage.getTrainerProfile(TRAINER_IDS.ALEX);
    
    // Set premium join date to 45 days ago to allow code generation
    const premiumJoinDate = new Date();
    premiumJoinDate.setDate(premiumJoinDate.getDate() - 45);
    
    if (!existingProfile) {
      await storage.createTrainerProfile({
        userId: TRAINER_IDS.ALEX,
        username: 'alexmartinez',
        bio: "Certified strength coach with 10+ years experience helping clients build sustainable fitness habits. Specializing in functional movement patterns and longevity-focused training.",
        yearsExperience: 10,
        certifications: ['NSCA-CPT', 'CSCS', 'FMS Level 2'],
        specialties: ['Strength Training', 'Functional Movement', 'Corrective Exercise', 'Athletic Performance'],
        socialLinks: {
          instagram: '@alexmartinez_fitness',
          website: 'https://alexmartinezfitness.com',
        },
        subscriptionStatus: 'premium',
        premiumJoinedAt: premiumJoinDate,
        onboardingStatus: 'completed',
      });
    } else if (existingProfile.username !== 'alexmartinez') {
      await storage.updateTrainerProfile(TRAINER_IDS.ALEX, {
        username: 'alexmartinez',
        subscriptionStatus: 'premium',
        premiumJoinedAt: premiumJoinDate,
      });
    }

    // Emma Wilson - Yoga & Mobility specialist
    const existingEmma = await storage.getTrainerProfile(TRAINER_IDS.EMMA);
    if (!existingEmma) {
      await storage.createTrainerProfile({
        userId: TRAINER_IDS.EMMA,
        username: 'emmawilson',
        bio: "Yoga instructor and mobility specialist. I help busy professionals reduce pain and improve movement quality through targeted flexibility work.",
        yearsExperience: 7,
        certifications: ['RYT-500', 'FRC Mobility Specialist'],
        specialties: ['Yoga', 'Mobility', 'Flexibility', 'Pain Management'],
        socialLinks: {
          instagram: '@emma_moves',
        },
        subscriptionStatus: 'free',
        onboardingStatus: 'completed',
      });
    }

    // James Taylor - Endurance & Running coach
    const existingJames = await storage.getTrainerProfile(TRAINER_IDS.JAMES);
    if (!existingJames) {
      await storage.createTrainerProfile({
        userId: TRAINER_IDS.JAMES,
        username: 'jamestaylor',
        bio: "Marathon runner and endurance coach. Helping runners of all levels achieve their goals through structured training and injury prevention.",
        yearsExperience: 5,
        certifications: ['USATF Level 1', 'CPR/AED'],
        specialties: ['Running', 'Endurance Training', 'Marathon Prep', 'Injury Prevention'],
        socialLinks: {
          website: 'https://runwithjames.com',
        },
        subscriptionStatus: 'free',
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
      console.log(`[SEED] Programs already exist (${existingPrograms.length} found), updating to Morphit cycle names`);
      
      // Find programs by old names and update them
      const oldProgram1 = existingPrograms.find(p => p.name === 'Upper Body Power Builder' || p.name === 'Flow');
      const oldProgram2 = existingPrograms.find(p => p.name === 'Functional Movement Mastery' || p.name === 'Build');
      const oldProgram3 = existingPrograms.find(p => p.name === 'Beginner Strength Foundation' || p.name === 'Strong');
      
      if (oldProgram1 && oldProgram1.name !== 'Flow') {
        await storage.updateTrainerProgram(oldProgram1.id, {
          name: 'Flow',
          description: 'Mobility-focused program emphasizing movement quality, flexibility, and body control. Perfect for recovery and building a solid foundation.',
          difficulty: 'beginner',
          daysPerWeek: 3,
        });
        console.log('[SEED] Updated program to "Flow"');
      }
      
      if (oldProgram2 && oldProgram2.name !== 'Build') {
        await storage.updateTrainerProgram(oldProgram2.id, {
          name: 'Build',
          description: 'Hypertrophy-focused program designed to build muscle mass through progressive overload and volume training.',
          difficulty: 'intermediate',
          daysPerWeek: 4,
        });
        console.log('[SEED] Updated program to "Build"');
      }
      
      if (oldProgram3 && oldProgram3.name !== 'Strong') {
        await storage.updateTrainerProgram(oldProgram3.id, {
          name: 'Strong',
          description: 'Strength-focused program using heavy compound movements and progressive loading to maximize force production and power.',
          difficulty: 'advanced',
          daysPerWeek: 4,
        });
        console.log('[SEED] Updated program to "Strong"');
      }
      
      program1 = oldProgram1 || existingPrograms.find(p => p.name === 'Flow');
      program2 = oldProgram2 || existingPrograms.find(p => p.name === 'Build');
      program3 = oldProgram3 || existingPrograms.find(p => p.name === 'Strong');
    } else {
    
    // Program 1: Flow
    program1 = await storage.createTrainerProgram({
      trainerId: TRAINER_ID,
      name: 'Flow',
      description: 'Mobility-focused program emphasizing movement quality, flexibility, and body control. Perfect for recovery and building a solid foundation.',
      price: 29.99,
      pricingType: 'one_time',
      difficulty: 'beginner',
      daysPerWeek: 3,
      durationWeeks: 4,
      isPublished: 1,
      slug: 'flow',
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

    // Program 2: Build
    program2 = await storage.createTrainerProgram({
      trainerId: TRAINER_ID,
      name: 'Build',
      description: 'Hypertrophy-focused program designed to build muscle mass through progressive overload and volume training.',
      price: 39.99,
      pricingType: 'subscription',
      difficulty: 'intermediate',
      daysPerWeek: 4,
      durationWeeks: 4,
      isPublished: 1,
      slug: 'build',
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

    // Program 3: Strong
    program3 = await storage.createTrainerProgram({
      trainerId: TRAINER_ID,
      name: 'Strong',
      description: 'Strength-focused program using heavy compound movements and progressive loading to maximize force production and power.',
      price: 49.99,
      pricingType: 'one_time',
      difficulty: 'advanced',
      daysPerWeek: 4,
      durationWeeks: 4,
      isPublished: 1,
      slug: 'strong',
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

    // Create trainer-client connections and purchases
    console.log('[SEED] Creating trainer-client connections and purchases...');

    const existingClients = await storage.getTrainerClientsWithPrograms(TRAINER_IDS.ALEX);
    if (existingClients.length > 0) {
      console.log(`[SEED] Trainer-client connections already exist (${existingClients.length} found), skipping creation`);
    } else {
      // Sarah bought Upper Body Power Builder from Alex
      const purchase1Price = 49.99;
      const purchase1 = await storage.createProgramPurchase({
        trainerProgramId: program1.id,
        trainerId: TRAINER_IDS.ALEX,
        buyerId: CLIENT_IDS.SARAH,
        purchasePrice: purchase1Price,
        platformFee: purchase1Price * 0.20,
        trainerEarnings: purchase1Price * 0.80,
        pricingType: 'one_time',
        status: 'completed',
        isAssigned: 0,
      });

      await storage.createTrainerClient({
        trainerId: TRAINER_IDS.ALEX,
        clientId: CLIENT_IDS.SARAH,
        sourcePurchaseId: purchase1.id,
      });

      // Mike bought Functional Movement Mastery from Alex
      const purchase2Price = 29.99;
      const purchase2 = await storage.createProgramPurchase({
        trainerProgramId: program2.id,
        trainerId: TRAINER_IDS.ALEX,
        buyerId: CLIENT_IDS.MIKE,
        purchasePrice: purchase2Price,
        platformFee: purchase2Price * 0.20,
        trainerEarnings: purchase2Price * 0.80,
        pricingType: 'subscription',
        status: 'completed',
        isAssigned: 0,
      });

      await storage.createTrainerClient({
        trainerId: TRAINER_IDS.ALEX,
        clientId: CLIENT_IDS.MIKE,
        sourcePurchaseId: purchase2.id,
      });

      // Jessica also bought Functional Movement Mastery from Alex
      const purchase3 = await storage.createProgramPurchase({
        trainerProgramId: program2.id,
        trainerId: TRAINER_IDS.ALEX,
        buyerId: CLIENT_IDS.JESSICA,
        purchasePrice: purchase2Price,
        platformFee: purchase2Price * 0.20,
        trainerEarnings: purchase2Price * 0.80,
        pricingType: 'subscription',
        status: 'completed',
        isAssigned: 0,
      });

      await storage.createTrainerClient({
        trainerId: TRAINER_IDS.ALEX,
        clientId: CLIENT_IDS.JESSICA,
        sourcePurchaseId: purchase3.id,
      });

      console.log('[SEED] Created 3 trainer-client connections with program purchases');
    }

    // Update client profiles with realistic fitness data
    console.log('[SEED] Updating client profiles with fitness data...');
    
    await storage.updateUser(CLIENT_IDS.SARAH, {
      fitnessLevel: 'beginner',
      equipment: ['bodyweight', 'dumbbells', 'resistance_bands'],
      daysPerWeek: 4,
      workoutDuration: 45,
      unitPreference: 'imperial',
      focusCycle: 'flow',
    });

    await storage.updateUser(CLIENT_IDS.MIKE, {
      fitnessLevel: 'intermediate',
      equipment: ['barbell', 'dumbbells', 'bench', 'squat_rack', 'pull_up_bar', 'kettlebells'],
      daysPerWeek: 5,
      workoutDuration: 60,
      unitPreference: 'imperial',
      focusCycle: 'strong',
    });

    await storage.updateUser(CLIENT_IDS.JESSICA, {
      fitnessLevel: 'advanced',
      equipment: ['bodyweight', 'dumbbells', 'pull_up_bar'],
      daysPerWeek: 6,
      workoutDuration: 75,
      unitPreference: 'metric',
      focusCycle: 'build',
    });

    console.log('[SEED] Updated 3 client profiles');

    // Create fitness assessments for clients
    console.log('[SEED] Creating fitness assessments...');
    
    const existingAssessments = await storage.getUserFitnessAssessments(CLIENT_IDS.SARAH);
    if (existingAssessments.length === 0) {
      // Sarah's assessment (beginner level - bodyweight)
      await storage.createFitnessAssessment({
        userId: CLIENT_IDS.SARAH,
        experienceLevel: 'beginner',
        pushups: 8,
        pikePushups: 3,
        pullups: 0,
        squats: 15,
        walkingLunges: 10,
        singleLegRdl: 12,
        plankHold: 30,
      });

      // Mike's assessment (intermediate with weights)
      await storage.createFitnessAssessment({
        userId: CLIENT_IDS.MIKE,
        experienceLevel: 'intermediate',
        pushups: 25,
        pikePushups: 12,
        pullups: 8,
        squats: 30,
        walkingLunges: 20,
        singleLegRdl: 15,
        plankHold: 90,
        squat1rm: 225,
        deadlift1rm: 245,
        benchPress1rm: 185,
        overheadPress1rm: 95,
        barbellRow1rm: 135,
        dumbbellLunge1rm: 50,
        farmersCarry1rm: 100,
      });

      // Jessica's assessment (advanced bodyweight/hybrid)
      await storage.createFitnessAssessment({
        userId: CLIENT_IDS.JESSICA,
        experienceLevel: 'advanced',
        pushups: 40,
        pikePushups: 20,
        pullups: 15,
        squats: 50,
        walkingLunges: 30,
        singleLegRdl: 25,
        plankHold: 180,
        mileTime: 7.5,
      });

      console.log('[SEED] Created 3 fitness assessments');
    } else {
      console.log('[SEED] Fitness assessments already exist, skipping');
    }

    // Create workout sessions for clients
    console.log('[SEED] Creating workout sessions for clients...');
    
    // Helper function to get date strings
    const getDateString = (daysOffset: number): string => {
      const date = new Date();
      date.setDate(date.getDate() + daysOffset);
      return date.toISOString().split('T')[0];
    };

    // Fetch existing purchases to get workoutProgramId (needed for idempotent seeding)
    const sarahPurchases = await db.select().from(programPurchases).where(eq(programPurchases.buyerId, CLIENT_IDS.SARAH));
    const mikePurchases = await db.select().from(programPurchases).where(eq(programPurchases.buyerId, CLIENT_IDS.MIKE));
    const jessicaPurchases = await db.select().from(programPurchases).where(eq(programPurchases.buyerId, CLIENT_IDS.JESSICA));

    const sarahProgramId = sarahPurchases[0]?.workoutProgramId || 'program-sarah-1';
    const mikeProgramId = mikePurchases[0]?.workoutProgramId || 'program-mike-1';
    const jessicaProgramId = jessicaPurchases[0]?.workoutProgramId || 'program-jessica-1';

    // Check if sessions already exist for each client (check for specific seed session IDs)
    const sarahSessions = await db.select().from(workoutSessions).where(eq(workoutSessions.id, 'session-sarah-1'));
    const mikeSessions = await db.select().from(workoutSessions).where(eq(workoutSessions.id, 'session-mike-1'));
    const jessicaSessions = await db.select().from(workoutSessions).where(eq(workoutSessions.id, 'session-jessica-1'));
    
    if (sarahSessions.length === 0) {
      // Sarah's sessions (beginner, building consistency)
      // Completed workout from 5 days ago
      await db.insert(workoutSessions).values({
        id: 'session-sarah-1',
        userId: CLIENT_IDS.SARAH,
        scheduledDate: getDateString(-5),
        status: 'completed',
        durationMinutes: 42,
        caloriesBurned: 185,
        trainerPreSessionNotes: 'Great job getting started! Focus on form over speed today.',
        trainerPostSessionReview: 'Excellent first session! Your squat form was solid. Keep it up!',
      });

      // Completed workout from 3 days ago
      await db.insert(workoutSessions).values({
        id: 'session-sarah-2',
        userId: CLIENT_IDS.SARAH,
        scheduledDate: getDateString(-3),
        status: 'completed',
        durationMinutes: 45,
        caloriesBurned: 195,
      });

      // Completed workout from yesterday
      await db.insert(workoutSessions).values({
        id: 'session-sarah-3',
        userId: CLIENT_IDS.SARAH,
        scheduledDate: getDateString(-1),
        status: 'completed',
        durationMinutes: 48,
        caloriesBurned: 210,
        trainerPostSessionReview: 'Nice progress! I noticed you increased your push-up reps. Keep building that strength.',
      });

      // Today's workout - ready to start
      await db.insert(workoutSessions).values({
        id: 'session-sarah-4',
        userId: CLIENT_IDS.SARAH,
        scheduledDate: getDateString(0),
        status: 'scheduled',
        trainerPreSessionNotes: 'You\'re doing great! Today we\'ll add some variety with resistance bands. Take your time and focus on the mind-muscle connection.',
      });

      // Scheduled for tomorrow
      await db.insert(workoutSessions).values({
        id: 'session-sarah-5',
        userId: CLIENT_IDS.SARAH,
        scheduledDate: getDateString(1),
        status: 'scheduled',
      });

      // Scheduled for 3 days from now
      await db.insert(workoutSessions).values({
        id: 'session-sarah-6',
        userId: CLIENT_IDS.SARAH,
        scheduledDate: getDateString(3),
        status: 'scheduled',
      });

      console.log('[SEED] Created 6 workout sessions for Sarah');
    } else {
      console.log('[SEED] Sarah workout sessions already exist, skipping');
    }

    if (mikeSessions.length === 0) {
      // Mike's sessions (intermediate, consistent performer)
      // Completed from 6 days ago
      await db.insert(workoutSessions).values({
        id: 'session-mike-1',
        userId: CLIENT_IDS.MIKE,
        scheduledDate: getDateString(-6),
        status: 'completed',
        durationMinutes: 58,
        caloriesBurned: 340,
        trainerPreSessionNotes: 'Ready for a challenging lower body day? Let\'s focus on progressive overload.',
        trainerPostSessionReview: 'Solid work on squats! Your 225lb form was perfect. Ready to add 5lbs next week.',
      });

      // Completed from 4 days ago
      await db.insert(workoutSessions).values({
        id: 'session-mike-2',
        userId: CLIENT_IDS.MIKE,
        scheduledDate: getDateString(-4),
        status: 'completed',
        durationMinutes: 62,
        caloriesBurned: 380,
      });

      // Completed from 2 days ago
      await db.insert(workoutSessions).values({
        id: 'session-mike-3',
        userId: CLIENT_IDS.MIKE,
        scheduledDate: getDateString(-2),
        status: 'completed',
        durationMinutes: 60,
        caloriesBurned: 365,
        trainerPostSessionReview: 'Great pull day! Your deadlift technique is improving. Keep that back straight and core tight.',
      });

      // In-progress (started today)
      await db.insert(workoutSessions).values({
        id: 'session-mike-4',
        userId: CLIENT_IDS.MIKE,
        scheduledDate: getDateString(0),
        status: 'in_progress',
        trainerPreSessionNotes: 'Upper body push focus today. Remember to control the eccentric phase on bench press.',
      });

      // Scheduled for 2 days from now
      await db.insert(workoutSessions).values({
        id: 'session-mike-5',
        userId: CLIENT_IDS.MIKE,
        scheduledDate: getDateString(2),
        status: 'scheduled',
      });

      // Scheduled for 4 days from now
      await db.insert(workoutSessions).values({
        id: 'session-mike-6',
        userId: CLIENT_IDS.MIKE,
        scheduledDate: getDateString(4),
        status: 'scheduled',
        trainerPreSessionNotes: 'Deload week coming up. We\'ll reduce intensity by 20% to allow for recovery.',
      });

      // Scheduled for 6 days from now
      await db.insert(workoutSessions).values({
        id: 'session-mike-7',
        userId: CLIENT_IDS.MIKE,
        scheduledDate: getDateString(6),
        status: 'scheduled',
      });

      console.log('[SEED] Created 7 workout sessions for Mike');
    } else {
      console.log('[SEED] Mike workout sessions already exist, skipping');
    }

    if (jessicaSessions.length === 0) {
      // Jessica's sessions (advanced, high volume)
      // Completed from 7 days ago
      await db.insert(workoutSessions).values({
        id: 'session-jessica-1',
        userId: CLIENT_IDS.JESSICA,
        scheduledDate: getDateString(-7),
        status: 'completed',
        durationMinutes: 72,
        caloriesBurned: 420,
        trainerPostSessionReview: 'Impressive endurance work! Your cardio capacity is next level.',
      });

      // Completed from 5 days ago
      await db.insert(workoutSessions).values({
        id: 'session-jessica-2',
        userId: CLIENT_IDS.JESSICA,
        scheduledDate: getDateString(-5),
        status: 'completed',
        durationMinutes: 78,
        caloriesBurned: 445,
      });

      // Completed from 3 days ago
      await db.insert(workoutSessions).values({
        id: 'session-jessica-3',
        userId: CLIENT_IDS.JESSICA,
        scheduledDate: getDateString(-3),
        status: 'completed',
        durationMinutes: 75,
        caloriesBurned: 430,
        trainerPreSessionNotes: 'Today we\'re testing your max pull-ups. Go for a new PR!',
        trainerPostSessionReview: '15 pull-ups! New record! Your back strength is phenomenal.',
      });

      // Completed from yesterday
      await db.insert(workoutSessions).values({
        id: 'session-jessica-4',
        userId: CLIENT_IDS.JESSICA,
        scheduledDate: getDateString(-1),
        status: 'completed',
        durationMinutes: 74,
        caloriesBurned: 435,
      });

      // Today's workout - scheduled
      await db.insert(workoutSessions).values({
        id: 'session-jessica-5',
        userId: CLIENT_IDS.JESSICA,
        scheduledDate: getDateString(0),
        status: 'scheduled',
        trainerPreSessionNotes: 'Active recovery day. Focus on mobility and light cardio. Your body needs this!',
      });

      // Scheduled for 2 days from now
      await db.insert(workoutSessions).values({
        id: 'session-jessica-6',
        userId: CLIENT_IDS.JESSICA,
        scheduledDate: getDateString(2),
        status: 'scheduled',
      });

      // Scheduled for 4 days from now
      await db.insert(workoutSessions).values({
        id: 'session-jessica-7',
        userId: CLIENT_IDS.JESSICA,
        scheduledDate: getDateString(4),
        status: 'scheduled',
      });

      // Scheduled for 6 days from now
      await db.insert(workoutSessions).values({
        id: 'session-jessica-8',
        userId: CLIENT_IDS.JESSICA,
        scheduledDate: getDateString(6),
        status: 'scheduled',
        trainerPreSessionNotes: 'Big strength day ahead. We\'re going heavy on compound movements. Get plenty of rest tonight!',
      });

      console.log('[SEED] Created 8 workout sessions for Jessica');
    } else {
      console.log('[SEED] Jessica workout sessions already exist, skipping');
    }

    console.log('[SEED] Workout session seeding complete');

    // Create bidirectional trainer-client invitations
    console.log('[SEED] Creating sample invitations...');
    
    const existingTrainerInvitations = await storage.getTrainerInvites(TRAINER_IDS.ALEX);
    if (existingTrainerInvitations.length > 0) {
      console.log(`[SEED] Invitations already exist, skipping creation`);
    } else {
      // Trainer-initiated invites (Alex inviting clients)
      // Alex → David (pending - waiting for David to accept)
      await storage.createTrainerClientInvite({
        trainerId: TRAINER_IDS.ALEX,
        clientId: CLIENT_IDS.DAVID,
        initiatorRole: 'trainer',
        status: 'pending',
      });

      // Client-initiated invites (clients inviting trainers)
      // Sarah → Emma (pending - Sarah wants to work with Emma too)
      await storage.createTrainerClientInvite({
        trainerId: TRAINER_IDS.EMMA,
        clientId: CLIENT_IDS.SARAH,
        initiatorRole: 'client',
        status: 'pending',
      });

      // Mike → James (pending - Mike interested in running coaching)
      await storage.createTrainerClientInvite({
        trainerId: TRAINER_IDS.JAMES,
        clientId: CLIENT_IDS.MIKE,
        initiatorRole: 'client',
        status: 'pending',
      });

      // David → Alex (pending - showing both directions)
      await storage.createTrainerClientInvite({
        trainerId: TRAINER_IDS.ALEX,
        clientId: CLIENT_IDS.DAVID,
        initiatorRole: 'client',
        status: 'pending',
      });

      console.log('[SEED] Created 4 pending invitations (2 trainer-initiated, 2 client-initiated)');
    }

    // Add discount codes for Alex (premium trainer)
    console.log('[SEED] Creating discount codes...');
    
    const existingDiscountCodes = await storage.getTrainerDiscountCodes(TRAINER_IDS.ALEX);
    if (existingDiscountCodes.length > 0) {
      console.log(`[SEED] Discount codes already exist (${existingDiscountCodes.length} found), skipping creation`);
    } else {
      // Active unused code (created recently, expires in 25 days)
      const activeTo = new Date();
      activeTo.setDate(activeTo.getDate() + 25);
      
      await storage.createTrainerDiscountCode({
        trainerId: TRAINER_IDS.ALEX,
        code: 'ALEX25-X7KP',
        expiresAt: activeTo,
      });

      // Active used code (created 10 days ago, redeemed 5 days ago by Sarah)
      const usedCreated = new Date();
      usedCreated.setDate(usedCreated.getDate() - 10);
      const usedExpires = new Date(usedCreated);
      usedExpires.setDate(usedExpires.getDate() + 30);
      const usedRedeemed = new Date();
      usedRedeemed.setDate(usedRedeemed.getDate() - 5);
      
      await db.insert(trainerDiscountCodes).values({
        trainerId: TRAINER_IDS.ALEX,
        code: 'ALEX25-PREV1',
        createdAt: usedCreated,
        expiresAt: usedExpires,
        redeemedAt: usedRedeemed,
        redeemedBy: CLIENT_IDS.SARAH,
      });

      // Expired code (created 50 days ago, never used)
      const expiredCreated = new Date();
      expiredCreated.setDate(expiredCreated.getDate() - 50);
      const expiredExpires = new Date(expiredCreated);
      expiredExpires.setDate(expiredExpires.getDate() + 30);
      
      await db.insert(trainerDiscountCodes).values({
        trainerId: TRAINER_IDS.ALEX,
        code: 'ALEX25-OLD',
        createdAt: expiredCreated,
        expiresAt: expiredExpires,
      });

      console.log('[SEED] Created 3 discount codes (1 active unused, 1 used, 1 expired)');
    }

    console.log('[SEED] Database seed completed successfully!');
    console.log('[SEED] =====================================');
    console.log('[SEED] Test Users Created:');
    console.log('[SEED]');
    console.log('[SEED] TRAINER (for dev login):');
    console.log('[SEED]   Name: Alex Martinez (@alexmartinez)');
    console.log('[SEED]   Email: alex.trainer@morphit.dev');
    console.log('[SEED]   ID: test-trainer-123');
    console.log('[SEED]   Has: 3 active clients, 10 custom exercises, 3 programs');
    console.log('[SEED]');
    console.log('[SEED] CLIENTS:');
    console.log('[SEED]   • Sarah Johnson (sarah.johnson@example.com) - Alex\'s client');
    console.log('[SEED]   • Mike Chen (mike.chen@example.com) - Alex\'s client');
    console.log('[SEED]   • Jessica Rodriguez (jessica.rodriguez@example.com) - Alex\'s client, not discoverable');
    console.log('[SEED]   • David Kim (david.kim@example.com) - No trainer yet');
    console.log('[SEED]');
    console.log('[SEED] OTHER TRAINERS:');
    console.log('[SEED]   • Emma Wilson (@emmawilson) - Yoga & Mobility');
    console.log('[SEED]   • James Taylor (@jamestaylor) - Running Coach');
    console.log('[SEED]');
    console.log('[SEED] PENDING INVITATIONS:');
    console.log('[SEED]   • Alex → David (trainer-initiated)');
    console.log('[SEED]   • David → Alex (client-initiated)');
    console.log('[SEED]   • Sarah → Emma (client-initiated)');
    console.log('[SEED]   • Mike → James (client-initiated)');
    console.log('[SEED] =====================================');
    console.log('[SEED] Navigate to /trainer to see Alex\'s trainer dashboard');

  } catch (error) {
    console.error('[SEED] Error seeding database:', error);
    throw error;
  }
}
