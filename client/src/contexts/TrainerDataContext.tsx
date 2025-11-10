import { createContext, useContext, useState, useMemo, useEffect, useRef, type ReactNode } from 'react';
import {
  mockClients,
  mockFeedback,
  mockMessages,
  mockWorkouts,
  getClientFeedback,
  getClientMessages,
  getClientWorkouts,
  getUnreadMessages,
  type MockClient,
  type MockFeedback,
  type MockMessage,
  type MockWorkout
} from '@/data/trainerMockData';

interface ExerciseUpdate {
  sets?: number;
  reps?: string;
  weight?: string;
  restSeconds?: number;
  tempo?: string;
  rpe?: number;
  rir?: number;
}

interface TrainerDataContextValue {
  clients: MockClient[];
  getClient: (id: string) => MockClient | undefined;
  getClientWorkouts: (clientId: string) => MockWorkout[];
  getClientFeedback: (clientId: string) => MockFeedback[];
  getClientMessages: (clientId: string) => MockMessage[];
  getUnreadMessages: (clientId: string) => MockMessage[];
  getClientCompletionRate: (clientId: string) => number;
  getClientNextWorkout: (clientId: string) => MockWorkout | null;
  getClientStreak: (clientId: string) => number;
  sendMessage: (clientId: string, message: string) => void;
  resolveFeedback: (feedbackId: string) => void;
  updateClientProgram: (clientId: string, newProgram: string) => void;
  updateExerciseParams: (clientId: string, workoutId: string, exerciseId: string, updates: ExerciseUpdate) => void;
  swapExercise: (clientId: string, workoutId: string, oldExerciseId: string, newExerciseName: string) => void;
}

const TrainerDataContext = createContext<TrainerDataContextValue | null>(null);

