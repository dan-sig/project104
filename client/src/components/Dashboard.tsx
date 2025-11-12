import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Calendar, TrendingUp, History, Play, Flame, MessageSquare, Target, UserPlus, Sparkles } from "lucide-react";
import { format } from "date-fns";
import ThemeToggle from "./ThemeToggle";
import { getDailyQuote } from "@shared/motivationalQuotes";
import type { WorkoutProgram, ProgramWorkout, WorkoutSession } from "@shared/schema";

interface WorkoutWithExercises extends ProgramWorkout {
  exercises: any[];
}

interface ProgramWithWorkouts extends WorkoutProgram {
  workouts: WorkoutWithExercises[];
}

interface DashboardProps {
  onStartWorkout: () => void;
  onViewProgram: () => void;
  onViewHistory: () => void;
  onViewProgress: () => void;
}

export default function Dashboard({
  onStartWorkout,
  onViewProgram,
  onViewHistory,
  onViewProgress,
}: DashboardProps) {
  const { data: activeProgram, isLoading: isLoadingProgram } = useQuery<WorkoutProgram>({
    queryKey: ['/api/programs/active'],
  });

  const { data: fullProgram, isLoading: isLoadingFull } = useQuery<ProgramWithWorkouts>({
    queryKey: ['/api/programs', activeProgram?.id],
    enabled: !!activeProgram?.id,
  });

  const { data: workoutSessions, isLoading: isLoadingSessions } = useQuery<WorkoutSession[]>({
    queryKey: ['/api/workout-sessions'],
  });

  const { data: userAlerts, isLoading: isLoadingAlerts } = useQuery<{
    workoutStreak: number;
    unreadTrainerNotes: number;
    pendingInvites: number;
    programStatus: {
      hasActiveProgram: boolean;
      daysRemaining: number | null;
      programName: string | null;
    };
    totalAlerts: number;
  }>({
    queryKey: ['/api/user/alerts'],
  });

  const isLoading = isLoadingProgram || isLoadingFull || isLoadingSessions || isLoadingAlerts;

  const completedWorkouts = workoutSessions?.filter(s => s.status === 'complete')?.length || 0;
  const totalWorkouts = (fullProgram?.durationWeeks || 0) * (fullProgram?.workouts?.length || 0);
  
  // Calculate current week from calendar dates
  const programStartDate = workoutSessions && workoutSessions.length > 0
    ? workoutSessions
        .filter(s => s.scheduledDate)
        .map(s => new Date(s.scheduledDate!))
        .sort((a, b) => a.getTime() - b.getTime())[0]
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate current week's date range (Monday to Sunday)
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday is 6 days from Monday
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const currentWeekRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
  
  const weekProgress = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;
  
  const nextWorkout = fullProgram?.workouts?.[0]?.workoutName || "Your First Workout";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Morphit</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 space-y-6">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Card className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-2 w-full mb-2" />
            <Skeleton className="h-4 w-32" />
          </Card>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-8 w-8 mb-3" />
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Morphit</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">Ready to crush your next workout?</p>
        </div>

        {/* Daily Motivational Quote */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5" data-testid="card-daily-quote">
          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="text-lg italic text-foreground" data-testid="text-motivational-quote">
                "{getDailyQuote()}"
              </p>
            </div>
          </div>
        </Card>

        {/* Alert Cards */}
        {userAlerts && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Workout Streak */}
            <Card className="p-6 border-l-4 border-l-green-500" data-testid="card-workout-streak">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Flame className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold">Workout Streak</h3>
                    <p className="text-sm text-muted-foreground">Keep the momentum going</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-lg font-bold" data-testid="badge-streak-count">
                  {userAlerts.workoutStreak} {userAlerts.workoutStreak === 1 ? 'day' : 'days'}
                </Badge>
              </div>
            </Card>

            {/* Trainer Notes */}
            {userAlerts.unreadTrainerNotes > 0 && (
              <Card className="p-6 border-l-4 border-l-blue-500" data-testid="card-trainer-notes">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Trainer Notes</h3>
                      <p className="text-sm text-muted-foreground">New guidance from your trainer</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-500/10" data-testid="badge-notes-count">
                    {userAlerts.unreadTrainerNotes}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewHistory}
                  data-testid="button-view-notes"
                >
                  View Notes
                </Button>
              </Card>
            )}

            {/* Program Status */}
            {userAlerts.programStatus.hasActiveProgram ? (
              <Card className="p-6 border-l-4 border-l-green-500" data-testid="card-program-status">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold">Program Status</h3>
                      <p className="text-sm text-muted-foreground">
                        {userAlerts.programStatus.programName}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10" data-testid="badge-days-remaining">
                    {userAlerts.programStatus.daysRemaining !== null 
                      ? `${userAlerts.programStatus.daysRemaining} days left`
                      : 'Active'}
                  </Badge>
                </div>
              </Card>
            ) : (
              <Card className="p-6 border-l-4 border-l-yellow-500" data-testid="card-no-program">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold">No Active Program</h3>
                      <p className="text-sm text-muted-foreground">Start your fitness journey</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-start-program"
                >
                  Generate Program
                </Button>
              </Card>
            )}

            {/* Pending Invites */}
            {userAlerts.pendingInvites > 0 && (
              <Card className="p-6 border-l-4 border-l-purple-500" data-testid="card-pending-invites">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-6 w-6 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">Pending Invites</h3>
                      <p className="text-sm text-muted-foreground">Trainer connection requests</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-purple-500/10" data-testid="badge-invites-count">
                    {userAlerts.pendingInvites}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-view-invites"
                >
                  View Invites
                </Button>
              </Card>
            )}
          </div>
        )}

        {fullProgram ? (
          <>
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1" data-testid="text-program-name">{fullProgram.programType}</h3>
                  <p className="text-muted-foreground" data-testid="text-program-week">
                    {currentWeekRange} • {fullProgram.durationWeeks} week program
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={onViewProgram}
                  data-testid="button-view-program"
                >
                  View Program
                </Button>
              </div>
              
              <Progress value={weekProgress} className="h-2 mb-2" data-testid="progress-program" />
              <p className="text-sm text-muted-foreground" data-testid="text-workouts-completed">
                {completedWorkouts} of {totalWorkouts} workouts completed
              </p>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6">
                <Calendar className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Next Workout</h3>
                <p className="text-2xl font-bold mb-3" data-testid="text-next-workout">{nextWorkout}</p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={onStartWorkout}
                  data-testid="button-start-workout"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Workout
                </Button>
              </Card>

              <Card className="p-6 hover-elevate cursor-pointer" onClick={onViewHistory} data-testid="card-history">
                <History className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Workout History</h3>
                <p className="text-2xl font-bold mb-3" data-testid="text-completed-count">{completedWorkouts}</p>
                <p className="text-sm text-muted-foreground">Total workouts completed</p>
              </Card>

              <Card className="p-6 hover-elevate cursor-pointer" onClick={onViewProgress} data-testid="card-progress">
                <TrendingUp className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Progress</h3>
                <p className="text-2xl font-bold mb-3" data-testid="text-progress-percent">
                  {weekProgress > 0 ? `${Math.round(weekProgress)}%` : "0%"}
                </p>
                <p className="text-sm text-muted-foreground">Program completion</p>
              </Card>
            </div>
          </>
        ) : (
          <Card className="p-6">
            <p className="text-muted-foreground">No active program found. Please complete the onboarding to generate your first program.</p>
          </Card>
        )}
      </main>
    </div>
  );
}
