// ==========================================
// AI PROMPT PARSER FOR FITNESS PROGRAM GENERATION
// ==========================================
// This service uses OpenAI to parse natural language prompts into structured data
// for program generation. Users can describe their fitness goals conversationally
// instead of filling out forms.
//
// Example input: "I want to build muscle and lose fat. I can train 4 days a week 
// for 45 minutes with dumbbells and a pull-up bar at home."
//
// Extracted output: { daysPerWeek: 4, sessionDuration: 45, equipment: ['dumbbells', 'pull_up_bar'], 
// nutritionGoal: 'maintain', experienceLevel: 'intermediate' }
// ==========================================

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// This is using OpenAI's API, which points to OpenAI's API servers and requires your own API key.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define the schema for extracted fitness program data
const FitnessProgramDataSchema = z.object({
  daysPerWeek: z.number()
    .min(3)
    .max(5)
    .describe("Number of workout days per week (3, 4, or 5)"),
  
  sessionDuration: z.number()
    .refine(val => [30, 45, 60, 90].includes(val))
    .describe("Workout duration in minutes (30, 45, 60, or 90)"),
  
  equipment: z.array(z.string())
    .describe("Available equipment (e.g., 'dumbbells', 'barbell', 'pull_up_bar', 'resistance_bands', 'bodyweight')"),
  
  nutritionGoal: z.enum(["gain", "maintain", "lose"])
    .describe("Primary nutrition goal: 'gain' for muscle/weight gain, 'maintain' for body composition, 'lose' for fat/weight loss"),
  
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"])
    .describe("Fitness experience level based on described abilities and background"),
  
  wantsAssessment: z.boolean()
    .describe("Whether the user wants to take a fitness assessment (true if they mention testing abilities, wanting personalized difficulty, or are intermediate/advanced; false if beginner or just want to get started quickly)"),
  
  parsedGoals: z.string()
    .describe("A brief summary of the user's stated fitness goals and motivations"),
});

export type FitnessProgramData = z.infer<typeof FitnessProgramDataSchema>;

export interface PromptParseResult {
  success: boolean;
  data?: FitnessProgramData;
  error?: string;
  missingFields?: string[];
}

// System prompt that instructs the AI how to extract fitness data
const SYSTEM_PROMPT = `You are a fitness program analyzer. Your job is to extract structured data from user descriptions of their fitness goals and constraints.

Extract the following information:
- daysPerWeek: How many days per week they can train (must be 3, 4, or 5)
- sessionDuration: How long each workout is (must be 30, 45, 60, or 90 minutes)
- equipment: What equipment they have access to (be specific: dumbbells, barbell, pull_up_bar, resistance_bands, kettlebell, bench, cable_machine, smith_machine, leg_press, etc.)
- nutritionGoal: Their primary goal (gain=build muscle/gain weight, maintain=recomp/maintain weight, lose=lose fat/weight)
- experienceLevel: Their fitness level (beginner=new to training, intermediate=some experience, advanced=years of consistent training)
- wantsAssessment: Whether they should take a fitness test (true for intermediate/advanced or if they mention wanting personalized difficulty; false for complete beginners or those wanting to start immediately)
- parsedGoals: A brief summary of what they want to achieve

EQUIPMENT MAPPING:
- "dumbbells", "free weights" → dumbbells
- "barbell", "olympic bar" → barbell
- "pull-up bar", "chin-up bar" → pull_up_bar
- "resistance bands", "bands" → resistance_bands
- "kettlebell", "kettlebells" → kettlebell
- "bench", "weight bench" → bench
- "cables", "cable machine" → cable_machine
- "smith machine" → smith_machine
- "leg press" → leg_press
- "bodyweight only", "no equipment" → bodyweight (always include this)

NUTRITION GOAL MAPPING:
- "build muscle", "gain weight", "bulk" → gain
- "lose weight", "cut", "burn fat", "get lean" → lose
- "recomp", "maintain", "stay the same", "tone" → maintain
- If they mention both building muscle AND losing fat → maintain

EXPERIENCE LEVEL MAPPING:
- Never trained, just starting, complete beginner → beginner
- Worked out before, some experience, gym regular → intermediate
- Years of training, very experienced, competitive → advanced

Make reasonable assumptions if information is missing:
- If no duration mentioned → assume 45 minutes
- If no days mentioned → assume 4 days
- If no equipment mentioned → ask what they have
- If nutrition goal unclear → assume maintain
- If experience unclear → assume intermediate`;

export async function parsePromptToFitnessData(
  userPrompt: string
): Promise<PromptParseResult> {
  try {
    // Call OpenAI with structured output
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06", // Use the model that supports structured outputs
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: zodResponseFormat(FitnessProgramDataSchema, "fitness_program_data"),
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      return {
        success: false,
        error: "Failed to parse fitness data from your prompt. Please try describing your goals, available time, and equipment.",
      };
    }

    // Parse and validate the JSON response
    const parsedData = FitnessProgramDataSchema.parse(JSON.parse(content));

    // Validate critical fields are present
    const missingFields: string[] = [];
    
    if (!parsedData.daysPerWeek) missingFields.push("days per week");
    if (!parsedData.sessionDuration) missingFields.push("workout duration");
    if (!parsedData.equipment || parsedData.equipment.length === 0) missingFields.push("available equipment");

    if (missingFields.length > 0) {
      return {
        success: false,
        error: "I need more information to create your program.",
        missingFields,
      };
    }

    // Always ensure bodyweight is included
    if (!parsedData.equipment.includes("bodyweight")) {
      parsedData.equipment.push("bodyweight");
    }

    return {
      success: true,
      data: parsedData,
    };
  } catch (error) {
    console.error("Error parsing fitness prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse your fitness goals",
    };
  }
}

// Helper function to generate example prompts for users
export function getExamplePrompts(): string[] {
  return [
    "I want to build muscle and strength. I can train 4 days a week for 45 minutes. I have dumbbells, a barbell, and a bench at home.",
    
    "I'm a beginner looking to lose weight and get in shape. I can work out 3 days a week for 30 minutes with just bodyweight exercises.",
    
    "I have gym access with all equipment and want to train 5 days a week for 60 minutes. My goal is to maintain my current weight while building muscle definition. I've been lifting for 2 years.",
    
    "I travel a lot for work so I need workouts I can do anywhere. I can train 4 days a week for 45 minutes, usually with just dumbbells or bodyweight. Want to stay lean and strong.",
  ];
}
