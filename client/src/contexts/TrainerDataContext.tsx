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

interface TrainerDataContextValue {
  clients: MockClient[];
  getClient: (id: string) => MockClient | undefined;
  getClientWorkouts: (clientId: string) => MockWorkout[];
  getClientFeedback: (clientId: string) => MockFeedback[];
  getClientMessages: (clientId: string) => MockMessage[];
  getUnreadMessages: (clientId: string) => MockMessage[];
  sendMessage: (clientId: string, message: string) => void;
  resolveFeedback: (feedbackId: string) => void;
  updateExercise: (clientId: string, workoutId: string, exerciseId: string, updates: any) => void;
}

const TrainerDataContext = createContext<TrainerDataContextValue | null>(null);

export function TrainerDataProvider({ children }: { children: ReactNode }) {
  const [clients] = useState(mockClients);
  const [messages, setMessages] = useState(mockMessages);
  const [feedback, setFeedback] = useState(mockFeedback);

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

  const updateExercise = (clientId: string, workoutId: string, exerciseId: string, updates: any) => {
    // For prototype, just log the action
    console.log('Exercise updated:', { clientId, workoutId, exerciseId, updates });
  };

  const value: TrainerDataContextValue = {
    clients,
    getClient,
    getClientWorkouts: (clientId) => getClientWorkouts(clientId),
    getClientFeedback: (clientId) => getClientFeedback(clientId).filter(f => !f.resolved),
    getClientMessages: (clientId) => getClientMessages(clientId),
    getUnreadMessages: (clientId) => getUnreadMessages(clientId),
    sendMessage,
    resolveFeedback,
    updateExercise
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
