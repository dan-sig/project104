// Mock data for trainer UI prototype - no backend functionality

export interface MockClient {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'active' | 'inactive' | 'pending';
  joinedDate: string;
  lastWorkout: string | null;
  currentProgram: string | null;
  unreadMessages: number;
  alertsCount: number;
  goals: string;
  daysPerWeek: number;
  sessionDuration: string;
  equipment: string[];
}

export interface MockFeedback {
  id: string;
  clientId: string;
  workoutId: string;
  exerciseId: string;
  exerciseName: string;
  type: 'pain' | 'dislike' | 'too_heavy' | 'too_light' | 'form_issue';
  message: string;
  date: string;
  resolved: boolean;
}

export interface MockMessage {
  id: string;
  clientId: string;
  sender: 'trainer' | 'client';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface MockExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  restSeconds: number;
  tempo?: string;
  rpe?: number;
  rir?: number;
  hasFeedback: boolean;
  feedbackType?: 'pain' | 'dislike' | 'too_heavy' | 'too_light';
  notes?: string;
}

export interface MockWorkout {
  id: string;
  clientId: string;
  name: string;
  scheduledDate: string;
  completed: boolean;
  exercises: MockExercise[];
  duration?: number;
  clientNotes?: string;
}

export const mockClients: MockClient[] = [
  {
    id: 'client-1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    avatar: 'SJ',
    status: 'active',
    joinedDate: '2025-10-15',
    lastWorkout: '2025-11-08',
    currentProgram: 'Morphit Build - Week 2',
    unreadMessages: 2,
    alertsCount: 3,
    goals: 'Build muscle and strength',
    daysPerWeek: 4,
    sessionDuration: '45-60 minutes',
    equipment: ['Barbell', 'Dumbbells', 'Machines', 'Bench']
  },
  {
    id: 'client-2',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    avatar: 'MC',
    status: 'active',
    joinedDate: '2025-09-20',
    lastWorkout: '2025-11-07',
    currentProgram: 'Morphit Strong - Week 3',
    unreadMessages: 0,
    alertsCount: 1,
    goals: 'Increase strength, improve athletic performance',
    daysPerWeek: 5,
    sessionDuration: '60-75 minutes',
    equipment: ['Barbell', 'Dumbbells', 'Kettlebells', 'Pull-up Bar']
  },
  {
    id: 'client-3',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    avatar: 'ER',
    status: 'active',
    joinedDate: '2025-11-01',
    lastWorkout: '2025-11-08',
    currentProgram: 'Morphit Flow - Week 1',
    unreadMessages: 1,
    alertsCount: 0,
    goals: 'Weight loss and general fitness',
    daysPerWeek: 3,
    sessionDuration: '30-45 minutes',
    equipment: ['Dumbbells', 'Resistance Bands', 'Yoga Mat']
  },
  {
    id: 'client-4',
    name: 'David Thompson',
    email: 'dthompson@email.com',
    avatar: 'DT',
    status: 'inactive',
    joinedDate: '2025-08-10',
    lastWorkout: '2025-10-28',
    currentProgram: 'Morphit Move - Week 4',
    unreadMessages: 0,
    alertsCount: 0,
    goals: 'Mobility and longevity',
    daysPerWeek: 3,
    sessionDuration: '30-45 minutes',
    equipment: ['Bodyweight', 'Resistance Bands', 'Foam Roller']
  },
  {
    id: 'client-5',
    name: 'Jessica Martinez',
    email: 'jmartinez@email.com',
    avatar: 'JM',
    status: 'active',
    joinedDate: '2025-10-25',
    lastWorkout: '2025-11-08',
    currentProgram: 'Morphit Build - Week 1',
    unreadMessages: 3,
    alertsCount: 2,
    goals: 'Muscle gain and body recomposition',
    daysPerWeek: 4,
    sessionDuration: '45-60 minutes',
    equipment: ['Barbell', 'Dumbbells', 'Machines', 'Cable Machine']
  }
];

