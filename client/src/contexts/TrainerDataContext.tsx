import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
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
