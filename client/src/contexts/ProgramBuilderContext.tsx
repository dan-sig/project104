import { createContext, useContext, useReducer, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

// Types
interface ProgramBuilderState {
  // Basic Info
  name: string;
  description: string | null;
  basedOnTemplate: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  durationWeeks: number;
  daysPerWeek: number;
  
  // Pricing
  price: number;
  pricingType: "one_time" | "subscription";
  
  // Workouts
  workouts: Workout[];
}

interface Workout {
  id: string; // Temporary client-side ID
  weekNumber: number;
  dayNumber: number;
  workoutName: string;
  description: string | null;
  movementFocus: string | null;
  estimatedDuration: number;
  orderIndex: number;
  exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string; // Temporary client-side ID
  exerciseId: string | null;
  customExerciseId: string | null;
  exerciseName: string;
  sets: number;
  reps: string;
  weight: number | null;
  tempo: string | null;
  restSeconds: number;
  targetRPE: number | null;
  targetRIR: number | null;
  notes: string | null;
  orderIndex: number;
}

type Action =
  | { type: "SET_BASIC_INFO"; payload: Partial<ProgramBuilderState> }
  | { type: "SET_PRICING"; payload: { price: number; pricingType: "one_time" | "subscription" } }
  | { type: "ADD_WORKOUT"; payload: Workout }
  | { type: "UPDATE_WORKOUT"; payload: { id: string; updates: Partial<Workout> } }
  | { type: "DELETE_WORKOUT"; payload: string }
  | { type: "MOVE_WORKOUT_UP"; payload: string }
  | { type: "MOVE_WORKOUT_DOWN"; payload: string }
  | { type: "ADD_EXERCISE_TO_WORKOUT"; payload: { workoutId: string; exercise: WorkoutExercise } }
  | { type: "UPDATE_EXERCISE"; payload: { workoutId: string; exerciseId: string; updates: Partial<WorkoutExercise> } }
  | { type: "DELETE_EXERCISE"; payload: { workoutId: string; exerciseId: string } }
  | { type: "MOVE_EXERCISE_UP"; payload: { workoutId: string; exerciseId: string } }
  | { type: "MOVE_EXERCISE_DOWN"; payload: { workoutId: string; exerciseId: string } }
  | { type: "RESET" };

const initialState: ProgramBuilderState = {
  name: "",
  description: null,
  basedOnTemplate: null,
  difficulty: "intermediate",
  durationWeeks: 8,
  daysPerWeek: 3,
  price: 0,
  pricingType: "one_time",
  workouts: [],
};

function programBuilderReducer(state: ProgramBuilderState, action: Action): ProgramBuilderState {
  switch (action.type) {
    case "SET_BASIC_INFO":
      return { ...state, ...action.payload };

    case "SET_PRICING":
      return { ...state, ...action.payload };

    case "ADD_WORKOUT":
      return { ...state, workouts: [...state.workouts, action.payload] };

    case "UPDATE_WORKOUT":
      return {
        ...state,
        workouts: state.workouts.map(w =>
          w.id === action.payload.id ? { ...w, ...action.payload.updates } : w
        ),
      };

    case "DELETE_WORKOUT":
      return {
        ...state,
        workouts: state.workouts.filter(w => w.id !== action.payload),
      };

    case "MOVE_WORKOUT_UP": {
      const index = state.workouts.findIndex(w => w.id === action.payload);
      if (index <= 0) return state;
      const newWorkouts = [...state.workouts];
      [newWorkouts[index - 1], newWorkouts[index]] = [newWorkouts[index], newWorkouts[index - 1]];
      return { ...state, workouts: newWorkouts.map((w, i) => ({ ...w, orderIndex: i })) };
    }

    case "MOVE_WORKOUT_DOWN": {
      const index = state.workouts.findIndex(w => w.id === action.payload);
      if (index === -1 || index >= state.workouts.length - 1) return state;
      const newWorkouts = [...state.workouts];
      [newWorkouts[index], newWorkouts[index + 1]] = [newWorkouts[index + 1], newWorkouts[index]];
      return { ...state, workouts: newWorkouts.map((w, i) => ({ ...w, orderIndex: i })) };
    }

    case "ADD_EXERCISE_TO_WORKOUT":
      return {
        ...state,
        workouts: state.workouts.map(w =>
          w.id === action.payload.workoutId
            ? { ...w, exercises: [...w.exercises, action.payload.exercise] }
            : w
        ),
      };

    case "UPDATE_EXERCISE":
      return {
        ...state,
        workouts: state.workouts.map(w =>
          w.id === action.payload.workoutId
            ? {
                ...w,
                exercises: w.exercises.map(e =>
                  e.id === action.payload.exerciseId ? { ...e, ...action.payload.updates } : e
                ),
              }
            : w
        ),
      };

    case "DELETE_EXERCISE":
      return {
        ...state,
        workouts: state.workouts.map(w =>
          w.id === action.payload.workoutId
            ? { ...w, exercises: w.exercises.filter(e => e.id !== action.payload.exerciseId) }
            : w
        ),
      };

    case "MOVE_EXERCISE_UP": {
      const workout = state.workouts.find(w => w.id === action.payload.workoutId);
      if (!workout) return state;
      const index = workout.exercises.findIndex(e => e.id === action.payload.exerciseId);
      if (index <= 0) return state;
      const newExercises = [...workout.exercises];
      [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
      return {
        ...state,
        workouts: state.workouts.map(w =>
          w.id === action.payload.workoutId
            ? { ...w, exercises: newExercises.map((e, i) => ({ ...e, orderIndex: i })) }
            : w
        ),
      };
    }

    case "MOVE_EXERCISE_DOWN": {
      const workout = state.workouts.find(w => w.id === action.payload.workoutId);
      if (!workout) return state;
      const index = workout.exercises.findIndex(e => e.id === action.payload.exerciseId);
      if (index === -1 || index >= workout.exercises.length - 1) return state;
      const newExercises = [...workout.exercises];
      [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
      return {
        ...state,
        workouts: state.workouts.map(w =>
          w.id === action.payload.workoutId
            ? { ...w, exercises: newExercises.map((e, i) => ({ ...e, orderIndex: i })) }
            : w
        ),
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

interface ProgramBuilderContextValue {
  state: ProgramBuilderState;
  dispatch: React.Dispatch<Action>;
  systemExercises: any[];
  customExercises: any[];
  allExercises: any[];
  isLoadingExercises: boolean;
}

const ProgramBuilderContext = createContext<ProgramBuilderContextValue | undefined>(undefined);

export function ProgramBuilderProvider({ children, initialMode }: { children: ReactNode; initialMode?: "template" | "scratch" }) {
  const [state, dispatch] = useReducer(programBuilderReducer, {
    ...initialState,
    basedOnTemplate: initialMode === "template" ? "strength_primary" : null,
  });

  // Load system exercises
  const { data: systemExercises = [], isLoading: loadingSystem } = useQuery<any[]>({
    queryKey: ["/api/exercises"],
  });

  // Load custom exercises
  const { data: customExercises = [], isLoading: loadingCustom } = useQuery<any[]>({
    queryKey: ["/api/trainer/custom-exercises"],
  });

  const allExercises = [...systemExercises, ...customExercises];
  const isLoadingExercises = loadingSystem || loadingCustom;

  return (
    <ProgramBuilderContext.Provider
      value={{
        state,
        dispatch,
        systemExercises,
        customExercises,
        allExercises,
        isLoadingExercises,
      }}
    >
      {children}
    </ProgramBuilderContext.Provider>
  );
}

export function useProgramBuilder() {
  const context = useContext(ProgramBuilderContext);
  if (!context) {
    throw new Error("useProgramBuilder must be used within ProgramBuilderProvider");
  }
  return context;
}

export type { ProgramBuilderState, Workout, WorkoutExercise };