export const mockFeedback: MockFeedback[] = [
  {
    id: 'fb-1',
    clientId: 'client-1',
    workoutId: 'workout-1',
    exerciseId: 'ex-1',
    exerciseName: 'Barbell Back Squat',
    type: 'pain',
    message: 'Felt sharp pain in left knee during descent',
    date: '2025-11-07',
    resolved: false
  },
  {
    id: 'fb-2',
    clientId: 'client-1',
    workoutId: 'workout-2',
    exerciseId: 'ex-5',
    exerciseName: 'Overhead Press',
    type: 'too_heavy',
    message: 'Struggled to complete last 2 sets, weight feels too heavy',
    date: '2025-11-08',
    resolved: false
  },
  {
    id: 'fb-3',
    clientId: 'client-1',
    workoutId: 'workout-1',
    exerciseId: 'ex-8',
    exerciseName: 'Bulgarian Split Squat',
    type: 'dislike',
    message: 'Really dislike this exercise, balance issues',
    date: '2025-11-06',
    resolved: false
  },
  {
    id: 'fb-4',
    clientId: 'client-2',
    workoutId: 'workout-3',
    exerciseId: 'ex-12',
    exerciseName: 'Deadlift',
    type: 'form_issue',
    message: 'Not sure if form is correct, lower back feels strained',
    date: '2025-11-07',
    resolved: false
  },
  {
    id: 'fb-5',
    clientId: 'client-5',
    workoutId: 'workout-5',
    exerciseId: 'ex-15',
    exerciseName: 'Bench Press',
    type: 'too_light',
    message: 'Weight feels too easy, not challenging enough',
    date: '2025-11-08',
    resolved: false
  },
  {
    id: 'fb-6',
    clientId: 'client-5',
    workoutId: 'workout-5',
    exerciseId: 'ex-17',
    exerciseName: 'Face Pulls',
    type: 'dislike',
    message: 'Prefer a different rear delt exercise',
    date: '2025-11-08',
    resolved: false
  }
];

export const mockMessages: MockMessage[] = [
  {
    id: 'msg-1',
    clientId: 'client-1',
    sender: 'client',
    message: 'Hey! I felt some knee pain during squats today. Should I be worried?',
    timestamp: '2025-11-07T14:30:00',
    read: false
  },
  {
    id: 'msg-2',
    clientId: 'client-1',
    sender: 'trainer',
    message: 'Thanks for letting me know. Let\'s switch to goblet squats for now while we work on your form. I\'ll adjust your program.',
    timestamp: '2025-11-07T15:45:00',
    read: true
  },
  {
    id: 'msg-3',
    clientId: 'client-1',
    sender: 'client',
    message: 'Sounds good! Also, the overhead press weight feels really heavy this week.',
    timestamp: '2025-11-08T09:15:00',
    read: false
  },
  {
    id: 'msg-4',
    clientId: 'client-3',
    sender: 'client',
    message: 'Completed my first week! Feeling great 💪',
    timestamp: '2025-11-08T18:00:00',
    read: false
  },
  {
    id: 'msg-5',
    clientId: 'client-5',
    sender: 'client',
    message: 'Quick question - can we add more back exercises to my program?',
    timestamp: '2025-11-08T10:30:00',
    read: false
  },
  {
    id: 'msg-6',
    clientId: 'client-5',
    sender: 'trainer',
    message: 'Absolutely! I\'ll add some rows and pull-ups to your next workout. How\'s the current volume feeling?',
    timestamp: '2025-11-08T11:00:00',
    read: true
  },
  {
    id: 'msg-7',
    clientId: 'client-5',
    sender: 'client',
    message: 'Great! I can definitely handle more volume for back.',
    timestamp: '2025-11-08T11:15:00',
    read: false
  },
  {
    id: 'msg-8',
    clientId: 'client-2',
    sender: 'trainer',
    message: 'Great progress this week! Your numbers are going up consistently.',
    timestamp: '2025-11-06T16:00:00',
    read: true
  },
  {
    id: 'msg-9',
    clientId: 'client-2',
    sender: 'client',
    message: 'Thanks! Feeling strong. Ready for Week 4.',
    timestamp: '2025-11-07T08:00:00',
    read: true
  }
];