export function TrainerDataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState(mockClients);
  const [messages, setMessages] = useState(mockMessages);
  const [feedback, setFeedback] = useState(mockFeedback);
  const [workouts, setWorkouts] = useState(mockWorkouts);
  const performanceAlertsGenerated = useRef(false);

  const getClient = useMemo(() => {
    return (id: string) => clients.find(c => c.id === id);
  }, [clients]);

  const sendMessage = (clientId: string, message: string) => {
    const newMessage: MockMessage = {
      id: `msg-${Date.now()}`,
      clientId,
      sender: 'trainer',
      message,
      timestamp: new Date().toISOString(),
      read: true
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const resolveFeedback = (feedbackId: string) => {
    setFeedback(prev => prev.map(f => 
      f.id === feedbackId ? { ...f, resolved: true } : f
    ));
  };

  const getClientCompletionRate = (clientId: string) => {
    const clientWorkouts = workouts.filter(w => w.clientId === clientId);
    if (clientWorkouts.length === 0) return 0;
    const completed = clientWorkouts.filter(w => w.completed).length;
    return Math.round((completed / clientWorkouts.length) * 100);
  };

  const getClientNextWorkout = (clientId: string) => {
    const clientWorkouts = workouts
      .filter(w => w.clientId === clientId && !w.completed)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    return clientWorkouts[0] || null;
  };

  const getClientStreak = (clientId: string) => {
    const clientWorkouts = workouts
      .filter(w => w.clientId === clientId)
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
    
    let streak = 0;
    const now = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < clientWorkouts.length; i++) {
      const workout = clientWorkouts[i];
      const workoutDate = new Date(workout.scheduledDate);
      const daysDiff = Math.floor((now.getTime() - workoutDate.getTime()) / oneWeek);
      
      if (workout.completed && daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Helper function to parse weight from string (e.g., "185 lbs" -> 185)
  const parseWeight = (weightStr: string): number | null => {
    const match = weightStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  };

  // Helper function to parse rep range (e.g., "6-8" -> {min: 6, max: 8})
  const parseReps = (repsStr: string): { min: number; max: number } | null => {
    if (repsStr.toLowerCase() === 'bodyweight') return null;
    const match = repsStr.match(/(\d+)(-(\d+))?/);
    if (!match) return null;
    const min = parseInt(match[1]);
    const max = match[3] ? parseInt(match[3]) : min;
    return { min, max };
  };

  // Generate and persist performance alerts on mount (using useEffect to avoid StrictMode duplicates)
  useEffect(() => {
    if (performanceAlertsGenerated.current) return;
    
    const allPerformanceAlerts: MockFeedback[] = [];
    
    workouts.forEach(workout => {
      if (!workout.completed) return;
      
      workout.exercises.forEach(exercise => {
        if (!exercise.loggedSets || exercise.loggedSets.length === 0) return;
        
        const prescribedWeight = parseWeight(exercise.weight);
        const prescribedReps = parseReps(exercise.reps);
        
        exercise.loggedSets.forEach(loggedSet => {
          const { setNumber, reps: loggedReps, weight: loggedWeight } = loggedSet;
          
          // Incomplete set (null or 0 reps)
          if (loggedReps === null || loggedReps === 0) {
            allPerformanceAlerts.push({
              id: `perf-${workout.id}-${exercise.id}-${setNumber}-incomplete`,
              clientId: workout.clientId,
              workoutId: workout.id,
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              type: 'incomplete_set',
              message: `Set ${setNumber} not completed (skipped or 0 reps)`,
              date: workout.scheduledDate,
              resolved: false,
              setNumber,
              prescribedValue: exercise.reps,
              actualValue: '0'
            });
            return;
          }
          
          // Weight-based alerts
          if (prescribedWeight !== null && loggedWeight !== null) {
            if (loggedWeight < prescribedWeight) {
              allPerformanceAlerts.push({
                id: `perf-${workout.id}-${exercise.id}-${setNumber}-underweight`,
                clientId: workout.clientId,
                workoutId: workout.id,
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                type: 'underperformed_weight',
                message: `Set ${setNumber}: Did ${loggedWeight} lbs instead of prescribed ${prescribedWeight} lbs`,
                date: workout.scheduledDate,
                resolved: false,
                setNumber,
                prescribedValue: `${prescribedWeight} lbs`,
                actualValue: `${loggedWeight} lbs`
              });
            } else if (loggedWeight > prescribedWeight) {
              allPerformanceAlerts.push({
                id: `perf-${workout.id}-${exercise.id}-${setNumber}-overweight`,
                clientId: workout.clientId,
                workoutId: workout.id,
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                type: 'overperformed_weight',
                message: `Set ${setNumber}: Did ${loggedWeight} lbs (prescribed ${prescribedWeight} lbs) - Ready to progress!`,
                date: workout.scheduledDate,
                resolved: false,
                setNumber,
                prescribedValue: `${prescribedWeight} lbs`,
                actualValue: `${loggedWeight} lbs`
              });
            }
          }
          
          // Reps-based alerts
          if (prescribedReps && loggedReps) {
            if (loggedReps < prescribedReps.min) {
              allPerformanceAlerts.push({
                id: `perf-${workout.id}-${exercise.id}-${setNumber}-underreps`,
                clientId: workout.clientId,
                workoutId: workout.id,
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                type: 'underperformed_reps',
                message: `Set ${setNumber}: Did ${loggedReps} reps (prescribed ${exercise.reps})`,
                date: workout.scheduledDate,
                resolved: false,
                setNumber,
                prescribedValue: exercise.reps,
                actualValue: `${loggedReps}`
              });
            } else if (loggedReps > prescribedReps.max) {
              allPerformanceAlerts.push({
                id: `perf-${workout.id}-${exercise.id}-${setNumber}-overreps`,
                clientId: workout.clientId,
                workoutId: workout.id,
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                type: 'overperformed_reps',
                message: `Set ${setNumber}: Did ${loggedReps} reps (prescribed ${exercise.reps}) - Ready to progress!`,
                date: workout.scheduledDate,
                resolved: false,
                setNumber,
                prescribedValue: exercise.reps,
                actualValue: `${loggedReps}`
              });
            }
          }
        });
      });
    });
    
    setFeedback(prev => [...prev, ...allPerformanceAlerts]);
    performanceAlertsGenerated.current = true;
  }, [workouts]);

  const updateClientProgram = (clientId: string, newProgram: string) => {
    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, currentProgram: newProgram } : c
    ));
  };

  const updateExerciseParams = (clientId: string, workoutId: string, exerciseId: string, updates: ExerciseUpdate) => {
    setWorkouts(prev => prev.map(workout => {
      if (workout.id === workoutId && workout.clientId === clientId) {
        return {
          ...workout,
          exercises: workout.exercises.map(ex => 
            ex.id === exerciseId ? { ...ex, ...updates } : ex
          )
        };
      }
      return workout;
    }));
  };

  const swapExercise = (clientId: string, workoutId: string, oldExerciseId: string, newExerciseName: string) => {
    setWorkouts(prev => prev.map(workout => {
      if (workout.id === workoutId && workout.clientId === clientId) {
        return {
          ...workout,
          exercises: workout.exercises.map(ex => 
            ex.id === oldExerciseId ? { ...ex, name: newExerciseName } : ex
          )
        };
      }
      return workout;
    }));
  };

  const value: TrainerDataContextValue = {
    clients,
    getClient,
    getClientWorkouts: (clientId) => workouts.filter(w => w.clientId === clientId),
    getClientFeedback: (clientId) => feedback.filter(f => f.clientId === clientId && !f.resolved),
    getClientMessages: (clientId) => messages.filter(m => m.clientId === clientId).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
    getUnreadMessages: (clientId) => messages.filter(m => m.clientId === clientId && !m.read),
    getClientCompletionRate,
    getClientNextWorkout,
    getClientStreak,
    sendMessage,
    resolveFeedback,
    updateClientProgram,
    updateExerciseParams,
    swapExercise
  };

  return (
    <TrainerDataContext.Provider value={value}>
      {children}
    </TrainerDataContext.Provider>
  );
}

export function useTrainerData() {
  const context = useContext(TrainerDataContext);
  if (!context) {
    throw new Error('useTrainerData must be used within TrainerDataProvider');
  }
  return context;
}