const mockWorkoutsByClient: Record<string, Omit<MockWorkout, 'clientId'>[]> = {
  'client-1': [
    {
      id: 'workout-1',
      name: 'Lower Body Strength',
      scheduledDate: '2025-11-06',
      completed: true,
      duration: 52,
      clientNotes: 'Knee pain during squats, had to stop early',
      exercises: [
        {
          id: 'ex-1',
          name: 'Barbell Back Squat',
          sets: 4,
          reps: '6-8',
          weight: '185 lbs',
          restSeconds: 180,
          hasFeedback: true,
          feedbackType: 'pain',
          notes: 'Sharp knee pain - needs attention'
        },
        {
          id: 'ex-2',
          name: 'Romanian Deadlift',
          sets: 3,
          reps: '8-10',
          weight: '155 lbs',
          restSeconds: 120,
          hasFeedback: false
        },
        {
          id: 'ex-8',
          name: 'Bulgarian Split Squat',
          sets: 3,
          reps: '10-12',
          weight: '40 lbs',
          restSeconds: 90,
          hasFeedback: true,
          feedbackType: 'dislike',
          notes: 'Client dislikes this exercise'
        },
        {
          id: 'ex-3',
          name: 'Leg Press',
          sets: 3,
          reps: '12-15',
          weight: '270 lbs',
          restSeconds: 90,
          hasFeedback: false
        },
        {
          id: 'ex-4',
          name: 'Leg Curl',
          sets: 3,
          reps: '12-15',
          weight: '70 lbs',
          restSeconds: 60,
          hasFeedback: false
        }
      ]
    },
    {
      id: 'workout-2',
      name: 'Upper Body Push',
      scheduledDate: '2025-11-08',
      completed: true,
      duration: 48,
      exercises: [
        {
          id: 'ex-5',
          name: 'Overhead Press',
          sets: 4,
          reps: '6-8',
          weight: '95 lbs',
          restSeconds: 150,
          hasFeedback: true,
          feedbackType: 'too_heavy',
          notes: 'Weight too heavy for current strength level'
        },
        {
          id: 'ex-6',
          name: 'Bench Press',
          sets: 4,
          reps: '8-10',
          weight: '115 lbs',
          restSeconds: 120,
          hasFeedback: false
        },
        {
          id: 'ex-7',
          name: 'Incline Dumbbell Press',
          sets: 3,
          reps: '10-12',
          weight: '45 lbs',
          restSeconds: 90,
          hasFeedback: false
        }
      ]
    },
    {
      id: 'workout-3',
      name: 'Pull Day',
      scheduledDate: '2025-11-10',
      completed: false,
      exercises: [
        {
          id: 'ex-9',
          name: 'Barbell Row',
          sets: 4,
          reps: '8-10',
          weight: '125 lbs',
          restSeconds: 120,
          hasFeedback: false
        },
        {
          id: 'ex-10',
          name: 'Pull-Ups',
          sets: 3,
          reps: '6-8',
          weight: 'Bodyweight',
          restSeconds: 120,
          hasFeedback: false
        },
        {
          id: 'ex-11',
          name: 'Face Pulls',
          sets: 3,
          reps: '15-20',
          weight: '40 lbs',
          restSeconds: 60,
          hasFeedback: false
        }
      ]
    }
  ],
  'client-2': [
    {
      id: 'workout-3',
      name: 'Heavy Lower',
      scheduledDate: '2025-11-07',
      completed: true,
      duration: 65,
      exercises: [
        {
          id: 'ex-12',
          name: 'Deadlift',
          sets: 5,
          reps: '3-5',
          weight: '315 lbs',
          restSeconds: 240,
          hasFeedback: true,
          feedbackType: 'pain',
          notes: 'Form check needed - lower back strain'
        },
        {
          id: 'ex-13',
          name: 'Front Squat',
          sets: 4,
          reps: '6-8',
          weight: '205 lbs',
          restSeconds: 180,
          hasFeedback: false
        }
      ]
    }
  ],
  'client-5': [
    {
      id: 'workout-5',
      name: 'Push/Pull',
      scheduledDate: '2025-11-08',
      completed: true,
      duration: 55,
      exercises: [
        {
          id: 'ex-15',
          name: 'Bench Press',
          sets: 4,
          reps: '8-10',
          weight: '95 lbs',
          restSeconds: 120,
          hasFeedback: true,
          feedbackType: 'too_light',
          notes: 'Ready for weight increase'
        },
        {
          id: 'ex-16',
          name: 'Cable Row',
          sets: 4,
          reps: '10-12',
          weight: '110 lbs',
          restSeconds: 90,
          hasFeedback: false
        },
        {
          id: 'ex-17',
          name: 'Face Pulls',
          sets: 3,
          reps: '15-20',
          weight: '50 lbs',
          restSeconds: 60,
          hasFeedback: true,
          feedbackType: 'dislike',
          notes: 'Prefers different exercise'
        }
      ]
    }
  ]
};

// Helper function to get unread messages for a client
export function getUnreadMessages(clientId: string): MockMessage[] {
  return mockMessages.filter(m => m.clientId === clientId && !m.read && m.sender === 'client');
}

// Helper function to get feedback for a client
export function getClientFeedback(clientId: string): MockFeedback[] {
  return mockFeedback.filter(f => f.clientId === clientId && !f.resolved);
}

// Helper function to get messages for a client
export function getClientMessages(clientId: string): MockMessage[] {
  return mockMessages
    .filter(m => m.clientId === clientId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// Flatten workouts into a single array with clientId
export const mockWorkouts: MockWorkout[] = Object.entries(mockWorkoutsByClient).flatMap(
  ([clientId, workouts]) => workouts.map(workout => ({ ...workout, clientId }))
);

// Helper function to get workouts for a client
export function getClientWorkouts(clientId: string): MockWorkout[] {
  return mockWorkouts.filter(w => w.clientId === clientId);
}
